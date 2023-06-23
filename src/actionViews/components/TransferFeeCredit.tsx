import { useCallback, useEffect, useRef, useState } from "react";
import { Formik } from "formik";
import * as Yup from "yup";
import { Form, FormFooter, FormContent } from "../../components/Form/Form";
import { useQueryClient } from "react-query";

import Button from "../../components/Button/Button";
import Spacer from "../../components/Spacer/Spacer";
import Textfield from "../../components/Textfield/Textfield";

import Select from "../../components/Select/Select";
import { IBill, ITransactionPayload } from "../../types/Types";
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
  addDecimal,
  convertToWholeNumberBigInt,
  base64ToHexPrefixed,
  getNewBearer,
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
} from "../../utils/constants";

import {
  bufferizeObject,
  prepTransactionRequestData,
  publicKeyHash,
  transferOrderTxHash,
} from "../../utils/hashers";
import { truncate } from "lodash";

export default function TransferFeeCredit(): JSX.Element | null {
  const {
    setIsActionsViewVisible,
    isActionsViewVisible,
    account,
    billsList,
    selectedTransferKey,
    setSelectedTransferKey,
    setPreviousView,
  } = useApp();
  const { vault, activeAccountId } = useAuth();
  const queryClient = useQueryClient();

  const defaultAsset: {
    value: string;
    label: string;
  } = {
    value: AlphaType,
    label: "ALPHA fee credit",
  };

  const pollingInterval = useRef<NodeJS.Timeout | null>(null);
  const initialRoundNumber = useRef<bigint | null | undefined>(null);
  const billProof = useRef<any>(null);
  const isFeeAdded = useRef<boolean | null>(null);
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
  }, [getAvailableAmount, isActionsViewVisible]);

  if (!isActionsViewVisible) return <div></div>;

  return (
    <div className="w-100p">
      <Formik
        initialValues={{
          amount: "",
          assets: defaultAsset,
          password: "",
        }}
        onSubmit={async (values, { setErrors, resetForm }) => {
          isFeeAdded.current = null;
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
            ) as bigint;
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

          const pubKeyHash = await publicKeyHash(activeAccountId);
          const pubKeyHashHex = await publicKeyHash(activeAccountId, true);
          const creditBills = await getFeeCreditBills(pubKeyHashHex as string);
          const isAlpha = values.assets.value === AlphaType;
          const creditBill = creditBills?.[isAlpha ? "alpha" : "tokens"];
          const backlink = creditBill
            ? Buffer.from(creditBill?.tx_hash, "base64")
            : null;

          getRoundNumber(defaultAsset?.value === AlphaType).then(
            async (roundNumber) => {
              billsToTransfer?.map(async (bill, idx) => {
                const transferData: ITransactionPayload = {
                  payload: {
                    systemId: AlphaSystemId,
                    type: FeeCreditTransferType,
                    unitId: Buffer.from(bill.id, "base64"),
                    attributes: {
                      amount: convertedAmount, // amount to transfer
                      targetSystemIdentifier: isAlpha
                        ? AlphaSystemId
                        : TokensSystemId, // system_identifier of the target partition (money 0000 , token 0002, vd 0003)
                      targetRecordID: pubKeyHash, // unit id of the corresponding “add fee credit” transaction (public key hash)
                      earliestAdditionTime: roundNumber, // earliest round when the corresponding “add fee credit” transaction can be executed in the target system (current round number vastavalt TargetSystemIdentifierile ehk kas token, mone ..)
                      latestAdditionTime: roundNumber + feeTimeoutBlocks, // latest round when the corresponding “add fee credit” transaction can be executed in the target system (timeout vastavalt TargetSystemIdentifierile ehk kas token, mone ..)
                      nonce: backlink, // the current state hash of the target credit record if the record exists, or to nil if the record does not exist yet (TargetRecordID billi backlink, kui on olemas)
                      backlink: Buffer.from(bill.txHash, "base64"), // hash of this unit's previous transacton (selle billi txHash, mille ma saadan tehingusse)
                    },
                    clientMetadata: {
                      timeout: roundNumber + feeTimeoutBlocks,
                      maxTransactionFee: maxTransactionFee,
                      feeCreditRecordID: null,
                    },
                  },
                };

                const isLastTransaction =
                  Number(billsToTransfer?.length) === idx + 1 &&
                  !billToSplit &&
                  !splitBillAmount;
                handleValidation(transferData as any, isLastTransaction);
              });

              if (billToSplit && splitBillAmount) {
                const splitData: ITransactionPayload = {
                  payload: {
                    systemId: AlphaSystemId,
                    type: FeeCreditTransferType,
                    unitId: Buffer.from(billToSplit.id, "base64"),
                    attributes: {
                      amount: convertedAmount, // amount to transfer
                      targetSystemIdentifier:
                        values.assets.value === AlphaType
                          ? AlphaSystemId
                          : TokensSystemId, // system_identifier of the target partition (money 0000 , token 0002, vd 0003)
                      targetRecordID: pubKeyHash, // unit id of the corresponding “add fee credit” transaction (tuleb ise luua hetkel on public key hash)
                      earliestAdditionTime: roundNumber, // earliest round when the corresponding “add fee credit” transaction can be executed in the target system (current round number vastavalt TargetSystemIdentifierile ehk kas token, mone ..)
                      latestAdditionTime: roundNumber + feeTimeoutBlocks, // latest round when the corresponding “add fee credit” transaction can be executed in the target system (timeout vastavalt TargetSystemIdentifierile ehk kas token, mone ..)
                      nonce: backlink, // the current state hash of the target credit record if the record exists, or to nil if the record does not exist yet (TargetRecordID billi backlink, kui on olemas)
                      backlink: Buffer.from(billToSplit.txHash, "base64"), // hash of this unit's previous transacton (selle billi backlink, mille ma saadan tehingusse)
                    },
                    clientMetadata: {
                      timeout: roundNumber + feeTimeoutBlocks,
                      maxTransactionFee: maxTransactionFee,
                      feeCreditRecordID: null,
                    },
                  },
                };
                handleValidation(splitData, true);
              }
            }
          );

          const handleValidation = async (
            billData: ITransactionPayload,
            isLastTransfer: boolean,
            isTokensRequest?: boolean
          ) => {
            const proof = await createOwnerProof(
              billData.payload,
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
                  .finally(() => {
                    const handleTransferEnd = async () => {
                      addPollingInterval(
                        "0x" +
                          Buffer.from(billData.payload.unitId).toString("hex"),
                        await transferOrderTxHash(
                          prepTransactionRequestData(billData, proof.ownerProof)
                        )
                      );

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

            finishTransaction(billData);
          };

          const addPollingInterval = (id: string, hash: string) => {
            initialRoundNumber.current = null;
            pollingInterval.current = setInterval(async () => {
              const pubKeyHash = await publicKeyHash(activeAccountId, true);
              invalidateAllLists(activeAccountId, AlphaType, queryClient);
              queryClient.invalidateQueries(["feeBillsList", pubKeyHash]);
              getProof(id).then(async (data) => {
                const hashMatch = data?.bills[0].tx_hash === hash;
                if (hashMatch) {
                  billProof.current = data?.bills[0];
                }
              });

              if (base64ToHexPrefixed(billProof.current?.id) === id) {
                if (isFeeAdded.current !== true) {
                  addFeeCredit();
                }
                pollingInterval.current &&
                  clearInterval(pollingInterval.current);
              }

              getRoundNumber(defaultAsset?.value === AlphaType).then(
                (roundNumber) => {
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
                }
              );
            }, 500);
          };

          const addFeeCredit = () => {
            getRoundNumber(defaultAsset?.value === AlphaType).then(
              async (roundNumber) => {
                let proofFee = billProof.current.tx_proof.txProof;
                const seal = proofFee.UnicityCertificate.unicity_seal;
                proofFee.UnicityCertificate.unicity_seal = {
                  root_chain_round_number: seal.root_chain_round_number,
                  timestamp: seal.timestamp,
                  previousHash: seal.PreviousHash || null,
                  hash: seal.hash,
                  signatures: seal.signatures,
                };
                const transferData: ITransactionPayload = {
                  payload: {
                    systemId: Boolean(values.assets.value === AlphaType)
                      ? AlphaSystemId
                      : TokensSystemId,
                    type: FeeCreditAddType,
                    unitId: pubKeyHash as Uint8Array,
                    attributes: {
                      feeCreditOwnerCondition: getNewBearer(account),
                      feeCreditTransfer: bufferizeObject(
                        billProof.current.tx_proof.txRecord
                      ), // bill transfer record of type "transfer fee credit" (based on created bill GET /proof)
                      feeCreditTransferProof: bufferizeObject(proofFee), // transaction proof of "transfer fee credit" transaction (based on created bill GET /proof)
                    },
                    clientMetadata: {
                      timeout: roundNumber + feeTimeoutBlocks,
                      maxTransactionFee: maxTransactionFee,
                      feeCreditRecordID: null,
                    },
                  },
                };

                isFeeAdded.current = true;
                handleValidation(
                  transferData as any,
                  true,
                  !Boolean(values.assets.value === AlphaType)
                );
              }
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
                    label="Assets"
                    name="assets"
                    options={[
                      {
                        value: AlphaType,
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
                    Transfer credit
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
