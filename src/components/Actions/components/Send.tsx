import { useState } from "react";
import { Formik } from "formik";
import { differenceBy } from "lodash";
import * as Yup from "yup";
import { Form, FormFooter, FormContent } from "../../Form/Form";
import CryptoJS from "crypto-js";
import { Uint64BE } from "int64-buffer";
import * as secp from "@noble/secp256k1";
import { useQueryClient } from "react-query";
import axios from "axios";

import Button from "../../Button/Button";
import Spacer from "../../Spacer/Spacer";
import Textfield from "../../Textfield/Textfield";

import Select from "../../Select/Select";
import { IAsset, IBill, IBlockStats, ITransfer } from "../../../types/Types";
import { useApp } from "../../../hooks/appProvider";
import { useAuth } from "../../../hooks/useAuth";
import { getBlockHeight, makeTransaction } from "../../../hooks/requests";

import {
  extractFormikError,
  getKeys,
  pubKeyToHex,
  startByte,
  opPushSig,
  opPushPubKey,
  opDup,
  opHash,
  opPushHash,
  opCheckSig,
  opEqual,
  opVerify,
  sigScheme,
} from "../../../utils/utils";

function Send(): JSX.Element | null {
  const [currentTokenId, setCurrentTokenId] = useState<any>("");
  const { setIsActionsViewVisible, account, billsList, activeAccountId } =
    useApp();
  const { vault } = useAuth();
  const queryClient = useQueryClient();

  return (
    <Formik
      initialValues={{
        assets: "",
        amount: 0,
        address: "",
        password: "",
      }}
      onSubmit={(values, { setErrors }) => {
        const { error, hashingPrivateKey, hashingPublicKey } = getKeys(
          values.password,
          Number(account.idx),
          vault
        );

        if (error || !hashingPrivateKey || !hashingPublicKey) {
          return setErrors({ password: error || "Hashing keys are missing!" });
        }

        const billsArr = billsList.bills as IBill[];
        let selectedBills: IBill[] = [];
        const findClosestBigger = (bills: IBill[], target: number) =>
          bills
            .sort(function (a: IBill, b: IBill) {
              return a.value - b.value;
            })
            .find(({ value }) => value >= target);
        const getClosestSmaller = (bills: IBill[], target: number) =>
          bills.reduce((acc: IBill, obj: IBill) =>
            Math.abs(target - obj.value) < Math.abs(target - acc.value)
              ? obj
              : acc
          );

        if (Number(findClosestBigger(billsArr, values.amount)?.value) > 0) {
          selectedBills = selectedBills.concat([
            findClosestBigger(billsArr, values.amount) as IBill,
          ]);
        } else {
          const initialBill = getClosestSmaller(billsArr, values.amount);
          selectedBills = selectedBills.concat([initialBill]);
          let missingSum = Number(values.amount) - initialBill.value;

          do {
            const filteredBills = differenceBy(billsArr, selectedBills, "id");

            const filteredBillsSum = filteredBills.reduce(
              (acc: number, obj: IBill) => {
                return acc + obj?.value;
              },
              0
            );
            let addedSum;

            if (
              Number(
                findClosestBigger(filteredBills, Math.abs(missingSum))?.value
              ) > 0
            ) {
              const currentBill = findClosestBigger(
                filteredBills,
                Math.abs(missingSum)
              );
              selectedBills = selectedBills.concat([currentBill as IBill]);
              addedSum = currentBill?.value || 0;
            } else {
              const currentBill = getClosestSmaller(
                filteredBills,
                Math.abs(missingSum)
              );
              selectedBills = selectedBills.concat([currentBill]);
              addedSum = currentBill?.value || 0;
            }
            missingSum = missingSum - addedSum;
            if (filteredBillsSum <= 0) {
              break;
            }
          } while (missingSum > 0);
        }

        const address = values.address.startsWith("0x")
          ? values.address.substring(2)
          : values.address;
        const addressHash = CryptoJS.enc.Hex.parse(address);
        const SHA256 = CryptoJS.SHA256(addressHash);
        const newBearer = Buffer.from(
          startByte +
            opDup +
            opHash +
            sigScheme +
            opPushHash +
            sigScheme +
            SHA256.toString(CryptoJS.enc.Hex) +
            opEqual +
            opVerify +
            opCheckSig +
            sigScheme,
          "hex"
        ).toString("base64");

        const selectedBillsSum = selectedBills.reduce(
          (acc: number, obj: IBill) => {
            return acc + obj?.value;
          },
          0
        );
        const billsSumDifference = selectedBillsSum - values.amount;
        const billToSplit =
          billsSumDifference !== 0
            ? findClosestBigger(selectedBills, billsSumDifference)
            : null;
        const billsToTransfer = billToSplit
          ? selectedBills.filter((bill) => bill.id !== billToSplit?.id)
          : selectedBills;
        const splitBillAmount = billToSplit
          ? billToSplit?.value - billsSumDifference
          : null;

        const transferData = billsToTransfer.map((bill) => ({
          system_id: "AAAAAA==",
          unit_id: Buffer.from(bill.id.substring(2), "hex").toString("base64"),
          type: "TransferOrder",
          attributes: {
            new_bearer: newBearer,
            target_value: bill.value,
          },
        }));

        if (billToSplit && splitBillAmount) {
          axios
            .get<any>(
              `https://dev-ab-wallet-backend.abdev1.guardtime.com/block-proof?bill_id=${billToSplit.id}`
            )
            .then(async (proofData) => {
              getBlockHeight().then(async (blockData) => {
                const splitData: ITransfer = {
                  system_id: "AAAAAA==",
                  unit_id: Buffer.from(
                    billToSplit.id.substring(2),
                    "hex"
                  ).toString("base64"),
                  type: "SplitOrder",
                  attributes: {
                    amount: splitBillAmount,
                    target_bearer: newBearer,
                    remaining_value: billToSplit.value - splitBillAmount,
                  },
                  timeout: blockData.blockHeight + 42,
                  owner_proof: "",
                };
                const msgHash = await secp.utils.sha256(
                  secp.utils.concatBytes(
                    Buffer.from(splitData.system_id, "base64"),
                    Buffer.from(splitData.unit_id, "base64"),
                    new Uint64BE(splitData.timeout).toBuffer(),
                    new Uint64BE(splitData.attributes.amount).toBuffer(),
                    Buffer.from(
                      splitData.attributes.target_bearer as string,
                      "base64"
                    ),
                    new Uint64BE(
                      splitData.attributes.remaining_value
                    ).toBuffer(),
                    Buffer.from(
                      proofData.data.blockProof.transactions_hash,
                      "base64"
                    )
                  )
                );

                handleValidation(
                  msgHash,
                  blockData,
                  proofData.data.blockProof.transactions_hash,
                  splitData
                );
              });
            });
        }

        transferData.map(async (data) => {
          axios
            .get<any>(
              `https://dev-ab-wallet-backend.abdev1.guardtime.com/block-proof?bill_id=0x${Buffer.from(
                data.unit_id,
                "base64"
              ).toString("hex")}`
            )
            .then(async (proofData) => {
              getBlockHeight().then(async (blockData) => {
                const msgHash = await secp.utils.sha256(
                  secp.utils.concatBytes(
                    Buffer.from(data.system_id, "base64"),
                    Buffer.from(data.unit_id, "base64"),
                    new Uint64BE(blockData.blockHeight + 42).toBuffer(),
                    Buffer.from(data.attributes.new_bearer as string, "base64"),
                    new Uint64BE(data.attributes.target_value).toBuffer(),
                    Buffer.from(
                      proofData.data.blockProof.transactions_hash,
                      "base64"
                    )
                  )
                );

                handleValidation(
                  msgHash,
                  blockData,
                  proofData.data.blockProof.transactions_hash,
                  data as ITransfer
                );
              });
            });
        });

        const handleValidation = async (
          msgHash: Uint8Array,
          blockData: IBlockStats,
          backlink: string,
          billData: ITransfer
        ) => {
          const signature = await secp.sign(msgHash, hashingPrivateKey, {
            der: false,
            recovered: true,
          });

          const isValid = secp.verify(signature[0], msgHash, hashingPublicKey);

          const ownerProof = Buffer.from(
            startByte +
              opPushSig +
              sigScheme +
              Buffer.from(
                secp.utils.concatBytes(
                  signature[0],
                  Buffer.from([signature[1]])
                )
              ).toString("hex") +
              opPushPubKey +
              sigScheme +
              pubKeyToHex(hashingPublicKey).substring(2),
            "hex"
          ).toString("base64");

          const dataWithProof = Object.assign(billData, {
            owner_proof: ownerProof,
            timeout: blockData.blockHeight + 42,
            attributes: {
              ...billData.attributes,
              backlink: backlink,
            },
          });

          isValid &&
            makeTransaction(dataWithProof).then(() => {
              setIsActionsViewVisible(false);
              queryClient.invalidateQueries(["billsList", activeAccountId]);
              queryClient.invalidateQueries([
                "balance",
                pubKeyToHex(hashingPublicKey),
              ]);
            });
        };
      }}
      validationSchema={Yup.object().shape({
        assets: Yup.object().required("Selected asset is required"),
        address: Yup.string()
          .required("Address is required")
          .test(
            "account-id-same",
            `Receiver's account is your account`,
            function (value) {
              if (value) {
                return account?.pubKey !== value;
              } else {
                return true;
              }
            }
          ),
        password: Yup.string().test(
          "empty-or-8-characters-check",
          "password must be at least 8 characters",
          (password) => !password || password.length >= 8
        ),
        amount: Yup.number()
          .positive("Value must be greater than 0.")
          .test(
            "test less than",
            `You don't have enough ` + currentTokenId.name + `'s`,
            (value) =>
              Number(value) <=
              Number(
                account?.assets?.find(
                  (asset: IAsset) =>
                    asset?.id === currentTokenId.id &&
                    asset.network === account?.activeNetwork
                )?.amount
              )
          ),
      })}
    >
      {(formikProps) => {
        const { handleSubmit, errors, touched, values } = formikProps;

        return (
          <form className="pad-24" onSubmit={handleSubmit}>
            <Form>
              <FormContent>
                <Select
                  label="Assets"
                  name="assets"
                  options={account?.assets
                    .filter((asset) => account?.activeNetwork === asset.network)
                    .sort((a: IAsset, b: IAsset) => {
                      if (a?.id! < b?.id!) {
                        return -1;
                      }
                      if (a?.id! > b?.id!) {
                        return 1;
                      }
                      return 0;
                    })
                    .map((asset: IAsset) => ({
                      value: asset,
                      label: asset.name,
                    }))}
                  onChange={(label, value) => setCurrentTokenId(value)}
                  error={extractFormikError(errors, touched, ["assets"])}
                />
                <Spacer mb={16} />
                <Textfield
                  id="address"
                  name="address"
                  label="Address"
                  type="address"
                  error={extractFormikError(errors, touched, ["address"])}
                />
                <Spacer mb={16} />
                <Textfield
                  id="amount"
                  name="amount"
                  label="Amount"
                  type="number"
                  step="any"
                  floatingFixedPoint="2"
                  error={extractFormikError(errors, touched, ["amount"])}
                  disabled={!Boolean(values.assets)}
                />
                <Textfield
                  id="password"
                  name="password"
                  label="Password"
                  type="password"
                  error={extractFormikError(errors, touched, ["password"])}
                  disabled={!Boolean(values.assets)}
                />
              </FormContent>
              <FormFooter>
                <Button big={true} block={true} type="submit" variant="primary">
                  Send
                </Button>
              </FormFooter>
            </Form>
          </form>
        );
      }}
    </Formik>
  );
}

export default Send;
