import { useCallback, useRef, useState } from "react";
import { useQueryClient } from "react-query";
import { useApp } from "../../hooks/appProvider";
import { useAuth } from "../../hooks/useAuth";

import { Formik, FormikErrors, FormikState } from "formik";
import { Form, FormFooter, FormContent } from "../Form/Form";
import { IBill } from "../../types/Types";
import { reclaimFeeCredit } from "../../hooks/requests";
import { extractFormikError, getKeys, invalidateAllLists } from "../../utils/utils";
import { AlphaType, TokenType } from "../../utils/constants";

import Button from "../Button/Button";
import Spacer from "../Spacer/Spacer";
import Textfield from "../Textfield/Textfield";
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

  const [isSending, setIsSending] = useState<boolean>(false);
  const [isReclaimPopupVisible, setIsReclaimPopupVisible] = useState<boolean>(false);

  const pollingInterval = useRef<NodeJS.Timeout | null>(null);

  const billsArr = billsList
    ?.filter((bill: any) => Number(bill.value) >= 1)
    ?.filter((bill: IBill) => !Boolean(bill.targetUnitId));

  const currentCreditBill = isAlpha
    ? feeCreditBills?.ALPHA
    : feeCreditBills?.UTP;

  const isMinReclaimAmount = Number(currentCreditBill?.value) > 2;
  const buttonLabel = "Reclaim " + (isAlpha ? AlphaType : TokenType) + " credits";

  const addPollingInterval = useCallback(() => {
      pollingInterval.current = setInterval(() => {
        invalidateAllLists(activeAccountId, AlphaType, queryClient);
      }, 1000);
    }, [queryClient, activeAccountId]
  );
  

  const handleSubmit = useCallback( async(
      values: {password: string;}, 
      setErrors: (errors: FormikErrors<{password: string;}>) => void,
      resetForm: (nextState?: Partial<FormikState<{password: string;}>>) => void
    ) => {
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

      setIsSending(true);

      try {
        setPreviousView(null);
        const reclaimTxHash = await reclaimFeeCredit(hashingPrivateKey, isAlpha);
        if (!reclaimTxHash) {
          setIsSending(false);
          return setErrors({
            password: error || "Error occurred during the transaction"
          });
        }
        addPollingInterval()
      } catch(error) {
        setIsSending(false);
        setErrors({
          password: 'Error occurred during the transaction'
        })
      }
    }, [account?.idx, addPollingInterval, isAlpha, setPreviousView, vault]
  );

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
          onSubmit={async (values, { setErrors, resetForm }) => handleSubmit(values, setErrors, resetForm)}
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

