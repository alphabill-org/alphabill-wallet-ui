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
  findClosestBigger,
  getOptimalBills,
  getBillsSum,
  invalidateAllLists,
  convertToWholeNumberBigInt,
  base64ToHexPrefixed,
  getNewBearer,
  unit8ToHexPrefixed,
  FeeCostEl,
  addDecimal,
} from "../../utils/utils";
import {
  feeTimeoutBlocks,
  AlphaType,
  AlphaDecimals,
  FeeCreditTransferType,
  AlphaSystemId,
  TokensSystemId,
  maxTransactionFee,
  FeeCreditAddType,
  TokenType,
} from "../../utils/constants";

import {
  prepTransactionRequestData,
  publicKeyHash,
  transferOrderTxHash,
} from "../../utils/hashers";

export default function TransferFeeCredit(): JSX.Element | null {
  const {
    setIsActionsViewVisible,
    isActionsViewVisible,
    account,
    billsList,
    selectedTransferKey,
    setSelectedTransferKey,
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
  const billsArr = billsList
    .filter((bill: any) => bill.value > 1)
    ?.filter((bill: IBill) => !Boolean(bill.dcNonce));
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
        setSelectedTransferKey(null);
        setIsActionsViewVisible(false);
        resetRefs();
      }
    }
  }, [
    feeCreditBills,
    getAvailableAmount,
    isActionsViewVisible,
    setIsActionsViewVisible,
    setSelectedTransferKey,
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

          const selectedBills = getOptimalBills(
            convertedAmount.toString(),
            billsArr as IBill[]
          );

          const billsSumDifference =
            getBillsSum(selectedBills) - convertedAmount;

          const billToSplit =
            billsSumDifference !== 0n
              ? findClosestBigger(selectedBills, billsSumDifference.toString())
              : null;

          const billsToTransfer = billToSplit
            ? selectedBills?.filter((bill) => bill.id !== billToSplit?.id)
            : selectedBills;

          const splitBillAmount = billToSplit
            ? BigInt(billToSplit.value) - billsSumDifference
            : null;

          setIsSending(true);

          const pubKeyHash = await publicKeyHash(activeAccountId);
          const isAlpha = values.assets.value === AlphaType;

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
                amount: BigInt(amount) - maxTransactionFee,
                targetSystemIdentifier: isAlpha
                  ? AlphaSystemId
                  : TokensSystemId,
                targetRecordID: pubKeyHash,
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
              getRoundNumber(!isTokensRequest).then(
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
                      .amount! - maxTransactionFee;

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
                      earliestAdditionTime: alphaRoundNumber - feeTimeoutBlocks,
                      latestAdditionTime: alphaRoundNumber + feeTimeoutBlocks,
                      nonce: attr.nonce,
                      backlink: attr.backlink,
                    };
                  }

                  (billData.payload.clientMetadata as IPayloadClientMetadata) =
                    {
                      timeout: variableRoundNumber + feeTimeoutBlocks,
                      maxTransactionFee: maxTransactionFee,
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
                          setSelectedTransferKey(null);
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

          const pubKeyHashHex = await publicKeyHash(activeAccountId, true);
          const creditBills = await getFeeCreditBills(pubKeyHashHex as string);
          const creditBill = creditBills?.[isAlpha ? AlphaType : TokenType];
          const firstBillToTransfer = transferrableBills!.current![0];

          if (
            creditBill?.tx_hash &&
            firstBillToTransfer.payload.type !== FeeCreditAddType
          ) {
            (
              firstBillToTransfer.payload.attributes as ITransactionAttributes
            ).nonce =
              creditBill && creditBill.tx_hash
                ? Buffer.from(creditBill.tx_hash, "base64")
                : null;
          }

          await initTransaction(
            firstBillToTransfer as ITransactionPayload,
            false
          );

          const addPollingInterval = () => {
            pollingInterval.current = setInterval(async () => {
              const pubKeyHash = await publicKeyHash(activeAccountId, true);
              queryClient.invalidateQueries(["feeBillsList", pubKeyHash]);

              if (
                !transferrableBills.current?.[0]?.payload?.unitId &&
                isAllFeesAdded.current === true
              ) {
                return;
              }

              const billToTransfer = transferrableBills.current?.[0];
              initialRoundNumber.current = null;
              invalidateAllLists(activeAccountId, AlphaType, queryClient);
              queryClient.invalidateQueries(["feeBillsList", pubKeyHash]);

              if (transferFeePollingProofProps.current) {
                getProof(
                  transferFeePollingProofProps.current.id,
                  base64ToHexPrefixed(
                    transferFeePollingProofProps.current.txHash
                  )
                )
                  .then(async (data) => {
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
                  })
                  .finally(() => setIntervalCancel());
              }

              if (addFeePollingProofProps.current) {
                getProof(
                  addFeePollingProofProps.current.id,
                  base64ToHexPrefixed(addFeePollingProofProps.current.txHash),
                  addFeePollingProofProps.current.isTokensRequest
                )
                  .then(async () => {
                    transferBillProof.current = null;
                    billToTransfer &&
                      initTransaction(billToTransfer, true, false);
                  })
                  .finally(() => setIntervalCancel());
              }

              const setIntervalCancel = () => {
                getRoundNumber(isAlpha).then((roundNumber) => {
                  if (!initialRoundNumber?.current) {
                    initialRoundNumber.current = roundNumber;
                  }
                  if (
                    BigInt(initialRoundNumber?.current) + feeTimeoutBlocks <
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
            const transferData: ITransactionPayload = {
              payload: {
                systemId: Boolean(values.assets.value === AlphaType)
                  ? AlphaSystemId
                  : TokensSystemId,
                type: FeeCreditAddType,
                unitId: pubKeyHash as Uint8Array,
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
              "test more than",
              "Value must be greater than 0",
              (value: string | undefined) => Number(value || "") > 0n
            )
            .test(
              "test less than",
              "Amount exceeds available assets",
              (value: string | undefined) =>
                selectedTransferKey
                  ? true
                  : value
                  ? convertToWholeNumberBigInt(value || "", AlphaDecimals) <=
                    convertToWholeNumberBigInt(availableAmount, AlphaDecimals)
                  : true
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
                    desc={availableAmount + " ALPHA available"}
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
