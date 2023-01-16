import axios from "axios";
import { Formik } from "formik";
import * as Yup from "yup";
import classNames from "classnames";

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

import { ReactComponent as Close } from "./../../../images/close.svg";
import Check from "./../../../images/checkmark.gif";
import { ReactComponent as Fail } from "./../../../images/fail-ico.svg";
import { useAuth } from "../../../hooks/useAuth";
import { API_URL } from "../../../hooks/requests";
import { Verify } from "../../../utils/validators";

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
}: IBillsListItemProps): JSX.Element | null {
  const { vault } = useAuth();

  return (
    <>
      <div
        className={classNames("select__popover-wrap", {
          "select__popover-wrap--open": isProofVisible,
        })}
      >
        <div className="select__popover">
          <div className="select__popover-header">
            <div>BILL PROOF VERIFICATION</div>
            <Close
              onClick={() => {
                setProofCheckStatus(null);
                setIsProofVisible(false);
              }}
            />
          </div>
          <Spacer mt={16} />
          <div className="pad-16-h bills-list__proof">
            <span className="t-small">
              <b>Hash:</b>
              <div>{activeBill.txHash}</div>
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
              <div className="t-medium flex flex-align-c">
                <Fail height="42" width="42" />{" "}
                <span className="pad-8-l t-medium-small t-bold c-error">
                  {proofCheckStatus}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
      <div
        className={classNames("select__popover-wrap", {
          "select__popover-wrap--open": Boolean(isPasswordFormVisible),
        })}
      >
        <div className="select__popover">
          <div className="select__popover-header">
            <div>INSERT PASSWORD</div>
            <Close
              onClick={() => {
                setIsPasswordFormVisible(null);
              }}
            />
          </div>
          <Spacer mt={16} />
          <Formik
            initialValues={{
              password: "",
            }}
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
                ? axios
                    .get<IProofsProps>(
                      `${API_URL}/proof/${
                        account.pubKey
                      }?bill_id=${base64ToHexPrefixed(activeBill.id)}`
                    )
                    .then(async ({ data }) => {
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
                    })
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
        </div>
      </div>
      <Popup
        isPopupVisible={isLockFormVisible}
        setIsPopupVisible={setIsLockFormVisible}
        title="Add locked bill description"
      >
        <Spacer mt={16} />
        <Formik
          initialValues={{
            desc: "",
          }}
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
                        id="desc"
                        name="desc"
                        label="Bill description visible in bills list"
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
