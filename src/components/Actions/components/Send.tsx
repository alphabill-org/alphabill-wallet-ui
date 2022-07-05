import { Formik } from "formik";
import * as Yup from "yup";
import { Form, FormFooter, FormContent } from "../../Form/Form";

import Button from "../../Button/Button";
import Spacer from "../../Spacer/Spacer";
import Textfield from "../../Textfield/Textfield";
import { extractFormikError } from "../../../utils/utils";
import Select from "../../Select/Select";
import { IAsset } from "../../../types/Types";

function Send({ account, setAccounts }: any): JSX.Element | null {
  return (
    <Formik
      initialValues={{
        password: "12345678",
        walletID: "0x68ab2...4ff2408",
      }}
      onSubmit={(values) => console.log("Submit")}
      validationSchema={Yup.object().shape({
        password: Yup.string().test(
          "empty-or-8-characters-check",
          "Password must be at least 8 characters",
          (password) => !password || password.length >= 8
        ),
      })}
    >
      {(formikProps) => {
        const { handleSubmit, errors, touched } = formikProps;

        return (
          <form onSubmit={handleSubmit}>
            <Form>
              <FormContent>
                <Select
                  label="Assets"
                  name="Assets"
                  options={account.assets.map((asset: IAsset) => ({
                    value: asset,
                    label: asset.name,
                  }))}
                  error={extractFormikError(errors, touched, ["Assets"])}
                />
                <Spacer mb={16} />
                <Textfield
                  id="Address"
                  name="Address"
                  label="Address"
                  type="Address"
                  error={extractFormikError(errors, touched, ["Address"])}
                />
                <Spacer mb={16} />
                <Textfield
                  id="Amount"
                  name="Amount"
                  label="Amount"
                  type="Amount"
                  error={extractFormikError(errors, touched, ["Amount"])}
                />
              </FormContent>
              <FormFooter>
                <Button big={true} block={true} type="submit" variant="primary">
                  Send
                </Button>
              </FormFooter>
            </Form>
          </form>
        );
      }}
    </Formik>
  );
}

export default Send;
