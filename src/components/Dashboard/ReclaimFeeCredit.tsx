import { useEffect, useRef, useState } from "react";
import { Formik } from "formik";
import * as Yup from "yup";
import { Form, FormFooter, FormContent } from "../Form/Form";
import { useQueryClient } from "react-query";

import Button from "../Button/Button";
import Spacer from "../Spacer/Spacer";
import Textfield from "../Textfield/Textfield";

import {
  IBill,
  ITransactionPayload,
  IPayloadClientMetadata,
  ITransactionPayloadObj,
  ITxProof,
  IFungibleAsset,
} from "../../types/Types";
import { useApp } from "../../hooks/appProvider";
import { useAuth } from "../../hooks/useAuth";
import {
  getProof,
  getRoundNumber,
  makeTransaction,
} from "../../hooks/requests";

import {
  extractFormikError,
  getKeys,
  createOwnerProof,
  invalidateAllLists,
  base64ToHexPrefixed,
  unit8ToHexPrefixed,
} from "../../utils/utils";
import {
  FeeTimeoutBlocks,
  AlphaType,
  AlphaSystemId,
  TokensSystemId,
  MaxTransactionFee,
  TokenType,
  FeeCreditCloseType,
  FeeCreditReclaimType,
} from "../../utils/constants";

import {
  prepTransactionRequestData,
  transferOrderTxHash,
} from "../../utils/hashers";
import Popup from "../Popup/Popup";

export default function ReclaimFeeCredit({
  isAlpha,
  isHidden,
}: {
  isAlpha: boolean;
  isHidden: boolean;
}): JSX.Element | null {
  const { account, billsList, setPreviousView, feeCreditBills } = useApp();
  const { vault, activeAccountId, setActiveAssetLocal } = useAuth();
  const queryClient = useQueryClient();
  const billsArr = billsList
    .filter((bill: any) => Number(bill.value) >= 1)
    ?.filter((bill: IBill) => !Boolean(bill.targetUnitId));
  const balance: string =
    account?.assets?.fungible?.find(
      (asset: IFungibleAsset) => asset.typeId === AlphaType
    )?.amount || "";
  const pollingInterval = useRef<NodeJS.Timeout | null>(null);
  const initialRoundNumber = useRef<bigint | null | undefined>(null);
  const isFeeReclaimed = useRef<boolean>(false);
  const closePollingProofProps = useRef<{
    id: string;
    txHash: string;
  } | null>(null);
  const balanceAfterReclaim = useRef<bigint | null>(null);
  const [isSending, setIsSending] = useState<boolean>(false);

  const currentCreditBill = isAlpha
    ? feeCreditBills?.ALPHA
    : feeCreditBills?.UTP;
  const isMinReclaimAmount = Number(currentCreditBill?.value) > 2;

  const resetRefs = () => {
    balanceAfterReclaim.current = null;
    closePollingProofProps.current = null;
  };
  const [isReclaimPopupVisible, setIsReclaimPopupVisible] =
    useState<boolean>(false);

  useEffect(() => {
    if (
      BigInt(balance || "0") &&
      balanceAfterReclaim.current &&
      BigInt(balance || "0") >= BigInt(balanceAfterReclaim.current || "0")
    ) {
      pollingInterval.current && clearInterval(pollingInterval.current);
      setIsSending(false);
      resetRefs();
      setIsReclaimPopupVisible(false);
    }
  }, [billsList, account, feeCreditBills, balance]);
  const buttonLabel =
    "Reclaim " + (isAlpha ? AlphaType : TokenType) + " credits";

  return (
    <>
      <Button
        small={true}
        block={true}
        type="button"
        variant="secondary"
        working={isSending}
        className={isHidden ? "reclaim hidden" : "reclaim"}
        disabled={isSending || !billsArr?.[0]?.txHash || !isMinReclaimAmount}
        onClick={() => {
          setActiveAssetLocal(
            JSON.stringify(
              account?.assets?.fungible.find(
                (asset) => asset.typeId === AlphaType
              )
            )
          );
          setIsReclaimPopupVisible(!isReclaimPopupVisible);
        }}
      >
        {!billsArr?.[0]?.txHash
          ? "ALPHAs needed to reclaim fees"
          : !isMinReclaimAmount
          ? "Not enough credit to reclaim"
          : buttonLabel}
      </Button>
      <Popup
        isPopupVisible={isReclaimPopupVisible}
        setIsPopupVisible={setIsReclaimPopupVisible}
        title="Reclaim fee credit"
        isCloseOnDocumentClickDisabled
        isCloseBtnHidden
      >
        <Formik
          initialValues={{
            password: "",
          }}
          onSubmit={async (values, { setErrors, resetForm }) => {
            resetRefs();
            isFeeReclaimed.current = false;

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

            setIsSending(true);

            const baseObj = (
              bill: IBill,
              isClose: boolean,
              proof?: ITxProof
            ) => {
              const attr = isClose
                ? baseCloseAttr(bill)
                : baseReclaimAttr(proof!);
              return {
                payload: {
                  systemId:
                    !isAlpha && isClose ? TokensSystemId : AlphaSystemId,
                  type: isClose ? FeeCreditCloseType : FeeCreditReclaimType,
                  unitId: isClose
                    ? Buffer.from(bill.id, "base64")
                    : Buffer.from(billsList[0].id, "base64"),
                  ...attr,
                },
              };
            };

            const baseCloseAttr = (bill: IBill) => {
              return {
                attributes: {
                  amount: BigInt(bill.value),
                  targetUnitID: Buffer.from(billsList[0].id, "base64"),
                  nonce: Buffer.from(billsList[0].txHash, "base64"),
                },
              };
            };

            const baseReclaimAttr = (proof: ITxProof) => {
              return {
                attributes: {
                  closeFeeCreditTransfer: proof.txRecord,
                  closeFeeCreditProof: proof.txProof,
                  backlink: Buffer.from(billsList[0].txHash, "base64"),
                },
              };
            };

            if (!billsArr?.[0]?.txHash) {
              return setErrors({
                password: "ALPHAs needed to reclaim fees",
              });
            }

            const initTransaction = async (
              billData: ITransactionPayload,
              isClose: boolean
            ) => {
              getRoundNumber(isAlpha).then(async (variableRoundNumber) => {
                const id = billData.payload.unitId;

                (billData.payload.clientMetadata as IPayloadClientMetadata) = {
                  timeout: variableRoundNumber + FeeTimeoutBlocks,
                  MaxTransactionFee: MaxTransactionFee,
                  feeCreditRecordID: null,
                };

                const proof = await createOwnerProof(
                  billData.payload as ITransactionPayloadObj,
                  hashingPrivateKey,
                  hashingPublicKey
                );

                const finishTransaction = (
                  billData: ITransactionPayload,
                  isClose: boolean
                ) => {
                  proof.isSignatureValid &&
                    makeTransaction(
                      prepTransactionRequestData(billData, proof.ownerProof),
                      activeAccountId,
                      isClose ? isAlpha : true
                    )
                      .then(() => {
                        setPreviousView(null);
                      })
                      .catch(() => {
                        pollingInterval.current &&
                          clearInterval(pollingInterval.current);
                        resetRefs();
                        setIsSending(false);
                      })
                      .finally(async () => {
                        const txHash = await transferOrderTxHash(
                          prepTransactionRequestData(billData, proof.ownerProof)
                        );

                        closePollingProofProps.current = {
                          id: unit8ToHexPrefixed(id),
                          txHash: txHash,
                        };
                        isClose && addPollingInterval();
                      });
                };

                finishTransaction(billData, isClose);
              });
            };

            currentCreditBill &&
              (await initTransaction(baseObj(currentCreditBill, true), true));

            balanceAfterReclaim.current =
              BigInt(balance) +
              BigInt(currentCreditBill?.value || "0") -
              MaxTransactionFee * 2n;

            const addPollingInterval = () => {
              pollingInterval.current = setInterval(async () => {
                initialRoundNumber.current = null;
                invalidateAllLists(activeAccountId, AlphaType, queryClient);

                if (closePollingProofProps.current) {
                  getProof(
                    closePollingProofProps.current.id,
                    base64ToHexPrefixed(closePollingProofProps.current.txHash),
                    !isAlpha
                  )
                    .then(async (data) => {
                      if (data?.txRecord) {
                        isFeeReclaimed.current = true;
                        currentCreditBill &&
                          initTransaction(
                            baseObj(currentCreditBill, false, data),
                            false
                          );
                        resetForm();
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
          }}
          validateOnBlur={false}
          validationSchema={Yup.object().shape({
            password: Yup.string().required("Password is required"),
          })}
        >
          {(formikProps) => {
            const { handleSubmit, errors, touched } = formikProps;
            const id = "Reclaim" + (isAlpha ? AlphaType : TokenType);
            return (
              <form onSubmit={handleSubmit}>
                <Spacer mb={16} />

                <Form>
                  <FormContent>
                    <Textfield
                      focusInput={isReclaimPopupVisible}
                      id={id}
                      name="password"
                      label="Add password"
                      type="password"
                      error={extractFormikError(errors, touched, ["password"])}
                    />
                  </FormContent>
                  <FormFooter>
                    <div className="button__group">
                      <Button
                        type="reset"
                        onClick={() => setIsReclaimPopupVisible(false)}
                        big={true}
                        block={true}
                        disabled={isSending}
                        variant="secondary"
                      >
                        Cancel
                      </Button>
                      <Button
                        big={true}
                        block={true}
                        type="submit"
                        variant="primary"
                        working={isSending}
                      >
                        Reclaim fees
                      </Button>
                    </div>
                  </FormFooter>
                </Form>
              </form>
            );
          }}
        </Formik>
      </Popup>
    </>
  );
}
