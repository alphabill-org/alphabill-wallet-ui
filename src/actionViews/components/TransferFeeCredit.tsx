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
  ITransfer,
  ITypeHierarchy,
  IFeeTransaction,
} from "../../types/Types";
import { useApp } from "../../hooks/appProvider";
import { useAuth } from "../../hooks/useAuth";
import {
  getProof,
  getRoundNumber,
  getTypeHierarchy,
  makeTransaction,
} from "../../hooks/requests";

import {
  extractFormikError,
  getKeys,
  createOwnerProof,
  createNewBearer,
  findClosestBigger,
  getOptimalBills,
  getBillsSum,
  invalidateAllLists,
  addDecimal,
  convertToWholeNumberBigInt,
  createInvariantPredicateSignatures,
  base64ToHexPrefixed,
} from "../../utils/utils";
import {
  timeoutBlocks,
  AlphaType,
  TransferFeeCreditView,
  AlphaDecimals,
  FeeCreditTransferType,
  FeeSystemId,
  AlphaSystemId,
  TokensSystemId,
} from "../../utils/constants";

import { privateKeyHash, splitOrderHash, transferOrderHash } from "../../utils/hashers";

export default function TransferFeeCredit(): JSX.Element | null {
  const {
    setIsActionsViewVisible,
    isActionsViewVisible,
    actionsView,
    account,
    billsList,
    selectedTransferKey,
    setSelectedTransferKey,
    setPreviousView,
    selectedTransferAccountKey,
  } = useApp();
  const { vault, activeAccountId } = useAuth();
  const queryClient = useQueryClient();

  const defaultAsset: {
    value: string;
    label: string;
  } = {
    value: "ALPHA",
    label: "ALPHA fee credit",
  };

  const pollingInterval = useRef<NodeJS.Timeout | null>(null);
  const initialRoundNumber = useRef<bigint | null | undefined>(null);
  const balanceAfterSending = useRef<bigint | null>(null);
  const [isSending, setIsSending] = useState<boolean>(false);

  const getAvailableAmount = useCallback(
    (decimals: number) => {
      return addDecimal(
        BigInt(
          account?.assets?.fungible?.find((asset) => asset.typeId === AlphaType)
            ?.amount || "0"
        ).toString() || "0",
        decimals
      );
    },
    [account]
  );
  const [availableAmount, setAvailableAmount] = useState<string>(
    getAvailableAmount(AlphaDecimals || 0)
  );

  useEffect(() => {
    setAvailableAmount(getAvailableAmount(AlphaDecimals || 0));
  }, [defaultAsset, getAvailableAmount, isActionsViewVisible]);

  const addPollingInterval = () => {
    initialRoundNumber.current = null;
    pollingInterval.current = setInterval(() => {
      invalidateAllLists(activeAccountId, AlphaType, queryClient);
      getRoundNumber(defaultAsset?.value === AlphaType).then((roundNumber) => {
        if (!initialRoundNumber?.current) {
          initialRoundNumber.current = roundNumber;
        }

        if (BigInt(initialRoundNumber?.current) + timeoutBlocks < roundNumber) {
          pollingInterval.current && clearInterval(pollingInterval.current);
        }
      });
    }, 500);
  };

  useEffect(() => {
    const activeAssetAmount = account?.assets?.fungible
      ?.filter((asset) => account?.activeNetwork === asset.network)
      .find((asset) => asset.typeId === defaultAsset?.value)?.amount;

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

    if (actionsView !== TransferFeeCreditView && pollingInterval.current) {
      clearInterval(pollingInterval.current);
    }
  }, [
    account?.assets,
    account?.activeNetwork,
    defaultAsset?.value,
    isSending,
    actionsView,
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
        onSubmit={(values, { setErrors, resetForm }) => {
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

          let convertedAmount;

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

          const billsArr = billsList?.filter(
            (bill: IBill) => bill.isDcBill !== true
          );

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

          getRoundNumber(defaultAsset?.value === AlphaType).then(
            async (roundNumber) => {
              billsToTransfer?.map(async (bill, idx) => {
                getProof(base64ToHexPrefixed(bill.id)).then(async (data) => {
                  const transferData: IFeeTransaction = {
                    payload: {
                      systemId: FeeSystemId,
                      unitId: bill.id,
                      type: FeeCreditTransferType,
                      transactionAttributes: {
                        amount: values.amount, // amount to transfer
                        targetSystemIdentifier:
                          values.assets.value === "ALPHA"
                            ? AlphaSystemId
                            : TokensSystemId, // system_identifier of the target partition (money 0000 , token 0002, vd 0003)
                        targetRecordID:
                          Buffer.from(hashingPublicKey).toString("base64"), // unit id of the corresponding “add fee credit” transaction (tuleb ise luua hetkel on private key hash)
                        earliestAdditionTime: roundNumber.toString(), // earliest round when the corresponding “add fee credit” transaction can be executed in the target system (current round number vastavalt TargetSystemIdentifierile ehk kas token, mone ..)
                        latestAdditionTime: (
                          roundNumber + timeoutBlocks
                        ).toString(), // latest round when the corresponding “add fee credit” transaction can be executed in the target system (timeout vastavalt TargetSystemIdentifierile ehk kas token, mone ..)
                        nonce: "string;", // the current state hash of the target credit record if the record exists, or to nil if the record does not exist yet (TargetRecordID billi backlink, kui on olemas)
                        backlink: bill.txHash, // hash of this unit's previous transacton (selle billi backlink, mille ma saadan tehingusse)
                      },
                      clientMetadata: {
                        timeout: (roundNumber + timeoutBlocks).toString(),
                        maxTransactionFee: "1",
                        feeCreditRecordID:
                          await privateKeyHash(hashingPrivateKey),
                      },
                    },
                    ownerProof: "",
                  };

                  const isLastTransaction =
                    Number(billsToTransfer?.length) === idx + 1 &&
                    !billToSplit &&
                    !splitBillAmount;

                  handleValidation(
                    await transferOrderHash(transferData),
                    roundNumber,
                    transferData as any,
                    isLastTransaction,
                    bill.typeId
                  );
                });
              });

              if (billToSplit && splitBillAmount) {
                getProof(base64ToHexPrefixed(billToSplit.id)).then(
                  async (data) => {
                    const splitData: IFeeTransaction = {
                      payload: {
                        systemId: FeeSystemId,
                        unitId: billToSplit.id,
                        type: FeeCreditTransferType,
                        transactionAttributes: {
                          amount: values.amount, // amount to transfer
                          targetSystemIdentifier:
                          values.assets.value === "ALPHA"
                            ? AlphaSystemId
                            : TokensSystemId, // system_identifier of the target partition (money 0000 , token 0002, vd 0003)
                          targetRecordID:
                            Buffer.from(hashingPublicKey).toString("base64"), // unit id of the corresponding “add fee credit” transaction (tuleb ise luua hetkel on private key hash)
                          earliestAdditionTime: roundNumber.toString(), // earliest round when the corresponding “add fee credit” transaction can be executed in the target system (current round number vastavalt TargetSystemIdentifierile ehk kas token, mone ..)
                          latestAdditionTime: (
                            roundNumber + timeoutBlocks
                          ).toString(), // latest round when the corresponding “add fee credit” transaction can be executed in the target system (timeout vastavalt TargetSystemIdentifierile ehk kas token, mone ..)
                          nonce: "string;", // the current state hash of the target credit record if the record exists, or to nil if the record does not exist yet (TargetRecordID billi backlink, kui on olemas)
                          backlink: billToSplit.txHash, // hash of this unit's previous transacton (selle billi backlink, mille ma saadan tehingusse)
                        },
                        clientMetadata: {
                          timeout: (roundNumber + timeoutBlocks).toString(),
                          maxTransactionFee: "1",
                          feeCreditRecordID:
                            Buffer.from(hashingPublicKey).toString("base64"),
                        },
                      },
                      ownerProof: "",
                    };

                    handleValidation(
                      await splitOrderHash(splitData),
                      roundNumber,
                      splitData as ITransfer,
                      true,
                      billToSplit.typeId
                    );
                  }
                );
              }
            }
          );

          const handleValidation = async (
            msgHash: Uint8Array,
            roundNumber: bigint,
            billData: ITransfer,
            isLastTransfer: boolean,
            billTypeId?: string
          ) => {
            const proof = await createOwnerProof(
              msgHash,
              hashingPrivateKey,
              hashingPublicKey
            );

            const finishTransaction = (billData: ITransfer) => {
              let dataWithProof = Object.assign(billData, {
                ownerProof: proof.ownerProof,
                timeout: (roundNumber + timeoutBlocks).toString(),
              });

              if (defaultAsset?.value !== AlphaType) {
                dataWithProof = { transactions: [dataWithProof] } as any;
              }

              proof.isSignatureValid &&
                makeTransaction(dataWithProof)
                  .then(() => {
                    setPreviousView(null);
                  })
                  .finally(() => {
                    const handleTransferEnd = () => {
                      addPollingInterval();
                      setIsSending(false);
                      setSelectedTransferKey(null);
                      setIsActionsViewVisible(false);
                      resetForm();
                    };

                    if (isLastTransfer) {
                      handleTransferEnd();
                    }
                  });
            };

            if (defaultAsset?.value !== AlphaType) {
              await getTypeHierarchy(billTypeId || "")
                .then(async (hierarchy: ITypeHierarchy[]) => {
                  let signatures;
                  try {
                    signatures = createInvariantPredicateSignatures(
                      hierarchy,
                      proof.ownerProof,
                      activeAccountId
                    );
                  } catch (error) {
                    setIsSending(false);
                    return setErrors({
                      password: error.message,
                    });
                  }
                  finishTransaction(billData);
                })
                .catch(() => {
                  setIsSending(false);
                  setErrors({
                    password:
                      "Fetching token hierarchy for " + billTypeId + "failed",
                  });
                });
            } else {
              finishTransaction(billData);
            }
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
          const { handleSubmit, setFieldValue, errors, touched, values } =
            formikProps;

          return (
            <form className="pad-24" onSubmit={handleSubmit}>
              <Form>
                <FormContent>
                  <Select
                    label="Assets"
                    name="assets"
                    options={[
                      {
                        value: "ALPHA",
                        label: "ALPHA fee credit",
                      },
                      {
                        value: "UT",
                        label: "User Token fee credit",
                      },
                    ]}
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
                    Transfer
                  </Button>
                </FormFooter>
              </Form>
            </form>
          );
        }}
      </Formik>
    </div>
  );
}
