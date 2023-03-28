import { useEffect, useRef } from "react";
import { Formik } from "formik";
import * as Yup from "yup";

import { Form, FormFooter, FormContent } from "../../../components/Form/Form";
import Textfield from "../../../components/Textfield/Textfield";
import {
  IAccount,
  IBill,
  ILockedBill,
  IProofsProps,
} from "../../../types/Types";
import Spacer from "../../../components/Spacer/Spacer";
import Button from "../../../components/Button/Button";
import {
  base64ToHexPrefixed,
  extractFormikError,
  getKeys,
} from "../../../utils/utils";
import Popup from "../../../components/Popup/Popup";

import Check from "./../../../images/checkmark.gif";
import { useAuth } from "../../../hooks/useAuth";
import { getProof } from "../../../hooks/requests";
import { Verify } from "../../../utils/validators";
import SelectPopover from "../../../components/SelectPopover/SelectPopover";

export interface IBillsListItemProps {
  setVisibleBillSettingID: (e: string | null) => void;
  setIsProofVisible: (e: boolean) => void;
  setIsLockFormVisible: (e: boolean) => void;
  setLockedBillsLocal: (e: string) => void;
  setIsPasswordFormVisible: (
    e: "proofCheck" | "handleDC" | null | undefined
  ) => void;
  setProofCheckStatus: (e: string | null | undefined) => void;
  setPassword: (e: string) => void;
  handleDC: (e: string) => void;
  proofCheckStatus: string | null | undefined;
  account: IAccount;
  activeBill: IBill;
  isProofVisible: boolean;
  lockedBills: ILockedBill[];
  isPasswordFormVisible: "proofCheck" | "handleDC" | null | undefined;
  isLockFormVisible: boolean;
  sortedListByValue: IBill[];
  tokenLabel: string;
}

function BillsListPopups({
  setVisibleBillSettingID,
  setIsProofVisible,
  setProofCheckStatus,
  setIsLockFormVisible,
  setLockedBillsLocal,
  setIsPasswordFormVisible,
  setPassword,
  handleDC,
  lockedBills,
  isProofVisible,
  account,
  activeBill,
  proofCheckStatus,
  isPasswordFormVisible,
  isLockFormVisible,
  sortedListByValue,
  tokenLabel,
}: IBillsListItemProps): JSX.Element | null {
  const { vault } = useAuth();

  return (
    <>
      <SelectPopover
        onClose={() => {
          setProofCheckStatus(null);
          setIsProofVisible(false);
        }}
        isPopoverVisible={isProofVisible}
        title={tokenLabel.toUpperCase() + " PROOF VERIFICATION"}
      >
        <>
          <Spacer mt={16} />
          <div className="pad-16-h bills-list__proof">
            <span className="t-medium-small">
              <b>Hash:</b>
              <div className="t-small">{activeBill?.txHash}</div>
            </span>
            <Spacer mt={16} />
            {!proofCheckStatus ? (
              <div className="t-medium flex">
                <img height="32" src={Check} alt="Matches" />{" "}
                <span className="pad-8-l t-medium-small t-bold">
                  Transaction hash matches & <br /> signature is valid!
                </span>
              </div>
            ) : (
              <div className="t-medium-small t-bold c-error">
                <div>Error:</div>
                <div className="bills-list__proof--error t-small">
                  {proofCheckStatus}
                </div>
              </div>
            )}
          </div>
        </>
      </SelectPopover>
      <SelectPopover
        onClose={() => {
          setIsPasswordFormVisible(null);
        }}
        isPopoverVisible={Boolean(isPasswordFormVisible)}
        title="INSERT PASSWORD"
      >
        <>
          <Spacer mt={16} />
          <Formik
            initialValues={{
              password: "",
            }}
            validateOnBlur={false}
            validationSchema={Yup.object().shape({
              password: Yup.string().required("Password is required"),
            })}
            onSubmit={async (values, { setErrors }) => {
              const { error, hashingPrivateKey, hashingPublicKey } = getKeys(
                values.password,
                Number(account.idx),
                vault
              );

              if (error || !hashingPublicKey || !hashingPrivateKey) {
                return setErrors({ password: "Password is incorrect!" });
              }

              setPassword(values.password);
              isPasswordFormVisible === "proofCheck"
                ? getProof(base64ToHexPrefixed(activeBill.id)).then(
                    async (data: IProofsProps) => {
                      data?.bills[0] &&
                        setProofCheckStatus(
                          await Verify(
                            data.bills[0],
                            activeBill,
                            hashingPrivateKey,
                            hashingPublicKey
                          )
                        );
                      await setIsProofVisible(true);
                    }
                  )
                : handleDC(values.password);
              setIsPasswordFormVisible(null);
            }}
          >
            {(formikProps) => {
              const { handleSubmit, errors, touched } = formikProps;

              return (
                <div className="pad-24-h">
                  <form onSubmit={handleSubmit}>
                    <Form>
                      <FormContent>
                        <Textfield
                          focusInput={Boolean(isPasswordFormVisible)}
                          id="password"
                          name="password"
                          label=""
                          type="password"
                          error={extractFormikError(errors, touched, [
                            "password",
                          ])}
                        />
                      </FormContent>
                      <FormFooter>
                        <Button
                          big={true}
                          block={true}
                          type="submit"
                          variant="primary"
                        >
                          Submit
                        </Button>
                      </FormFooter>
                    </Form>
                  </form>
                </div>
              );
            }}
          </Formik>
        </>
      </SelectPopover>
      <Popup
        isPopupVisible={isLockFormVisible}
        setIsPopupVisible={setIsLockFormVisible}
        title={"Add locked " + tokenLabel + " description"}
      >
        <Spacer mt={16} />
        <Formik
          initialValues={{
            desc: "",
          }}
          validateOnBlur={false}
          validationSchema={Yup.object().shape({
            desc: Yup.string().required("Description is required"),
          })}
          onSubmit={(values, { resetForm }) => {
            setLockedBillsLocal(
              JSON.stringify([
                ...lockedBills,
                {
                  billId: activeBill.id,
                  desc: values.desc,
                  value: sortedListByValue.find(
                    (bill: IBill) => bill.id === activeBill.id
                  )?.value,
                },
              ])
            );
            setVisibleBillSettingID(null);
            resetForm();
            setIsLockFormVisible(false);
          }}
        >
          {(formikProps) => {
            const { handleSubmit, errors, touched } = formikProps;

            return (
              <div className="w-100p">
                <form onSubmit={handleSubmit}>
                  <Form>
                    <FormContent>
                      <Textfield
                        focusInput={isLockFormVisible}
                        id="desc"
                        name="desc"
                        label={
                          tokenLabel +
                          " description visible in " +
                          tokenLabel +
                          " list"
                        }
                        type="desc"
                        error={extractFormikError(errors, touched, ["desc"])}
                      />
                    </FormContent>
                    <FormFooter>
                      <Button
                        big={true}
                        block={true}
                        type="submit"
                        variant="primary"
                      >
                        Lock & add description
                      </Button>
                    </FormFooter>
                  </Form>
                </form>
              </div>
            );
          }}
        </Formik>
      </Popup>
    </>
  );
}

export default BillsListPopups;
