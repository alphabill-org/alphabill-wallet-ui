import { useCallback, useEffect, useRef, useState } from "react";
import { Formik } from "formik";
import * as Yup from "yup";
import { Form, FormFooter, FormContent } from "../../components/Form/Form";
import { useQueryClient } from "react-query";
import { encode } from "cbor-x";

import Button from "../../components/Button/Button";
import Spacer from "../../components/Spacer/Spacer";
import Textfield from "../../components/Textfield/Textfield";

import Select from "../../components/Select/Select";
import { IBill, IFeeCreditBills, ITransactionPayload } from "../../types/Types";
import { useApp } from "../../hooks/appProvider";
import { useAuth } from "../../hooks/useAuth";
import {
  getFeeCreditBills,
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
} from "../../utils/utils";
import {
  timeoutBlocks,
  AlphaType,
  TransferFeeCreditView,
  AlphaDecimals,
  FeeCreditTransferType,
  AlphaSystemId,
  TokensSystemId,
  maxTransactionFee,
} from "../../utils/constants";

import { createRequestData, publicKeyHash } from "../../utils/hashers";

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
  const balanceAfterSending = useRef<bigint | null>(null);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [feeCreditData, setFeeCreditData] = useState<IFeeCreditBills | null>();

  useEffect(() => {
    const fetchData = async () => {
      const publicKey = await publicKeyHash(
        Buffer.from(activeAccountId, "hex"),
        true
      );
      const result = await getFeeCreditBills(publicKey as string);
      setFeeCreditData(result);
    };

    fetchData();
  }, [activeAccountId]);
  console.log(AlphaSystemId);

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
        onSubmit={async (values, { setErrors, resetForm }) => {
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

          const pubKeyHash = (await publicKeyHash(
            hashingPublicKey
          )) as Uint8Array;
          const pubKeyHashHex = (await publicKeyHash(
            hashingPublicKey,
            true
          )) as string;
          const isAlpha = values.assets.value === AlphaType;
          const creditBill = feeCreditData?.[isAlpha ? "alpha" : "tokens"];
          const isTargetBillCreated = creditBill?.id === pubKeyHashHex;
          const backlink = isTargetBillCreated
            ? Buffer.from(creditBill?.backlink, "base64")
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
                      amount: BigInt(values.amount), // amount to transfer
                      targetSystemIdentifier: isAlpha
                        ? AlphaSystemId
                        : TokensSystemId, // system_identifier of the target partition (money 0000 , token 0002, vd 0003)
                      targetRecordID: pubKeyHash, // unit id of the corresponding “add fee credit” transaction (public key hash)
                      earliestAdditionTime: roundNumber, // earliest round when the corresponding “add fee credit” transaction can be executed in the target system (current round number vastavalt TargetSystemIdentifierile ehk kas token, mone ..)
                      latestAdditionTime: roundNumber + timeoutBlocks, // latest round when the corresponding “add fee credit” transaction can be executed in the target system (timeout vastavalt TargetSystemIdentifierile ehk kas token, mone ..)
                      nonce: backlink, // the current state hash of the target credit record if the record exists, or to nil if the record does not exist yet (TargetRecordID billi backlink, kui on olemas)
                      backlink: Buffer.from(bill.txHash, "base64"), // hash of this unit's previous transacton (selle billi backlink, mille ma saadan tehingusse)
                    },
                    clientMetadata: {
                      timeout: roundNumber + timeoutBlocks,
                      maxTransactionFee: maxTransactionFee,
                      feeCreditRecordID: pubKeyHash,
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
                      amount: BigInt(values.amount), // amount to transfer
                      targetSystemIdentifier:
                        values.assets.value === AlphaType
                          ? AlphaSystemId
                          : TokensSystemId, // system_identifier of the target partition (money 0000 , token 0002, vd 0003)
                      targetRecordID: pubKeyHash, // unit id of the corresponding “add fee credit” transaction (tuleb ise luua hetkel on public key hash)
                      earliestAdditionTime: roundNumber, // earliest round when the corresponding “add fee credit” transaction can be executed in the target system (current round number vastavalt TargetSystemIdentifierile ehk kas token, mone ..)
                      latestAdditionTime: roundNumber + timeoutBlocks, // latest round when the corresponding “add fee credit” transaction can be executed in the target system (timeout vastavalt TargetSystemIdentifierile ehk kas token, mone ..)
                      nonce: backlink, // the current state hash of the target credit record if the record exists, or to nil if the record does not exist yet (TargetRecordID billi backlink, kui on olemas)
                      backlink: Buffer.from(billToSplit.txHash, "base64"), // hash of this unit's previous transacton (selle billi backlink, mille ma saadan tehingusse)
                    },
                    clientMetadata: {
                      timeout: roundNumber + timeoutBlocks,
                      maxTransactionFee: maxTransactionFee,
                      feeCreditRecordID: pubKeyHash,
                    },
                  },
                };

                handleValidation(splitData, true);
              }
            }
          );

          const handleValidation = async (
            billData: ITransactionPayload,
            isLastTransfer: boolean
          ) => {
            const proof = await createOwnerProof(
              billData.payload,
              hashingPrivateKey,
              hashingPublicKey
            );

            const finishTransaction = (billData: ITransactionPayload) => {
              proof.isSignatureValid &&
                makeTransaction(createRequestData(billData, proof.ownerProof))
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

            finishTransaction(billData);
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
