import { Formik } from "formik";
import * as Yup from "yup";

import { Form, FormFooter, FormContent } from "../../../components/Form/Form";
import Textfield from "../../../components/Textfield/Textfield";
import {
  IAccount,
  IActiveAsset,
  IBill,
  IProofsProps,
} from "../../../types/Types";
import Spacer from "../../../components/Spacer/Spacer";
import Button from "../../../components/Button/Button";
import {
  base64ToHexPrefixed,
  extractFormikError,
  getKeys,
} from "../../../utils/utils";

import Check from "./../../../images/checkmark.gif";
import { useAuth } from "../../../hooks/useAuth";
import { getProof } from "../../../hooks/requests";
import { Verify } from "../../../utils/validators";
import SelectPopover from "../../../components/SelectPopover/SelectPopover";

export interface IBillsListItemProps {
  setIsProofVisible: (e: boolean) => void;
  setIsPasswordFormVisible: (
    e: "proofCheck" | "handleDC" | null | undefined
  ) => void;
  setProofCheckStatus: (e: string | null | undefined) => void;
  setPassword: (e: string) => void;
  handleDC: (e: string) => void;
  proofCheckStatus: string | null | undefined;
  account: IAccount;
  activeBill: IActiveAsset;
  isProofVisible: boolean;
  isPasswordFormVisible: "proofCheck" | "handleDC" | null | undefined;
  sortedListByValue: IBill[];
  tokenLabel: string;
}

function BillsListPopups({
  setIsProofVisible,
  setProofCheckStatus,
  setIsPasswordFormVisible,
  setPassword,
  handleDC,
  isProofVisible,
  account,
  activeBill,
  proofCheckStatus,
  isPasswordFormVisible,
  tokenLabel,
}: IBillsListItemProps): JSX.Element | null {
  const { vault } = useAuth();

  return (
    <>
      <SelectPopover
        key="proofVerification"
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
        key="password"
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
                Number(account?.idx),
                vault
              );

              if (error || !hashingPublicKey || !hashingPrivateKey) {
                return setErrors({ password: "Password is incorrect!" });
              }

              setPassword(values.password);
              isPasswordFormVisible === "proofCheck"
                ? getProof(base64ToHexPrefixed(activeBill.id)).then(
                    async (data: IProofsProps | undefined) => {
                      data?.bills[0] &&
                        setProofCheckStatus(
                          await Verify(
                            data.bills[0],
                            activeBill as IBill,
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
    </>
  );
}

export default BillsListPopups;
