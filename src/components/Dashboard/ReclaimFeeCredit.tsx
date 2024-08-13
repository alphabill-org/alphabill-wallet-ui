import { useEffect, useRef, useState } from "react";
import { Formik, FormikErrors, FormikState } from "formik";
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
  reclaimFeeCredit,
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
import { Base16Converter } from "@alphabill/alphabill-js-sdk/lib/util/Base16Converter";
import { FormValues } from "../../actionViews/components/TransferFeeCredit";

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
    ?.filter((bill: any) => Number(bill.value) >= 1)
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

  const addPollingInterval = (
    txHash: Uint8Array,
    resetForm: (nextState?: Partial<FormikState<{password: string;}>>) => void
  ) => {
    pollingInterval.current = setInterval(async () => {
      initialRoundNumber.current = null;
      invalidateAllLists(activeAccountId, AlphaType, queryClient);

        getProof(
          Base16Converter.encode(txHash),
          isAlpha
        )
          .then(async (data) => {
            if (data?.transactionProof) {
              isFeeReclaimed.current = true;
              setIsSending(false);
              resetForm();
            }
          }).catch(() => {
            throw new Error('Error fetching transactiob proof');
          })
          .finally(() => setIntervalCancel());
      }
    , 1000);
  };
  const setIntervalCancel = () => {
    pollingInterval.current &&
      clearInterval(pollingInterval.current);
  };

  const handleSubmit = async(
    values: {password: string;}, 
    setErrors: (errors: FormikErrors<{password: string;}>) => void,
    resetForm: (nextState?: Partial<FormikState<{password: string;}>>) => void
  ) => {
    isFeeReclaimed.current = false;
    setIsSending(true);

    const {error, hashingPrivateKey, hashingPublicKey} = getKeys(
      values.password,
      Number(account?.idx),
      vault
    );

    if (error || !hashingPrivateKey || !hashingPublicKey) {
      return setErrors({
        password: error || "Hashing keys are missing!",
      });
    }

    try {
      const reclaimTxHash = await reclaimFeeCredit(hashingPrivateKey);
      console.log(reclaimTxHash);
      if(!reclaimTxHash){
        setIsSending(false);
        return setErrors({
          password: error || "Error occured during the transaction"
        })
      }
      addPollingInterval(reclaimTxHash, resetForm)
    } catch(error) {
      console.log(error);
      setIsSending(false);
      setErrors({
        password: 'Error occured during the transaction'
      })
    }
  }

  return (
    <>
      <div style={{ display: isReclaimPopupVisible ? "none" : "unset" }}>
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
      </div>
      <Popup
        isPopupVisible={isReclaimPopupVisible}
        setIsPopupVisible={setIsReclaimPopupVisible}
        title="Reclaim fee credit"
        isCloseOnDocumentClickDisabled
        isCloseBtnHidden
        isFixed
      >
        <Formik
          initialValues={{
            password: "",
          }}
          onSubmit={async (values, { setErrors, resetForm }) => handleSubmit(values, setErrors, resetForm)
          //   resetRefs();
          //   isFeeReclaimed.current = false;

          //   const { error, hashingPrivateKey, hashingPublicKey } = getKeys(
          //     values.password,
          //     Number(account?.idx),
          //     vault
          //   );

          //   if (error || !hashingPrivateKey || !hashingPublicKey) {
          //     return setErrors({
          //       password: error || "Hashing keys are missing!",
          //     });
          //   }

          //   setIsSending(true);

          //   if (!billsArr?.[0]?.txHash) {
          //     return setErrors({
          //       password: "ALPHAs needed to reclaim fees",
          //     });
          //   }

          //   const initTransaction = async (
          //     billData: ITransactionPayload,
          //     isClose: boolean
          //   ) => {
          //     getRoundNumber(true).then(async (variableRoundNumber) => {
          //       const id = billData.payload.unitId;

          //       (billData.payload.clientMetadata as IPayloadClientMetadata) = {
          //         timeout: variableRoundNumber + FeeTimeoutBlocks,
          //         MaxTransactionFee: MaxTransactionFee,
          //         feeCreditRecordID: null,
          //       };

          //       const proof = await createOwnerProof(
          //         billData.payload as ITransactionPayloadObj,
          //         hashingPrivateKey,
          //         hashingPublicKey
          //       );

          //       const finishTransaction = () => {
          //         let txHash: Uint8Array;
          //         proof.isSignatureValid &&
          //           reclaimFeeCredit(
          //             hashingPrivateKey
          //           )
          //             .then((result) => {
          //               txHash = result;
          //               setPreviousView(null);
          //             })
          //             .catch(() => {
          //               pollingInterval.current &&
          //                 clearInterval(pollingInterval.current);
          //               resetRefs();
          //               setIsSending(false);
          //             })
          //             .finally(async () => {
          //               closePollingProofProps.current = {
          //                 id: unit8ToHexPrefixed(id),
          //                 txHash: Base16Converter.encode(txHash),
          //               };
          //               isClose && addPollingInterval();
          //             });
          //       };

          //       finishTransaction();
          //     });
          //   };

          //   currentCreditBill &&
          //     (await initTransaction(baseObj(currentCreditBill, true), true));

          //   balanceAfterReclaim.current =
          //     BigInt(balance) +
          //     BigInt(currentCreditBill?.value || "0") -
          //     MaxTransactionFee * 2n;

          //   const addPollingInterval = () => {
          //     pollingInterval.current = setInterval(async () => {
          //       initialRoundNumber.current = null;
          //       invalidateAllLists(activeAccountId, AlphaType, queryClient);

          //       if (closePollingProofProps.current) {
          //         getProof(
          //           base64ToHexPrefixed(closePollingProofProps.current.txHash),
          //           !isAlpha
          //         )
          //           .then(async (data) => {
          //             if (data?.transactionProof) {
          //               isFeeReclaimed.current = true;
          //               resetForm();
          //             }
          //           })
          //           .finally(() => setIntervalCancel());
          //       }

          //       const setIntervalCancel = () => {
          //         getRoundNumber(isAlpha).then((roundNumber) => {
          //           if (!initialRoundNumber?.current) {
          //             initialRoundNumber.current = roundNumber;
          //           }
          //           if (
          //             BigInt(initialRoundNumber?.current) + FeeTimeoutBlocks <
          //             roundNumber
          //           ) {
          //             pollingInterval.current &&
          //               clearInterval(pollingInterval.current);
          //           }
          //         });
          //       };
          //     }, 1000);
          //   };
          // }}
          // validateOnBlur={false}
          // validationSchema={Yup.object().shape({
          //   password: Yup.string().required("Password is required"),
          // })
         }
        >
          {(formikProps) => {
            const { handleSubmit, errors, touched, resetForm } = formikProps;
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
                        onClick={() => {
                          setIsReclaimPopupVisible(false);
                          resetForm();
                        }}
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
                        disabled={isSending}
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
