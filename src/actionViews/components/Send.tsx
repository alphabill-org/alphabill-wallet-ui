import { useEffect, useRef, useState } from "react";
import { Formik } from "formik";
import * as Yup from "yup";
import { Form, FormFooter, FormContent } from "../../components/Form/Form";
import { useQueryClient } from "react-query";

import Button from "../../components/Button/Button";
import Spacer from "../../components/Spacer/Spacer";
import Textfield from "../../components/Textfield/Textfield";

import Select from "../../components/Select/Select";
import {
  IAsset,
  IBill,
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
  addDecimal,
  convertToWholeNumberBigInt,
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
  const { vault, activeAccountId } = useAuth();
  const queryClient = useQueryClient();
  const defaultAsset: { value: IAsset | undefined; label: string } = {
    value: account?.assets
      .filter((asset) => account?.activeNetwork === asset.network)
      .find((asset) => asset.id === "ALPHA"),
    label: "ALPHA",
  };
  const [selectedAsset, setSelectedAsset] = useState<IAsset | undefined>(
    defaultAsset.value
  );
  const activeAsset =
    account?.assets.find(
      (asset: IAsset) => (asset.id = selectedAsset?.id || "ALPHA")
    ) || account?.assets[0];

  const balance = activeAsset.amount;
  const decimalPlaces = activeAsset.decimalPlaces;
  const availableAmount = addDecimal(
    getBillsSum(
      billsList.filter(
        (bill: IBill) =>
          bill.isDcBill === false &&
          !lockedBills?.find((b: ILockedBill) => b.billId === bill.id)
      )
    ).toString(),
    decimalPlaces
  );

  const lockedBillsAmount = getBillsSum(
    billsList.filter((bill: IBill) =>
      lockedBills?.find((b: ILockedBill) => b.billId === bill.id)
    )
  ).toString();

  const lockedAmountLabel =
    Number(lockedBillsAmount) > 0
      ? " ( Locked bills amount " +
        addDecimal(lockedBillsAmount.toString(), decimalPlaces) +
        " )"
      : "";

  const pollingInterval = useRef<NodeJS.Timeout | null>(null);
  const initialBlockHeight = useRef<bigint | null | undefined>(null);
  const balanceAfterSending = useRef<bigint | null>(null);

  const [isSending, setIsSending] = useState<boolean>(false);
  const addPollingInterval = () => {
    initialBlockHeight.current = null;
    pollingInterval.current = setInterval(() => {
      queryClient.invalidateQueries(["balance", activeAccountId]);
      queryClient.invalidateQueries(["billsList", activeAccountId]);
      getBlockHeight().then((blockHeight) => {
        if (!initialBlockHeight?.current) {
          initialBlockHeight.current = blockHeight;
        }

        if (BigInt(initialBlockHeight?.current) + timeoutBlocks < blockHeight) {
          pollingInterval.current && clearInterval(pollingInterval.current);
        }
      });
    }, 500);
  };

  useEffect(() => {
    if (BigInt(balance) === balanceAfterSending.current) {
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
  }, [balance, isSending, actionsView]);

  if (!isActionsViewVisible) return <div></div>;

  return (
    <div className="w-100p">
      <Formik
        initialValues={{
          assets: {
            value: defaultAsset,
            label: "ALPHA",
          },
          amount: "",
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

          let convertedAmount;
          try {
            convertedAmount = convertToWholeNumberBigInt(
              values.amount,
              decimalPlaces
            );
          } catch (error) {
            return setErrors({
              password: error.message,
            });
          }

          const billsArr = selectedSendKey
            ? ([
                billsList?.find((bill: IBill) => bill.id === selectedSendKey),
              ] as IBill[])
            : (billsList?.filter(
                (bill: IBill) =>
                  bill.isDcBill === false &&
                  !lockedBills?.find((b: ILockedBill) => b.billId === bill.id)
              ) as IBill[]);

          const selectedBills = getOptimalBills(
            convertedAmount.toString(),
            billsArr
          );

          const newBearer = createNewBearer(values.address);

          const billsSumDifference =
            getBillsSum(selectedBills) - convertedAmount;

          const billToSplit =
            billsSumDifference !== 0n
              ? findClosestBigger(selectedBills, billsSumDifference.toString())
              : null;

          const billsToTransfer = billToSplit
            ? selectedBills.filter((bill) => bill.id !== billToSplit?.id)
            : selectedBills;

          const splitBillAmount = billToSplit
            ? BigInt(billToSplit.value) - billsSumDifference
            : null;

          setIsSending(true);

          getBlockHeight().then(async (blockHeight) => {
            billsToTransfer.map(async (bill, idx) => {
              const transferData: IProofTx = {
                systemId: "AAAAAA==",
                unitId: bill.id,
                transactionAttributes: {
                  "@type": "type.googleapis.com/rpc.TransferOrder",
                  newBearer: newBearer,
                  targetValue: bill.value.toString(),
                  backlink: bill.txHash,
                },
                timeout: (blockHeight + timeoutBlocks).toString(),
                ownerProof: "",
              };

              const isLastTransaction =
                billsToTransfer.length === idx + 1 &&
                !billToSplit &&
                !splitBillAmount;

              handleValidation(
                await transferOrderHash(transferData),
                blockHeight,
                transferData as ITransfer,
                isLastTransaction
              );
            });

            if (billToSplit && splitBillAmount) {
              const splitData: IProofTx = {
                systemId: "AAAAAA==",
                unitId: billToSplit.id,
                transactionAttributes: {
                  "@type": "type.googleapis.com/rpc.SplitOrder",
                  amount: splitBillAmount.toString(),
                  targetBearer: newBearer,
                  remainingValue: (
                    BigInt(billToSplit.value) - splitBillAmount
                  ).toString(),
                  backlink: billToSplit.txHash,
                },
                timeout: (blockHeight + timeoutBlocks).toString(),
                ownerProof: "",
              };

              handleValidation(
                await splitOrderHash(splitData),
                blockHeight,
                splitData as ITransfer,
                true
              );
            }
          });

          const handleValidation = async (
            msgHash: Uint8Array,
            blockHeight: bigint,
            billData: ITransfer,
            isLastTransfer: boolean
          ) => {
            const proof = await createOwnerProof(
              msgHash,
              hashingPrivateKey,
              hashingPublicKey
            );

            const dataWithProof = Object.assign(billData, {
              ownerProof: proof.ownerProof,
              timeout: (blockHeight + timeoutBlocks).toString(),
            });

            proof.isSignatureValid &&
              makeTransaction(dataWithProof)
                .then(() => {
                  const amount: string =
                    billData?.transactionAttributes?.amount ||
                    billData?.transactionAttributes?.targetValue ||
                    "";
                  balanceAfterSending.current = balanceAfterSending.current
                    ? BigInt(balanceAfterSending.current) - BigInt(amount)
                    : BigInt(balance) - BigInt(amount);
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
          amount: Yup.string()
            .required("Amount is required")
            .test(
              "test more than",
              "Value must be greater than 0",
              (value: string | undefined) => Number(value || "") > 0n
            )
            .test(
              "value not number",
              "Value must be greater than 0",
              (value: string | undefined) => Number(value || "") > 0n
            )
            .test(
              "test less than",
              "Amount exceeds available assets",
              (value: string | undefined) =>
                selectedSendKey
                  ? true
                  : value
                  ? convertToWholeNumberBigInt(value || "", decimalPlaces) <=
                    convertToWholeNumberBigInt(availableAmount, decimalPlaces)
                  : true
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
                        label: asset.id,
                      }))}
                    defaultValue={{
                      value: defaultAsset,
                      label: "ALPHA",
                    }}
                    error={extractFormikError(errors, touched, ["assets"])}
                    onChange={(_label, option: any) => setSelectedAsset(option)}
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
                        values.assets.label +
                        " available to send " +
                        lockedAmountLabel
                      }
                      type="text"
                      floatingFixedPoint={decimalPlaces}
                      error={extractFormikError(errors, touched, ["amount"])}
                      disabled={
                        !Boolean(values.assets) || Boolean(selectedSendKey)
                      }
                      value={
                        (selectedSendKey &&
                          (addDecimal(
                            billsList?.find(
                              (bill: IBill) => bill.id === selectedSendKey
                            )?.value,
                            decimalPlaces
                          ) as string | undefined)) ||
                        ""
                      }
                      isNumberFloat
                      removeApostrophes
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
