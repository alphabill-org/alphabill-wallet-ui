import { useCallback, useEffect, useRef, useState } from "react";
import { Formik } from "formik";
import * as Yup from "yup";
import { Form, FormFooter, FormContent } from "../../components/Form/Form";
import { useQueryClient } from "react-query";
import BigNumber from "bignumber.js";

import Button from "../../components/Button/Button";
import Spacer from "../../components/Spacer/Spacer";
import Textfield from "../../components/Textfield/Textfield";

import Select from "../../components/Select/Select";
import {
  IAsset,
  IBill,
  IBlockStats,
  ILockedBill,
  IProofTx,
  ITransfer,
} from "../../types/Types";
import { useApp } from "../../hooks/appProvider";
import { useAuth } from "../../hooks/useAuth";
import { getBlockHeight, makeTransaction } from "../../hooks/requests";

import {
  extractFormikError,
  getKeys,
  base64ToHexPrefixed,
  timeoutBlocks,
  createOwnerProof,
  createNewBearer,
  findClosestBigger,
  getOptimalBills,
  getBillsSum,
  convertToBigNumberString,
  moneyTypeURL,
  tokensTypeURL,
  startByte,
} from "../../utils/utils";
import { splitOrderHash, transferOrderHash } from "../../utils/hashers";

function Send(): JSX.Element | null {
  const {
    setIsActionsViewVisible,
    isActionsViewVisible,
    actionsView,
    account,
    billsList,
    lockedBills,
    selectedSendKey,
    setActionsView,
    setSelectedSendKey,
  } = useApp();
  const { vault, activeAccountId, setActiveAssetLocal, activeAsset } = useAuth();
  const queryClient = useQueryClient();
  const defaultAsset: { value: IAsset | undefined; label: string } = {
    value: account?.assets
      .filter((asset) => account?.activeNetwork === asset.network)
      .find((asset) => asset.typeId === "ALPHA"),
    label: "ALPHA",
  };
  const [selectedAsset, setSelectedAsset] = useState<IAsset | undefined>(
    defaultAsset?.value
  );

  const getAvailableAmount = useCallback(
    (decimalFactor: number) => {
      return convertToBigNumberString(
        billsList
          .filter(
            (bill: IBill) =>
              bill.isDCBill !== true &&
              !lockedBills?.find((b: ILockedBill) => b.billId === bill.id)
          )
          .reduce((acc: number, obj: IBill) => {
            return acc + obj?.value;
          }, 0),
        decimalFactor
      );
    },
    [billsList, lockedBills]
  );

  const [availableAmount, setAvailableAmount] = useState<string>(
    getAvailableAmount(selectedAsset?.decimalFactor || 1)
  );

  useEffect(() => {
    setAvailableAmount(getAvailableAmount(selectedAsset?.decimalFactor || 1));
  }, [selectedAsset, getAvailableAmount]);

  const lockedBillsAmount = billsList
    .filter((bill: IBill) =>
      lockedBills?.find((b: ILockedBill) => b.billId === bill.id)
    )
    .reduce((acc: number, obj: IBill) => {
      return acc + obj?.value;
    }, 0);
  const lockedAmountLabel =
    Number(lockedBillsAmount) > 0
      ? " ( Locked bills amount " +
        convertToBigNumberString(
          Number(lockedBillsAmount),
          selectedAsset?.decimalFactor || 1
        ) +
        " )"
      : "";

  const pollingInterval = useRef<NodeJS.Timeout | null>(null);
  const initialBlockHeight = useRef<number | null | undefined>(null);
  const balanceAfterSending = useRef<number | null>(null);

  const [isSending, setIsSending] = useState<boolean>(false);
  const addPollingInterval = () => {
    initialBlockHeight.current = null;
    pollingInterval.current = setInterval(() => {
      queryClient.invalidateQueries(["balance", activeAccountId]);
      queryClient.invalidateQueries(["billsList", activeAccountId]);
      queryClient.invalidateQueries([
        "tokenList",
        activeAccountId,
        activeAsset.typeId,
      ]);
      queryClient.invalidateQueries(["tokensList", activeAccountId]);
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
    }, 500);
  };

  useEffect(() => {
    if (selectedAsset?.amount === balanceAfterSending.current) {
      pollingInterval.current && clearInterval(pollingInterval.current);
      balanceAfterSending.current = null;
    } else if (
      balanceAfterSending.current === null &&
      pollingInterval.current &&
      !isSending
    ) {
      clearInterval(pollingInterval.current);
    }

    if (actionsView !== "Send" && pollingInterval.current) {
      clearInterval(pollingInterval.current);
    }
  }, [selectedAsset?.amount, isSending, actionsView]);

  if (!isActionsViewVisible) return <div></div>;

  return (
    <div className="w-100p">
      <Formik
        initialValues={{
          assets: {
            value: defaultAsset,
            label: "ALPHA",
          },
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

          const convertedAmount = new BigNumber(values.amount)
            .multipliedBy(selectedAsset?.decimalFactor || 1)
            .toNumber();
          const billsArr = selectedSendKey
            ? ([
                billsList?.find((bill: IBill) => bill.id === selectedSendKey),
              ] as IBill[])
            : (billsList?.filter(
                (bill: IBill) =>
                  bill.isDCBill !== false &&
                  !lockedBills?.find((b: ILockedBill) => b.billId === bill.id)
              ) as IBill[]);

          const selectedBills = getOptimalBills(convertedAmount, billsArr);
          const newBearer = createNewBearer(values.address);
          const billsSumDifference =
            getBillsSum(selectedBills) - convertedAmount;
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

          setIsSending(true);

          getBlockHeight().then(async (blockData) => {
            let transferType =
              tokensTypeURL + "TransferFungibleTokenAttributes";
            let splitType = tokensTypeURL + "SplitFungibleTokenAttributes";
            let systemId = "AAAAAg==";
            let amountField = "targetValue";
            let bearerField = "newBearer";
            let transferField = "value";

            if (selectedAsset?.typeId === "ALPHA") {
              transferType = moneyTypeURL + "TransferOrder";
              splitType = moneyTypeURL + "SplitOrder";
              systemId = "AAAAAA==";
              amountField = "amount";
              transferField = "targetValue";
            }

            billsToTransfer.map(async (bill, idx) => {
              const transferData: IProofTx = {
                systemId: systemId,
                unitId: bill.id,
                transactionAttributes: {
                  "@type": transferType,
                  newBearer: newBearer,
                  [transferField]: bill.value.toString(),
                  backlink: bill.txHash,
                },
                timeout: blockData.blockHeight + timeoutBlocks,
                ownerProof: "",
              };

              const isLastTransaction =
                billsToTransfer.length === idx + 1 &&
                !billToSplit &&
                !splitBillAmount;

              if (selectedAsset?.typeId !== "ALPHA") {
                transferData.transactionAttributes.invariantPredicateSignatures =
                  [Buffer.from(startByte, "hex").toString("base64")];
                transferData.transactionAttributes.type = bill.typeId;
              }

              handleValidation(
                await transferOrderHash(transferData),
                blockData,
                transferData as ITransfer,
                isLastTransaction
              );
            });

            if (billToSplit && splitBillAmount) {
              const splitData: IProofTx = {
                systemId: systemId,
                unitId: billToSplit.id,
                transactionAttributes: {
                  "@type": splitType,
                  [amountField]: splitBillAmount,
                  [bearerField]: newBearer,
                  remainingValue: billToSplit.value - splitBillAmount,
                  backlink: billToSplit.txHash,
                },
                timeout: blockData.blockHeight + timeoutBlocks,
                ownerProof: "",
              };

              if (selectedAsset?.typeId !== "ALPHA") {
                splitData.transactionAttributes.invariantPredicateSignatures = [
                  Buffer.from(startByte, "hex").toString("base64"),
                ];
                splitData.transactionAttributes.type = billToSplit.typeId;
              }

              handleValidation(
                await splitOrderHash(splitData),
                blockData,
                splitData as ITransfer,
                true
              );
            }
          });

          const handleValidation = async (
            msgHash: Uint8Array,
            blockData: IBlockStats,
            billData: ITransfer,
            isLastTransfer: boolean
          ) => {
            const proof = await createOwnerProof(
              msgHash,
              hashingPrivateKey,
              hashingPublicKey
            );

            let dataWithProof = Object.assign(billData, {
              ownerProof: proof.ownerProof,
              timeout: blockData.blockHeight + timeoutBlocks,
            });

            if (selectedAsset?.typeId !== "ALPHA") {
              dataWithProof = { transactions: [dataWithProof] } as any;
            }

            proof.isSignatureValid &&
              makeTransaction(
                dataWithProof,
                selectedAsset?.typeId === "ALPHA" ? "" : values.address
              )
                .then(() => {
                  const amount: number = Number(
                    billData?.transactionAttributes?.amount ||
                      billData?.transactionAttributes?.targetValue
                  );

                  balanceAfterSending.current = balanceAfterSending.current
                    ? balanceAfterSending.current - amount
                    : Number(selectedAsset?.amount) - amount;
                })
                .finally(() => {
                  if (isLastTransfer) {
                    addPollingInterval();
                    setIsSending(false);
                    setSelectedSendKey(null);
                    setIsActionsViewVisible(false);
                    resetForm();
                  }
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
            .required("Amount is required")
            .positive("Value must be greater than 0")
            .test(
              "is-decimal",
              "The amount should be a decimal with maximum " +
                selectedAsset?.decimalPlaces +
                " digits after decimal point",
              (val: any) => {
                const regexFloatString =
                  "^\\d+(\\.\\d{0," + selectedAsset?.decimalPlaces + "})?$";
                const regexFloat = new RegExp(regexFloatString);

                if (val !== undefined) {
                  return regexFloat.test(convertToBigNumberString(val));
                }
                return true;
              }
            )
            .test(
              "test less than",
              "Amount exceeds available assets",
              (value) =>
                selectedSendKey
                  ? true
                  : Number(value) <= Number(availableAmount)
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
                            type="button"
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
                            type="button"
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
                        (asset) =>
                          account?.activeNetwork === asset.network &&
                          asset.isSendable
                      )
                      .sort((a: IAsset, b: IAsset) => {
                        if (a?.name! < b?.name!) {
                          return -1;
                        }
                        if (a?.name! > b?.name!) {
                          return 1;
                        }
                        return 0;
                      })
                      .map((asset: IAsset) => ({
                        value: asset,
                        label: asset.name,
                      }))}
                    defaultValue={{
                      value: defaultAsset,
                      label: "ALPHA",
                    }}
                    error={extractFormikError(errors, touched, ["assets"])}
                    onChange={(_label, option: any) => {
                      setSelectedAsset(option);
                      queryClient.invalidateQueries([
                        "billsList",
                        activeAccountId,
                      ]);
                      queryClient.invalidateQueries([
                        "tokenList",
                        activeAccountId,
                        option.typeId || option.name,
                      ]);
                      queryClient.invalidateQueries([
                        "tokensList",
                        activeAccountId,
                      ]);
                      setActiveAssetLocal(
                        JSON.stringify({
                          name: option.name,
                          typeId: option.typeId || option.name,
                        })
                      );
                    }}
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
                      desc={
                        availableAmount +
                        " " +
                        values.assets?.label +
                        " available to send " +
                        lockedAmountLabel
                      }
                      type="text"
                      floatingFixedPoint={selectedAsset?.decimalPlaces}
                      error={extractFormikError(errors, touched, ["amount"])}
                      disabled={
                        !Boolean(values.assets) || Boolean(selectedSendKey)
                      }
                      value={
                        (selectedSendKey &&
                          (convertToBigNumberString(
                            Number(
                              billsList?.find(
                                (bill: IBill) => bill.id === selectedSendKey
                              )?.value
                            ),
                            selectedAsset?.decimalFactor
                          ) as string | undefined)) ||
                        ""
                      }
                      isNumberFloat
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
                  <Spacer mb={4} />
                </FormContent>
                <FormFooter>
                  <Button
                    big={true}
                    block={true}
                    type="submit"
                    variant="primary"
                    working={isSending}
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
            type="button"
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
