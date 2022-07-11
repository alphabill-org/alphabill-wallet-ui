import Popup from "../../Popup/Popup";
import * as Yup from "yup";
import { Formik } from "formik";

import { Form, FormFooter, FormContent } from "../../Form/Form";
import Moonpay from "../../../images/moonpay.svg";
import Textfield from "../../Textfield/Textfield";
import { extractFormikError } from "../../../utils/utils";
import Button from "../../Button/Button";
import Spacer from "../../Spacer/Spacer";
import { IAccount } from "../../../types/Types";

export interface IPopupsProps {
  setAccounts: (e: any) => void;
  account: IAccount;
  accounts?: IAccount[];
  setIsRenamePopupVisible: (e: any) => void;
  setIsBuyPopupVisible: (e: any) => void;
  isBuyPopupVisible: boolean;
  isRenamePopupVisible: boolean;
}

function Popups({
  isBuyPopupVisible,
  setIsBuyPopupVisible,
  isRenamePopupVisible,
  setIsRenamePopupVisible,
  account,
  accounts,
  setAccounts,
}: IPopupsProps): JSX.Element | null {
  return (
    <>
      <Popup
        isPopupVisible={isBuyPopupVisible}
        setIsPopupVisible={setIsBuyPopupVisible}
        title=""
      >
        <div>
          <Spacer mb={8} />
          <img className="m-auto" height="32" src={Moonpay} alt="Profile" />
          <Spacer mb={16} />
          MoonPay supports popular payment methods, including Visa, Mastercard,
          Apple / Google / Samsung Pay, and bank transfers in 145+ countries.
          Tokens deposit into your MetaMask account.
          <Spacer mb={16} />
          <Button
            onClick={() => setIsBuyPopupVisible(false)}
            big={true}
            block={true}
            variant="primary"
          >
            Cancel
          </Button>
        </div>
      </Popup>

      {isRenamePopupVisible && (
        <Popup
          isPopupVisible={isRenamePopupVisible}
          setIsPopupVisible={setIsRenamePopupVisible}
          title="Rename Account"
        >
          <Formik
            initialValues={{
              accountName: account.name,
            }}
            onSubmit={async (values, { resetForm }) => {
              const updatedAccounts = accounts?.map((obj) => {
                if (obj?.id === account.id) {
                  return { ...obj, name: values.accountName };
                } else return { ...obj };
              });
              setAccounts(updatedAccounts);
              setIsRenamePopupVisible(false);
              resetForm();
            }}
            validationSchema={Yup.object().shape({
              accountName: Yup.string()
                .required("Address is required")
                .test(
                  "account-name-taken",
                  `The account name is taken`,
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
                        id="accountName"
                        name="accountName"
                        label="Account Name"
                        type="accountName"
                        error={extractFormikError(errors, touched, [
                          "accountName",
                        ])}
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
