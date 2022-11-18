import { useState } from "react";
import { Formik } from "formik";
import { differenceBy } from "lodash";
import * as Yup from "yup";
import { Form, FormFooter, FormContent } from "../../Form/Form";
import { Utf8Converter } from "@guardtime/common/lib/strings/Utf8Converter.js";
import CryptoJS from "crypto-js";
import { HDKey } from "@scure/bip32";
import { Uint64BE } from "int64-buffer";
import { mnemonicToSeedSync, entropyToMnemonic } from "bip39";
import * as secp from "@noble/secp256k1";

import Button from "../../Button/Button";
import Spacer from "../../Spacer/Spacer";
import Textfield from "../../Textfield/Textfield";
import { extractFormikError, getInt64Bytes } from "../../../utils/utils";
import Select from "../../Select/Select";
import { IAsset, IBill } from "../../../types/Types";
import { useApp } from "../../../hooks/appProvider";
import { useAuth } from "../../../hooks/useAuth";
import { useMakeTransaction } from "../../../hooks/api";

const BILLS = [
  {
    id: "0x00000000b219635baa33b1958a9cfa76ed4e59118214d5706216e84c388aa4b2",
    value: 100,
  },
  {
    id: "0x00000000c099673d4d795f50434934e445128bddb0beadf97d4ddfc86366f12c",
    value: 200,
  },
  {
    id: "0x00000000cb8ccb11b39fe08eeaee9331e62bf3b3faf432de5b075f28ba5a9480",
    value: 300,
  },
  {
    id: "0x00000000687ae2d3e46e20ed7257b35934a4a27dfd6a96c208474a976913873a",
    value: 40,
  },
  {
    id: "0x00000000c92434a241444091a5f31a7ee0f7a5e522a26d6742715821aece190f",
    value: 500,
  },
  {
    id: "0x00000000d475221b3c3cab785d9067d74b88ebc413617d203b3ac980e6237988",
    value: 10,
  },
];

function Send(): JSX.Element | null {
  const [currentTokenId, setCurrentTokenId] = useState<any>("");
  const { setIsActionsViewVisible, account, accounts, billsList, blockStats } =
    useApp();
  const { vault } = useAuth();
  const getSignedData = (data: any) => {
    return Uint8Array.from(Utf8Converter.ToBytes(JSON.stringify(data)));
  };

  return (
    <Formik
      initialValues={{
        assets: "",
        amount: 0,
        address: "",
        password: "",
      }}
      onSubmit={(values, { setErrors }) => {
        if (!vault) return;

        const decryptedVault = JSON.parse(
          CryptoJS.AES.decrypt(vault.toString(), values.password).toString(
            CryptoJS.enc.Latin1
          )
        );

        if (
          decryptedVault?.entropy.length > 16 &&
          decryptedVault?.entropy.length < 32 &&
          decryptedVault?.entropy.length % 4 === 0
        ) {
          return setErrors({ password: "Password is incorrect!" });
        }

        const mnemonic = entropyToMnemonic(decryptedVault?.entropy);
        const seed = mnemonicToSeedSync(mnemonic);
        const masterKey = HDKey.fromMasterSeed(seed);
        const accountIndex = accounts.length;
        const hashingKey = masterKey.derive(`m/44'/634'/${accountIndex}'/0/0`);
        const hashingPrivateKey = hashingKey.privateKey;
        const hashingPublicKey = hashingKey.publicKey;

        if (!hashingPrivateKey || !hashingPublicKey) return;

        let billsArr = BILLS;
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
          const billsInitialSum = selectedBills.reduce(
            (acc: number, obj: IBill) => {
              return acc + obj.value;
            },
            0
          );

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
              return setErrors({
                amount: `You don't have enough ` + currentTokenId.name + `'s`,
              });
              break;
            }
          } while (missingSum > 0);
        }

        const startByte = "53";
        const OpPushSig = "54";
        const OpPushPubKey = "55";
        const opDup = "76";
        const opHash = "a8";
        const opPushHash = "4f";
        const opCheckSig = "ac";
        const opEqual = "87";
        const opVerify = "69";
        const hash256Alg = "01";

        const address = values.address;
        const hash = CryptoJS.enc.Hex.parse(address);
        const SHA256 = CryptoJS.SHA256(hash);
        const newBearer = Buffer.from(
          startByte +
            opDup +
            opHash +
            hash256Alg +
            opPushHash +
            hash256Alg +
            SHA256.toString(CryptoJS.enc.Hex) +
            opEqual +
            opVerify +
            opVerify +
            opCheckSig +
            hash256Alg,
          "hex"
        ).toString("base64");

        const selectedBillsSum = selectedBills.reduce(
          (acc: number, obj: IBill) => {
            return acc + obj?.value;
          },
          0
        );
        const billsSumDifference = selectedBillsSum - values.amount;
        const billToSplit = findClosestBigger(
          selectedBills,
          billsSumDifference
        );
        const billsToTransfer = selectedBills.filter(
          (bill) => bill.id != billToSplit!.id
        );
        const splitBillAmount = billToSplit!.value - billsSumDifference;

        (async () => {
          const transferData = billsToTransfer.map((bill) => ({
            system_id: "AAAAAA==",
            unit_id: bill.id,
            type: "TransferOrder",
            attributes: {
              backlink: "AAABAQ==", // Bill block proof transaction_hash
              new_bearer: newBearer,
              target_value: new Uint64BE(bill.value),
            },
            timeout: new Uint64BE(blockStats.blockHeight),
            owner_proof: "AAAAAg==",
          }));

          const splitData = billToSplit
            ? {
                system_id: "AAAAAA==",
                unit_id: billToSplit.id,
                type: "SplitOrder",
                attributes: {
                  amount: new Uint64BE(splitBillAmount),
                  backlink: "AAABAQ==", // Bill block proof transaction_hash
                  target_bearer: newBearer,
                  remaining_value: billToSplit.value - splitBillAmount,
                },
                timeout: new Uint64BE(blockStats.blockHeight),
                owner_proof: "AAAAAg==",
              }
            : null;

          const testAttr = {
            system_id: Buffer.from("AAAAAA==", "base64"),
            unit_id: Buffer.from(
              "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAE=",
              "base64"
            ),
            timeout: new Uint64BE(blockStats.blockHeight),
            backlink: Buffer.from(
              "CCLSSbR2ofJXWF4N/A45a1VUNpvXoJd9s63YsFYREA0=",
              "base64"
            ),
            new_bearer: Buffer.from(
              "U3aoAU8BpecwP7Drs/OG3ZCIf2F7vwNDtV2IrybgUkXvmKjXoXKHaawB",
              "base64"
            ),
            target_value: new Uint64BE(133300),
          };

          const testPublicKey =
            "029e014f63fc5c2187fbd2c9963e1934413493108cf5c4f3edce835286ae5524fb";
          const msgHash = await secp.utils.sha256(
            secp.utils.concatBytes(
              testAttr.system_id,
              testAttr.unit_id,
              testAttr.timeout.toBuffer(),
              testAttr.backlink,
              testAttr.new_bearer,
              testAttr.target_value.toBuffer()
            )
          );
          const signature = await secp.sign(msgHash, hashingPrivateKey);
          const isValid = secp.verify(signature, msgHash, hashingPublicKey);
          const ownerProof = Buffer.from(
            startByte +
              OpPushSig +
              hash256Alg +
              Buffer.from(signature).toString("hex") +
              OpPushPubKey +
              hash256Alg +
              SHA256.toString(CryptoJS.enc.Hex),
            "hex"
          ).toString("base64");
        })();

        setIsActionsViewVisible(true);
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
