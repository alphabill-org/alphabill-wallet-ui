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
  IBill,
  ITransactionPayload,
  IPayloadClientMetadata,
  ITransactionPayloadObj,
  ITransactionAttributes,
} from "../../types/Types";
import { useApp } from "../../hooks/appProvider";
import { useAuth } from "../../hooks/useAuth";
import {
  getFeeCreditBills,
  getProof,
  getRoundNumber,
  makeTransaction,
} from "../../hooks/requests";

import {
  extractFormikError,
  getKeys,
  createOwnerProof,
  getBillsSum,
  invalidateAllLists,
  convertToWholeNumberBigInt,
  base64ToHexPrefixed,
  getNewBearer,
  unit8ToHexPrefixed,
  FeeCostEl,
  addDecimal,
  handleBillSelection,
} from "../../utils/utils";
import {
  FeeTimeoutBlocks,
  AlphaType,
  AlphaDecimals,
  FeeCreditTransferType,
  AlphaSystemId,
  TokensSystemId,
  MaxTransactionFee,
  FeeCreditAddType,
  TokenType,
} from "../../utils/constants";

import {
  prepTransactionRequestData,
  publicKeyHash,
  publicKeyHashWithFeeType,
  transferOrderTxHash,
} from "../../utils/hashers";

export default function TransferFeeCredit(): JSX.Element | null {
  const {
    setIsActionsViewVisible,
    isActionsViewVisible,
    account,
    unlockedBillsList,
    setPreviousView,
    feeCreditBills,
  } = useApp();
  const { vault, activeAccountId } = useAuth();
  const queryClient = useQueryClient();
  const feeAssets = [
    {
      value: AlphaType,
      label: "ALPHA fee credit",
    },
    {
      value: TokenType,
      label: "User Token fee credit",
    },
  ];

  const defaultAsset: {
    value: string;
    label: string;
  } = feeAssets[0];
  const billsArr = unlockedBillsList
    ?.filter((bill: any) => Number(bill.value) >= 1)
    ?.filter((bill: IBill) => !Boolean(bill.targetUnitId));
  const pollingInterval = useRef<NodeJS.Timeout | null>(null);
  const initialRoundNumber = useRef<bigint | null | undefined>(null);
  const transferBillProof = useRef<any>(null);
  const isAllFeesAdded = useRef<boolean>(false);
  const transferFeePollingProofProps = useRef<{
    id: string;
    txHash: string;
  } | null>(null);
  const addFeePollingProofProps = useRef<{
    id: string;
    txHash: string;
    isTokensRequest: boolean;
  } | null>(null);
  const transferrableBills = useRef<ITransactionPayload[] | null>(null);
  const feeAfterSending = useRef<{
    amount: bigint;
    type: "ALPHA" | "UTP";
  } | null>(null);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [minFeeTransferAmount, setMinFeeTransferAmount] = useState<
    string | null
  >(null);
  const [transferredBillsCount, setTransferredBillsCount] = useState<number>(0);

  const getAvailableAmount = useCallback(
    (decimals: number) =>
      addDecimal(getBillsSum(billsArr).toString() || "0", Number(decimals)),
    [billsArr]
  );

  const resetRefs = () => {
    feeAfterSending.current = null;
    transferrableBills.current = null;
    transferFeePollingProofProps.current = null;
    addFeePollingProofProps.current = null;
    isAllFeesAdded.current = false;
  };

  const [availableAmount, setAvailableAmount] = useState<string>(
    getAvailableAmount(AlphaDecimals || 0)
  );

  useEffect(() => {
    setAvailableAmount(getAvailableAmount(AlphaDecimals || 0));
  }, [getAvailableAmount, isActionsViewVisible]);

  useEffect(() => {
    if (
      BigInt(
        feeCreditBills?.[feeAfterSending.current?.type || AlphaType]?.value ||
          "0"
      ) >= BigInt(feeAfterSending.current?.amount || "0")
    ) {
      if (isAllFeesAdded.current === true) {
        pollingInterval.current && clearInterval(pollingInterval.current);
        setIsSending(false);
        setIsActionsViewVisible(false);
        resetRefs();
        setTransferredBillsCount(0);
      }
    }
  }, [
    feeCreditBills,
    getAvailableAmount,
    isActionsViewVisible,
    setIsActionsViewVisible,
  ]);

  if (!isActionsViewVisible) return <div></div>;

  return (
    <div className="w-100p">
      <Formik
        initialValues={{
          amount: "",
          assets: defaultAsset,
          password: "",
        }}
        onSubmit={async (values, { setErrors }) => {
          resetRefs();

          const { error, hashingPrivateKey, hashingPublicKey } = getKeys(
            values.password,
            Number(account?.idx),
            vault
          );

          if (error || !hashingPrivateKey || !hashingPublicKey) {
            return setErrors({
              password: error || "Hashing keys are missing!",
            });
          }

          let convertedAmount: bigint;

          try {
            convertedAmount = convertToWholeNumberBigInt(
              values.amount,
              AlphaDecimals
            );
          } catch (error) {
            return setErrors({
              password: error.message,
            });
          }

          const { splitBillAmount, billsToTransfer, billToSplit } =
            handleBillSelection(convertedAmount.toString(), billsArr);

          setIsSending(true);

          const isAlpha = values.assets.value === AlphaType;
          const pubKeyHashWithType = (await publicKeyHashWithFeeType({
            key: activeAccountId,
            isAlpha: isAlpha,
          })) as Uint8Array;
          const pubKeyHashHex = await publicKeyHash(activeAccountId, true);

          const baseObj = (bill: IBill, amount: string) => {
            return {
              payload: {
                systemId: AlphaSystemId,
                type: FeeCreditTransferType,
                unitId: Buffer.from(bill.id, "base64"),
                ...baseAttr(bill, amount),
              },
            };
          };

          const baseAttr = (bill: IBill, amount: string) => {
            return {
              attributes: {
                amount: BigInt(amount),
                targetSystemIdentifier: isAlpha
                  ? AlphaSystemId
                  : TokensSystemId,
                targetRecordID: pubKeyHashWithType,
                nonce: null,
                backlink: Buffer.from(bill.txHash, "base64"),
              },
            };
          };

          billsToTransfer?.map(async (bill) => {
            const transferData: ITransactionPayload = {
              ...baseObj(bill, bill.value),
            };

            transferrableBills.current = transferrableBills.current
              ? [...transferrableBills.current, transferData]
              : [transferData];
          });

          if (billToSplit && splitBillAmount) {
            const splitData: ITransactionPayload = {
              ...baseObj(billToSplit, splitBillAmount.toString()),
            };

            transferrableBills.current = transferrableBills.current
              ? [...transferrableBills.current, splitData]
              : [splitData];
          }

          if (
            !transferrableBills?.current?.[0] ||
            !transferrableBills?.current[0].payload
          ) {
            return setErrors({
              password: "Error selecting suitable bills",
            });
          }

          const initTransaction = async (
            billData: ITransactionPayload,
            addNonce: boolean,
            isAddFee?: boolean,
            isTokensRequest?: boolean
          ) => {
            pollingInterval.current && clearInterval(pollingInterval.current);

            if (addNonce) {
              (billData.payload.attributes as ITransactionAttributes).nonce =
                (addFeePollingProofProps?.current?.txHash &&
                  Buffer.from(
                    addFeePollingProofProps?.current?.txHash,
                    "base64"
                  )) ||
                null;
            }

            if (isAddFee) {
              transferFeePollingProofProps.current = null;
            } else {
              addFeePollingProofProps.current = null;
            }

            getRoundNumber(true).then((alphaRoundNumber) => {
              getRoundNumber(Boolean(values.assets.value === AlphaType)).then(
                async (variableRoundNumber) => {
                  const id = billData.payload.unitId;
                  const amount = (
                    billData.payload.attributes as ITransactionAttributes
                  ).amount;

                  const attr = billData.payload
                    .attributes as ITransactionAttributes;
                  const deductedWithFee =
                    amount &&
                    (billData.payload.attributes as ITransactionAttributes)
                      .amount! -
                      MaxTransactionFee * 2n;

                  if (deductedWithFee) {
                    const feeBillsValue =
                      feeCreditBills?.[isAlpha ? AlphaType : TokenType]
                        ?.value || 0n;
                    feeAfterSending.current = {
                      amount: feeAfterSending.current
                        ? feeAfterSending.current.amount + deductedWithFee
                        : BigInt(feeBillsValue) + deductedWithFee,
                      type: isAlpha ? AlphaType : TokenType,
                    };
                  }

                  if (!isAddFee) {
                    billData.payload.attributes = {
                      amount: attr.amount,
                      targetSystemIdentifier: attr.targetSystemIdentifier,
                      targetRecordID: attr.targetRecordID,
                      earliestAdditionTime:
                        variableRoundNumber - FeeTimeoutBlocks,
                      latestAdditionTime:
                        variableRoundNumber + FeeTimeoutBlocks,
                      nonce: attr.nonce,
                      backlink: attr.backlink,
                    };
                  }

                  (billData.payload.clientMetadata as IPayloadClientMetadata) =
                    {
                      timeout: alphaRoundNumber + FeeTimeoutBlocks,
                      MaxTransactionFee: MaxTransactionFee,
                      feeCreditRecordID: null,
                    };

                  const proof = await createOwnerProof(
                    billData.payload as ITransactionPayloadObj,
                    hashingPrivateKey,
                    hashingPublicKey
                  );

                  const finishTransaction = (billData: ITransactionPayload) => {
                    proof.isSignatureValid &&
                      makeTransaction(
                        prepTransactionRequestData(billData, proof.ownerProof),
                        activeAccountId,
                        !isTokensRequest
                      )
                        .then(() => {
                          setPreviousView(null);
                        })
                        .catch(() => {
                          pollingInterval.current &&
                            clearInterval(pollingInterval.current);
                          resetRefs();
                          setIsSending(false);
                          setIsActionsViewVisible(false);
                        })
                        .finally(async () => {
                          const txHash = await transferOrderTxHash(
                            prepTransactionRequestData(
                              billData,
                              proof.ownerProof
                            )
                          );

                          if (isAddFee) {
                            addFeePollingProofProps.current = {
                              id: unit8ToHexPrefixed(id),
                              txHash: txHash,
                              isTokensRequest: Boolean(isTokensRequest),
                            };
                          } else {
                            transferFeePollingProofProps.current = {
                              id: unit8ToHexPrefixed(id),
                              txHash: txHash,
                            };
                          }

                          addPollingInterval();
                        });
                  };

                  finishTransaction(billData);
                }
              );
            });
          };

          const creditBills = await getFeeCreditBills(pubKeyHashHex as string);
          const creditBill = creditBills?.[isAlpha ? AlphaType : TokenType];
          const firstBillToTransfer = transferrableBills!.current![0];

          if (
            creditBill?.lastAddFcTxHash &&
            firstBillToTransfer.payload.type !== FeeCreditAddType
          ) {
            (
              firstBillToTransfer.payload.attributes as ITransactionAttributes
            ).nonce = Buffer.from(creditBill.lastAddFcTxHash, "base64");
          }

          await initTransaction(
            firstBillToTransfer as ITransactionPayload,
            false
          );

          const addPollingInterval = () => {
            pollingInterval.current = setInterval(async () => {
              queryClient.invalidateQueries(["feeBillsList", pubKeyHashHex]);

              if (
                !transferrableBills.current?.[0]?.payload?.unitId &&
                isAllFeesAdded.current === true
              ) {
                return;
              }

              const billToTransfer = transferrableBills.current?.[0];
              initialRoundNumber.current = null;
              invalidateAllLists(activeAccountId, AlphaType, queryClient);

              if (transferFeePollingProofProps.current) {
                getProof(
                  transferFeePollingProofProps.current.id,
                  base64ToHexPrefixed(
                    transferFeePollingProofProps.current.txHash
                  )
                )
                  .then(async (data) => {
                    if (data?.txProof) {
                      transferrableBills.current =
                        (billToTransfer &&
                          transferrableBills.current?.filter(
                            (item) =>
                              item.payload.unitId !==
                              billToTransfer.payload.unitId
                          )) ||
                        null;

                      isAllFeesAdded.current = !Boolean(
                        transferrableBills.current?.[0]?.payload?.unitId
                      );

                      transferBillProof.current = data;
                      addFeeCredit();
                    }
                  })
                  .finally(() => setIntervalCancel());
              }

              if (addFeePollingProofProps.current) {
                getProof(
                  addFeePollingProofProps.current.id,
                  base64ToHexPrefixed(addFeePollingProofProps.current.txHash),
                  addFeePollingProofProps.current.isTokensRequest
                )
                  .then(async (data) => {
                    if (data?.txProof) {
                      transferBillProof.current = null;
                      billToTransfer && initTransaction(billToTransfer, true);
                    }
                  })
                  .finally(() => setIntervalCancel());
              }

              const setIntervalCancel = () => {
                getRoundNumber(isAlpha).then((roundNumber) => {
                  if (!initialRoundNumber?.current) {
                    initialRoundNumber.current = roundNumber;
                  }
                  if (
                    BigInt(initialRoundNumber?.current) + FeeTimeoutBlocks <
                    roundNumber
                  ) {
                    pollingInterval.current &&
                      clearInterval(pollingInterval.current);
                  }
                });
              };
            }, 1000);
          };

          const addFeeCredit = () => {
            const isAlphaType = Boolean(values.assets.value === AlphaType);
            const transferData: ITransactionPayload = {
              payload: {
                systemId: isAlphaType ? AlphaSystemId : TokensSystemId,
                type: FeeCreditAddType,
                unitId: pubKeyHashWithType as Uint8Array,
                attributes: {
                  feeCreditOwnerCondition: getNewBearer(account),
                  feeCreditTransfer: transferBillProof.current.txRecord,
                  feeCreditTransferProof: transferBillProof.current.txProof,
                },
              },
            };

            initTransaction(
              transferData as any,
              false,
              true,
              !Boolean(values.assets.value === AlphaType)
            );
          };
        }}
        validationSchema={Yup.object().shape({
          assets: Yup.object().required("Selected asset is required"),
          password: Yup.string().required("Password is required"),
          amount: Yup.string()
            .required("Amount is required")
            .test(
              "test exceeds assets",
              "Amount with fees exceeds available assets",
              (value: string | undefined) => {
                setTransferredBillsCount(0);
                let convertedAmount: bigint;
                if (!value) return false;

                try {
                  convertedAmount = convertToWholeNumberBigInt(
                    value,
                    AlphaDecimals
                  );
                } catch (error) {
                  return false;
                }

                const { optimalBills } = handleBillSelection(
                  convertedAmount.toString(),
                  billsArr
                );

                if (optimalBills.length < 1) return false;

                setTransferredBillsCount(optimalBills.length);

                return (
                  convertToWholeNumberBigInt(value || "", AlphaDecimals) <=
                  convertToWholeNumberBigInt(availableAmount, AlphaDecimals)
                );
              }
            )
            .test(
              "test less than",
              "Min amount with fees is " + minFeeTransferAmount + " ALPHA",
              (value: string | undefined) => {
                let convertedAmount: bigint;
                if (!value) return false;

                try {
                  convertedAmount = convertToWholeNumberBigInt(
                    value,
                    AlphaDecimals
                  );
                } catch (error) {
                  return false;
                }

                const { optimalBills } = handleBillSelection(
                  convertedAmount.toString(),
                  billsArr
                );

                if (optimalBills.length < 1) return false;

                const minAmount =
                  MaxTransactionFee * 3n * BigInt(optimalBills.length);

                setMinFeeTransferAmount(
                  addDecimal(minAmount.toString(), Number(AlphaDecimals))
                );

                return convertedAmount >= minAmount;
              }
            ),
        })}
      >
        {(formikProps) => {
          const { handleSubmit, errors, touched } = formikProps;

          return (
            <form className="pad-24" onSubmit={handleSubmit}>
              <Form>
                <FormContent>
                  <Select
                    label=""
                    name="assets"
                    options={feeAssets}
                    defaultValue={defaultAsset}
                    error={extractFormikError(errors, touched, ["assets"])}
                  />
                  <Spacer mb={8} />
                  <Textfield
                    id="amount"
                    name="amount"
                    label="Amount"
                    desc={
                      availableAmount +
                      " ALPHA available" +
                      (transferredBillsCount >= 1
                        ? " - fee for transfer " +
                          addDecimal(
                            (transferredBillsCount * 2).toString(),
                            AlphaDecimals
                          ).toString() +
                          " ALPHA"
                        : "")
                    }
                    type="text"
                    floatingFixedPoint={AlphaDecimals}
                    error={extractFormikError(errors, touched, ["amount"])}
                    isNumberFloat
                    removeApostrophes
                  />
                  <Spacer mb={8} />
                  <Textfield
                    id="password"
                    name="password"
                    label="Password"
                    type="password"
                    error={extractFormikError(errors, touched, ["password"])}
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
                    disabled={isSending}
                  >
                    Transfer credit
                  </Button>
                  <FeeCostEl />
                </FormFooter>
              </Form>
            </form>
          );
        }}
      </Formik>
    </div>
  );
}
