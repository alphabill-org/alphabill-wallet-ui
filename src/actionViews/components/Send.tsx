import { useCallback, useEffect, useRef, useState } from "react";
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
  ITypeHierarchy,
} from "../../types/Types";
import { useApp } from "../../hooks/appProvider";
import { useAuth } from "../../hooks/useAuth";
import {
  getBlockHeight,
  getTypeHierarchy,
  makeTransaction,
} from "../../hooks/requests";

import {
  extractFormikError,
  getKeys,
  base64ToHexPrefixed,
  createOwnerProof,
  createNewBearer,
  findClosestBigger,
  getOptimalBills,
  getBillsSum,
  invalidateAllLists,
  addDecimal,
  convertToWholeNumberBigInt,
  getHierarhyParentTypeIds,
  separateDigits,
} from "../../utils/utils";
import {
  timeoutBlocks,
  TokensTransferType,
  TokensSplitType,
  AlphaTransferType,
  AlphaSplitType,
  AlphaSystemId,
  TokensSystemId,
  AlphaType,
} from "../../utils/constants";

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
  const { vault, activeAccountId, setActiveAssetLocal, activeAsset } =
    useAuth();
  const queryClient = useQueryClient();
  const defaultAsset: { value: IAsset | undefined; label: string } = {
    value: account?.assets
      .filter((asset) => account?.activeNetwork === asset.network)
      .find((asset) => asset.typeId === activeAsset.typeId),
    label: activeAsset.name,
  };
  const [selectedAsset, setSelectedAsset] = useState<IAsset | undefined>(
    defaultAsset?.value
  );
  const lockedBillsAmount = useCallback(
    (): bigint =>
      getBillsSum(
        billsList.filter((bill: IBill) =>
          lockedBills?.find((b: ILockedBill) => b.billId === bill.id)
        )
      ),
    [billsList, lockedBills]
  );
  const getAvailableAmount = useCallback(
    (decimalPlaces: number) => {
      return addDecimal(
        (
          BigInt(
            account?.assets.find(
              (asset) => asset.typeId === selectedAsset?.typeId
            )?.amount || "0"
          ) - lockedBillsAmount()
        ).toString() || "0",
        decimalPlaces
      );
    },
    [account, selectedAsset?.typeId, lockedBillsAmount]
  );
  const [availableAmount, setAvailableAmount] = useState<string>(
    getAvailableAmount(selectedAsset?.decimalPlaces || 0)
  );
  const decimalPlaces = selectedAsset?.decimalPlaces || 0;

  const createLockedBillsAmountLabel = () => {
    const amount = lockedBillsAmount();

    if (amount <= 0n) return "";
    return (
      " ( Locked bills amount " +
      addDecimal(amount.toString(), selectedAsset?.decimalPlaces || 0) +
      " )"
    );
  };

  const selectedBill = billsList?.find(
    (bill: IBill) => bill.id === selectedSendKey
  );
  const selectedBillValue = selectedBill?.value || "";
  const pollingInterval = useRef<NodeJS.Timeout | null>(null);
  const initialBlockHeight = useRef<bigint | null | undefined>(null);
  const balanceAfterSending = useRef<bigint | null>(null);

  const [isSending, setIsSending] = useState<boolean>(false);

  const addPollingInterval = () => {
    initialBlockHeight.current = null;
    pollingInterval.current = setInterval(() => {
      invalidateAllLists(activeAccountId, activeAsset.typeId, queryClient);
      getBlockHeight(selectedAsset?.typeId === AlphaType).then(
        (blockHeight) => {
          if (!initialBlockHeight?.current) {
            initialBlockHeight.current = blockHeight;
          }

          if (
            BigInt(initialBlockHeight?.current) + timeoutBlocks <
            blockHeight
          ) {
            pollingInterval.current && clearInterval(pollingInterval.current);
          }
        }
      );
    }, 500);
  };

  useEffect(() => {
    setAvailableAmount(getAvailableAmount(selectedAsset?.decimalPlaces || 0));
  }, [selectedAsset, getAvailableAmount]);

  useEffect(() => {
    const activeAssetAmount = account?.assets
      .filter((asset) => account?.activeNetwork === asset.network)
      .find((asset) => asset.typeId === selectedAsset?.typeId)?.amount;

    if (BigInt(activeAssetAmount || "") === balanceAfterSending.current) {
      pollingInterval.current && clearInterval(pollingInterval.current);
      balanceAfterSending.current = null;
    } else if (
      balanceAfterSending.current === null &&
      pollingInterval.current &&
      !isSending
    ) {
      clearInterval(pollingInterval.current);
    }

    if (actionsView !== "Transfer" && pollingInterval.current) {
      clearInterval(pollingInterval.current);
    }
  }, [
    account.assets,
    account?.activeNetwork,
    selectedAsset?.typeId,
    isSending,
    actionsView,
  ]);

  if (!isActionsViewVisible) return <div></div>;

  return (
    <div className="w-100p">
      <Formik
        initialValues={{
          assets: {
            value: defaultAsset,
            label: AlphaType,
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
              selectedAsset?.decimalPlaces || 0
            );
          } catch (error) {
            return setErrors({
              password: error.message,
            });
          }

          const billsArr = selectedSendKey
            ? ([selectedBill] as IBill[])
            : (billsList?.filter(
                (bill: IBill) =>
                  bill.isDcBill !== true &&
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

          getBlockHeight(selectedAsset?.typeId === AlphaType).then(
            async (blockHeight) => {
              let transferType = TokensTransferType;
              let splitType = TokensSplitType;
              let systemId = TokensSystemId;
              let amountField = "targetValue";
              let bearerField = "newBearer";
              let transferField = "value";

              if (selectedAsset?.typeId === AlphaType) {
                transferType = AlphaTransferType;
                splitType = AlphaSplitType;
                systemId = AlphaSystemId;
                bearerField = "targetBearer";
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
                    [transferField]: bill.value,
                    backlink: bill.txHash,
                  },
                  timeout: (blockHeight + timeoutBlocks).toString(),
                  ownerProof: "",
                };

                const isLastTransaction =
                  billsToTransfer.length === idx + 1 &&
                  !billToSplit &&
                  !splitBillAmount;

                if (selectedAsset?.typeId !== AlphaType) {
                  getTypeHierarchy(bill.typeId || "")
                    .then(async (hierarchy: ITypeHierarchy[]) => {
                      transferData.transactionAttributes.invariantPredicateSignatures =
                        getHierarhyParentTypeIds(hierarchy);
                      transferData.transactionAttributes.type = bill.typeId;
                      handleValidation(
                        await transferOrderHash(transferData),
                        blockHeight,
                        transferData as ITransfer,
                        isLastTransaction
                      );
                    })
                    .catch(() => {
                      setErrors({
                        password: "Fetching token hierarchy for failed",
                      });
                      setIsSending(false);
                    });
                } else {
                  handleValidation(
                    await transferOrderHash(transferData),
                    blockHeight,
                    transferData as ITransfer,
                    isLastTransaction
                  );
                }
              });

              if (billToSplit && splitBillAmount) {
                const splitData: IProofTx = {
                  systemId: systemId,
                  unitId: billToSplit.id,
                  transactionAttributes: {
                    "@type": splitType,
                    [amountField]: splitBillAmount.toString(),
                    [bearerField]: newBearer,
                    remainingValue: (
                      BigInt(billToSplit.value) - splitBillAmount
                    ).toString(),
                    backlink: billToSplit.txHash,
                  },
                  timeout: (blockHeight + timeoutBlocks).toString(),
                  ownerProof: "",
                };

                if (selectedAsset?.typeId !== AlphaType) {
                  getTypeHierarchy(billToSplit.typeId || "")
                    .then(async (hierarchy: ITypeHierarchy[]) => {
                      splitData.transactionAttributes.invariantPredicateSignatures =
                        getHierarhyParentTypeIds(hierarchy);
                      splitData.transactionAttributes.type = billToSplit.typeId;
                      handleValidation(
                        await splitOrderHash(splitData),
                        blockHeight,
                        splitData as ITransfer,
                        true
                      );
                    })
                    .catch(() => {
                      setErrors({
                        password: "Fetching token hierarchy for failed",
                      });
                      setIsSending(false);
                    });
                } else {
                  handleValidation(
                    await splitOrderHash(splitData),
                    blockHeight,
                    splitData as ITransfer,
                    true
                  );
                }
              }
            }
          );

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

            let dataWithProof = Object.assign(billData, {
              ownerProof: proof.ownerProof,
              timeout: (blockHeight + timeoutBlocks).toString(),
            });

            if (selectedAsset?.typeId !== AlphaType) {
              dataWithProof = { transactions: [dataWithProof] } as any;
            }

            proof.isSignatureValid &&
              makeTransaction(
                dataWithProof,
                selectedAsset?.typeId === AlphaType ? "" : values.address
              )
                .then(() => {
                  const amount: string =
                    billData?.transactionAttributes?.amount ||
                    billData?.transactionAttributes?.targetValue ||
                    billData?.transactionAttributes?.value ||
                    "";

                  balanceAfterSending.current = balanceAfterSending.current
                    ? BigInt(balanceAfterSending.current) - BigInt(amount)
                    : BigInt(selectedAsset?.amount || "") - BigInt(amount);
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
                          {separateDigits(
                            addDecimal(
                              selectedBillValue,
                              selectedAsset?.decimalPlaces || 0
                            )
                          )}
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
                              setActionsView("List view");
                              setIsActionsViewVisible(true);
                              invalidateAllLists(
                                activeAccountId,
                                activeAsset.typeId,
                                queryClient
                              );
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
                      .sort(function (a, b) {
                        if (a.id === AlphaType) {
                          return -1; // Move the object with the given ID to the beginning of the array
                        }
                        return 1;
                      })
                      .map((asset: IAsset) => ({
                        value: asset,
                        label: asset.name,
                      }))}
                    defaultValue={{
                      value: defaultAsset,
                      label: defaultAsset.label,
                    }}
                    error={extractFormikError(errors, touched, ["assets"])}
                    onChange={(_label, option: any) => {
                      setSelectedAsset(option);
                      invalidateAllLists(
                        activeAccountId,
                        activeAsset.typeId,
                        queryClient
                      );
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
                        createLockedBillsAmountLabel()
                      }
                      type="text"
                      floatingFixedPoint={selectedAsset?.decimalPlaces}
                      error={extractFormikError(errors, touched, ["amount"])}
                      disabled={
                        !Boolean(values.assets) || Boolean(selectedSendKey)
                      }
                      value={
                        (selectedSendKey &&
                          (addDecimal(
                            selectedBillValue,
                            selectedAsset?.decimalPlaces || 0
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
                    Transfer
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
              setActionsView("List view");
              setIsActionsViewVisible(true);
              invalidateAllLists(
                activeAccountId,
                activeAsset.typeId,
                queryClient
              );
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
