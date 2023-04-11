import * as Yup from "yup";
import { Formik } from "formik";

import { Form, FormFooter, FormContent } from "../../Form/Form";
import Textfield from "../../Textfield/Textfield";
import Button from "../../Button/Button";
import Spacer from "../../Spacer/Spacer";
import Popup from "../../Popup/Popup";
import { extractFormikError } from "../../../utils/utils";
import { IAccount } from "../../../types/Types";

export interface IPopupsProps {
  setAccounts: (e: IAccount[]) => void;
  account: IAccount;
  accounts?: IAccount[];
  setIsRenamePopupVisible: (e: boolean) => void;
  isRenamePopupVisible: boolean;
}

function Popups({
  isRenamePopupVisible,
  setIsRenamePopupVisible,
  account,
  accounts,
  setAccounts,
}: IPopupsProps): JSX.Element | null {
  return (
    <>
      {isRenamePopupVisible && (
        <Popup
          isPopupVisible={isRenamePopupVisible}
          setIsPopupVisible={setIsRenamePopupVisible}
          title="Rename public key"
        >
          <Formik
            initialValues={{
              accountName: account?.name,
            }}
            onSubmit={async (values, { resetForm }) => {
              const accountNames = localStorage.getItem(
                "ab_wallet_account_names"
              );
              const accountNamesObj = accountNames
                ? JSON.parse(accountNames)
                : {};
              const idx = Number(account?.idx);

              localStorage.setItem(
                "ab_wallet_account_names",
                JSON.stringify(
                  Object.assign(accountNamesObj, {
                    ["_" + idx]: values.accountName,
                  })
                )
              );

              const updatedAccounts = accounts?.map((obj) => {
                if (obj?.pubKey === account?.pubKey) {
                  return { ...obj, name: values.accountName };
                } else return { ...obj };
              });
              setAccounts(updatedAccounts as IAccount[]);
              setIsRenamePopupVisible(false);
              resetForm();
            }}
            validateOnBlur={false}
            validationSchema={Yup.object().shape({
              accountName: Yup.string()
                .required("Address is required")
                .test(
                  "account-name-taken",
                  `The public key name is taken`,
                  function (value) {
                    if (value) {
                      return !Boolean(accounts?.find((a) => a.name === value));
                    } else {
                      return true;
                    }
                  }
                ),
            })}
          >
            {(formikProps) => {
              const { handleSubmit, errors, touched } = formikProps;

              return (
                <form onSubmit={handleSubmit}>
                  <Spacer mb={16} />

                  <Form>
                    <FormContent>
                      <Textfield
                        focusInput={isRenamePopupVisible}
                        id="accountName"
                        name="accountName"
                        label="Public key name (max 26 characters)"
                        type="accountName"
                        error={extractFormikError(errors, touched, [
                          "accountName",
                        ])}
                        maxLength={26}
                      />
                    </FormContent>
                    <FormFooter>
                      <div className="button__group">
                        <Button
                          type="reset"
                          onClick={() => setIsRenamePopupVisible(false)}
                          big={true}
                          block={true}
                          variant="secondary"
                        >
                          Cancel
                        </Button>
                        <Button
                          big={true}
                          block={true}
                          type="submit"
                          variant="primary"
                        >
                          Confirm
                        </Button>
                      </div>
                    </FormFooter>
                  </Form>
                </form>
              );
            }}
          </Formik>
        </Popup>
      )}
    </>
  );
}

export default Popups;
