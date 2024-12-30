import { Formik } from "formik";
import * as Yup from "yup";

import Button from "../../../components/Button/Button";
import { Form, FormFooter, FormContent } from "../../../components/Form/Form";
import SelectPopover from "../../../components/SelectPopover/SelectPopover";
import Spacer from "../../../components/Spacer/Spacer";
import Textfield from "../../../components/Textfield/Textfield";
import { useAuth } from "../../../hooks/useAuth";
import { IAccount, IActiveAsset, IBill } from "../../../types/Types";
import { extractFormikError, getKeys } from "../../../utils/utils";

export interface IBillsListItemProps {
  setIsPasswordFormVisible: (e: "handleDC" | null | undefined) => void;
  setPassword: (e: string) => void;
  handleDC: (e: string) => void;
  account: IAccount;
  activeBill: IActiveAsset;
  isPasswordFormVisible: "handleDC" | null | undefined;
  sortedListByValue: IBill[];
  tokenLabel: string;
}

function BillsListPopups({
  setIsPasswordFormVisible,
  setPassword,
  handleDC,
  account,
  activeBill,
  isPasswordFormVisible,
  tokenLabel,
}: IBillsListItemProps): JSX.Element | null {
  const { vault } = useAuth();

  return (
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
              vault,
            );

            if (error || !hashingPublicKey || !hashingPrivateKey) {
              return setErrors({ password: "Password is incorrect!" });
            }

            setPassword(values.password);
            handleDC(values.password);
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
                        error={extractFormikError(errors, touched, ["password"])}
                      />
                    </FormContent>
                    <FormFooter>
                      <Button big={true} block={true} type="submit" variant="primary">
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
  );
}

export default BillsListPopups;
