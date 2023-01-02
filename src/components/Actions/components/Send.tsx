import { useEffect, useRef, useState } from "react";
import { Formik } from "formik";
import { differenceBy } from "lodash";
import * as Yup from "yup";
import { Form, FormFooter, FormContent } from "../../Form/Form";
import CryptoJS from "crypto-js";
import { Uint64BE } from "int64-buffer";
import * as secp from "@noble/secp256k1";
import { useQueryClient } from "react-query";

import Button from "../../Button/Button";
import Spacer from "../../Spacer/Spacer";
import Textfield from "../../Textfield/Textfield";

import Select from "../../Select/Select";
import {
  IAsset,
  IBill,
  IBlockStats,
  ILockedBill,
  ITransfer,
} from "../../../types/Types";
import { useApp } from "../../../hooks/appProvider";
import { useAuth } from "../../../hooks/useAuth";
import { getBlockHeight, makeTransaction } from "../../../hooks/requests";

import {
  extractFormikError,
  getKeys,
  unit8ToHexPrefixed,
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
  base64ToHexPrefixed,
  timeoutBlocks,
} from "../../../utils/utils";

function Send(): JSX.Element | null {
  const {
    setIsActionsViewVisible,
    account,
    billsList,
    activeAccountId,
    lockedBills,
    selectedSendKey,
    setActionsView,
    setSelectedSendKey,
  } = useApp();
  const { vault } = useAuth();
  const queryClient = useQueryClient();
  const defaultAsset = selectedSendKey
    ? {
        value: account?.assets
          .filter((asset) => account?.activeNetwork === asset.network)
          .find((asset) => asset.id === "ALPHA"),
        label: account?.assets
          .filter((asset) => account?.activeNetwork === asset.network)
          .find((asset) => asset.id === "ALPHA")?.name,
      }
    : "";
  const abBalance =
    account?.assets.find((asset: IAsset) => (asset.id = "ALPHA"))?.amount || 0;

  const [currentTokenId, setCurrentTokenId] = useState<any>(
    defaultAsset ? defaultAsset?.value : ""
  );

  const [balanceAfterSending, setBalanceAfterSending] = useState<number | null>(
    null
  );

  const pollingInterval = useRef<NodeJS.Timeout | null>(null);
  const initialBlockHeight = useRef<number | null | undefined>(null);

  const addPollingInterval = () => {
    initialBlockHeight.current = null;
    pollingInterval.current = setInterval(() => {
      queryClient.invalidateQueries(["balance", activeAccountId]);
      getBlockHeight().then((blockData) => {
        if (!initialBlockHeight?.current) {
          initialBlockHeight.current = blockData.blockHeight;
        }

        if (
          Number(initialBlockHeight?.current) + timeoutBlocks <
          blockData.blockHeight
        ) {
          pollingInterval.current && clearInterval(pollingInterval.current);
        }
      });
    }, 1000);
  };

  useEffect(() => {
    if (abBalance === balanceAfterSending) {
      pollingInterval.current && clearInterval(pollingInterval.current);
      setBalanceAfterSending(null);
    }
  }, [abBalance, balanceAfterSending]);

  return (
    <div className="w-100p">
      <Formik
        initialValues={{
          assets: defaultAsset,
          amount: 0,
          address: "",
          password: "",
        }}
        onSubmit={(values, { setErrors, resetForm }) => {
          const { error, hashingPrivateKey, hashingPublicKey } = getKeys(
            values.password,
            Number(account.idx),
            vault
          );

          if (error || !hashingPrivateKey || !hashingPublicKey) {
            return setErrors({
              password: error || "Hashing keys are missing!",
            });
          }

          const billsArr = selectedSendKey
            ? ([
                billsList?.find((bill: IBill) => bill.id === selectedSendKey),
              ] as IBill[])
            : (billsList?.filter(
                (bill: IBill) =>
                  bill.isDCBill === false &&
                  !lockedBills?.find((b: ILockedBill) => b.billId === bill.id)
              ) as IBill[]);

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
            systemId: "AAAAAA==",
            unitId: bill.id,
            transactionAttributes: {
              "@type": "type.googleapis.com/rpc.TransferOrder",
              newBearer: newBearer,
              targetValue: bill.value.toString(),
              backlink: bill.txHash,
            },
          }));
          getBlockHeight().then(async (blockData) => {
            transferData.map(async (data, idx) => {
              const msgHash = await secp.utils.sha256(
                secp.utils.concatBytes(
                  Buffer.from(data.systemId, "base64"),
                  Buffer.from(data.unitId, "base64"),
                  new Uint64BE(
                    blockData.blockHeight + timeoutBlocks
                  ).toBuffer(),
                  Buffer.from(
                    data.transactionAttributes.newBearer as string,
                    "base64"
                  ),
                  new Uint64BE(
                    data.transactionAttributes.targetValue
                  ).toBuffer(),
                  Buffer.from(data.transactionAttributes.backlink, "base64")
                )
              );

              handleValidation(
                msgHash,
                blockData,
                data as ITransfer,
                !billToSplit && !splitBillAmount
              );
            });

            if (billToSplit && splitBillAmount) {
              const splitData: ITransfer = {
                systemId: "AAAAAA==",
                unitId: billToSplit.id,
                transactionAttributes: {
                  "@type": "type.googleapis.com/rpc.SplitOrder",
                  amount: splitBillAmount,
                  targetBearer: newBearer,
                  remainingValue: billToSplit.value - splitBillAmount,
                  backlink: billToSplit.txHash,
                },
                timeout: blockData.blockHeight + timeoutBlocks,
                ownerProof: "",
              };
              const msgHash = await secp.utils.sha256(
                secp.utils.concatBytes(
                  Buffer.from(splitData.systemId, "base64"),
                  Buffer.from(splitData.unitId, "base64"),
                  new Uint64BE(splitData.timeout).toBuffer(),
                  new Uint64BE(
                    splitData.transactionAttributes.amount
                  ).toBuffer(),
                  Buffer.from(
                    splitData.transactionAttributes.targetBearer as string,
                    "base64"
                  ),
                  new Uint64BE(
                    splitData.transactionAttributes.remainingValue
                  ).toBuffer(),
                  Buffer.from(billToSplit.txHash, "base64")
                )
              );

              handleValidation(msgHash, blockData, splitData, true);
            }

            setSelectedSendKey(null);
            setIsActionsViewVisible(false);
            resetForm();
          });

          const handleValidation = async (
            msgHash: Uint8Array,
            blockData: IBlockStats,
            billData: ITransfer,
            isLastTransfer?: boolean
          ) => {
            const signature = await secp.sign(msgHash, hashingPrivateKey, {
              der: false,
              recovered: true,
            });

            const isValid = secp.verify(
              signature[0],
              msgHash,
              hashingPublicKey
            );

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
                unit8ToHexPrefixed(hashingPublicKey).substring(2),
              "hex"
            ).toString("base64");

            const dataWithProof = Object.assign(billData, {
              ownerProof: ownerProof,
              timeout: blockData.blockHeight + timeoutBlocks,
            });

            isValid &&
              makeTransaction(dataWithProof).then(() => {
                isLastTransfer && addPollingInterval();
                const amount: number = Number(
                  billData?.transactionAttributes?.amount ||
                    billData?.transactionAttributes?.targetValue
                );
                setBalanceAfterSending(
                  balanceAfterSending
                    ? balanceAfterSending - amount
                    : abBalance - amount
                );
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
            )
            .test(
              "account-id-correct",
              `Address in not in valid format`,
              function (value) {
                if (!value || !Boolean(value.match(/^0x[0-9A-Fa-f]{66}$/))) {
                  return false;
                } else {
                  return true;
                }
              }
            ),
          password: Yup.string().required("Password is required"),
          amount: Yup.number()
            .positive("Value must be greater than 0.")
            .test(
              "test less than",
              `You don't have enough ` + currentTokenId.name + `'s`,
              (value) =>
                Number(value) <=
                Number(
                  billsList
                    .filter(
                      (bill: IBill) =>
                        bill.isDCBill === false &&
                        !lockedBills?.find(
                          (b: ILockedBill) => b.billId === bill.id
                        )
                    )
                    .reduce((acc: number, obj: IBill) => {
                      return acc + obj?.value;
                    }, 0)
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
                  {selectedSendKey && (
                    <>
                      {selectedSendKey && (
                        <div className="t-medium-small">
                          You have selected a specific bill with a value of{" "}
                          {
                            billsList?.find(
                              (bill: IBill) => bill.id === selectedSendKey
                            )?.value
                          }
                          . You can deselect it by clicking{" "}
                          <Button
                            onClick={() => setSelectedSendKey(null)}
                            variant="link"
                          >
                            REMOVE BILL
                          </Button>{" "}
                          or select a new bill from the{" "}
                          <Button
                            onClick={() => {
                              setActionsView("Bills List");
                              setIsActionsViewVisible(true);
                              queryClient.invalidateQueries([
                                "billsList",
                                activeAccountId,
                              ]);
                            }}
                            variant="link"
                          >
                            BILLS LIST
                          </Button>{" "}
                          .
                        </div>
                      )}
                      <Spacer mt={16} />
                      <Textfield
                        id="selectedBillId"
                        name="selectedBillId"
                        label="SELECTED BILL ID"
                        type="selectedBillId"
                        value={base64ToHexPrefixed(selectedSendKey)}
                      />
                      <Spacer mb={16} />
                    </>
                  )}
                  <Select
                    label="Assets"
                    name="assets"
                    className={selectedSendKey ? "d-none" : ""}
                    options={account?.assets
                      .filter(
                        (asset) => account?.activeNetwork === asset.network
                      )
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
                  <Spacer mb={8} />
                  {selectedSendKey && (
                    <div>
                      <Spacer mt={8} />
                      <div className="t-medium c-primary">
                        ADD RECEIVER ADDRESS & PASSWORD
                      </div>

                      <Spacer mb={16} />
                    </div>
                  )}
                  <Textfield
                    id="address"
                    name="address"
                    label="Address"
                    type="address"
                    error={extractFormikError(errors, touched, ["address"])}
                  />
                  <Spacer mb={8} />

                  <div className={selectedSendKey ? "d-none" : ""}>
                    <Textfield
                      id="amount"
                      name="amount"
                      label="Amount"
                      type="number"
                      error={extractFormikError(errors, touched, ["amount"])}
                      disabled={
                        !Boolean(values.assets) || Boolean(selectedSendKey)
                      }
                      value={
                        selectedSendKey &&
                        billsList?.find(
                          (bill: IBill) => bill.id === selectedSendKey
                        )?.value
                      }
                    />
                    <Spacer mb={8} />
                  </div>
                  <Textfield
                    id="password"
                    name="password"
                    label="Password"
                    type="password"
                    error={extractFormikError(errors, touched, ["password"])}
                    disabled={
                      !Boolean(values.assets) && !Boolean(selectedSendKey)
                    }
                  />
                </FormContent>
                <FormFooter>
                  <Button
                    big={true}
                    block={true}
                    type="submit"
                    variant="primary"
                  >
                    Send
                  </Button>
                </FormFooter>
              </Form>
            </form>
          );
        }}
      </Formik>
      {!selectedSendKey && (
        <div className="t-medium-small pad-24-h">
          To select a specific bill open your{" "}
          <Button
            small
            onClick={() => {
              setActionsView("Bills List");
              setIsActionsViewVisible(true);
              queryClient.invalidateQueries(["billsList", activeAccountId]);
            }}
            variant="link"
          >
            BILLS LIST
          </Button>{" "}
          and select it from bills options.
        </div>
      )}
    </div>
  );
}

export default Send;
