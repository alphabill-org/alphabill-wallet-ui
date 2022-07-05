import classNames from "classnames";
import { Formik } from "formik";

import { Form, FormFooter, FormContent } from "../Form/Form";

import Button from "../Button/Button";
import Spacer from "../Spacer/Spacer";
import { ReactComponent as Close } from "../../images/close.svg";
import Textfield from "../Textfield/Textfield";
import { extractFormikError } from "../../utils/utils";

export interface IAddAccountProps {
  setAccounts: (e: any) => void;
  setIsAddAccountVisible: (e: any) => void;
  isAddAccountVisible: boolean;
}

function AddAccount({
  setAccounts,
  isAddAccountVisible,
  setIsAddAccountVisible,
}: IAddAccountProps): JSX.Element | null {
  return (
    <div
      className={classNames("add-account__wrap", {
        "is-visible": isAddAccountVisible,
      })}
    >
      <div className="add-account">
        <div className="add-account__header">
          <p>Add New Account</p>
          <Close onClick={() => setIsAddAccountVisible(!isAddAccountVisible)} />
        </div>
        <Spacer mb={16} />
        <Formik
          initialValues={{
            AddAccount: "",
          }}
          onSubmit={(values) => console.log("Submit")}
        >
          {(formikProps) => {
            const { handleSubmit, errors, touched } = formikProps;

            return (
              <form onSubmit={handleSubmit}>
                <Form>
                  <FormContent>
                    <Textfield
                      id="AddAccount"
                      name="AddAccount"
                      label="Account Name"
                      type="AddAccount"
                      error={extractFormikError(errors, touched, [
                        "AddAccount",
                      ])}
                    />
                  </FormContent>
                  <FormFooter>
                    <div className="button__group">
                      <Button
                        type="reset"
                        onClick={() =>
                          setIsAddAccountVisible(!isAddAccountVisible)
                        }
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
      </div>
    </div>
  );
}

export default AddAccount;
