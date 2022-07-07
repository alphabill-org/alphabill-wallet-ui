import { Formik } from "formik";
import * as Yup from "yup";

import { Form, FormFooter, FormContent } from "../Form/Form";
import Button from "../Button/Button";
import Textfield from "../Textfield/Textfield";

import Logo from "../../images/ab-logo.svg";
import Spacer from "../Spacer/Spacer";
import { IAccountProps } from "../../types/Types";
import { extractFormikError } from "../../utils/utils";

function Login(props: IAccountProps): JSX.Element | null {
  return (
    <div className="login pad-24">
      <Spacer mb={56} />
      <div className="login__header">
        <img height="32" src={Logo} alt="Alphabill" />
        <Spacer mb={32} />
        <div>Welcome back to Alphabill Wallet!</div>
      </div>
      <Spacer mb={60} />
      <Formik
        initialValues={{
          password: "12345678",
          walletID: "0xb794f5ea0ba39494ce839613fffba74279579268"
        }}
        onSubmit={(values) =>{
          const updatedData = props.accounts?.map((obj) => {
            if (obj.id === values.walletID) {
              return { ...obj, isActive: true };
            } else return { ...obj, isActive: false };
          });

          props.setAccounts(updatedData);
        }}
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
                  <Textfield
                    id="walletID"
                    name="walletID"
                    label="walletID"
                    type="walletID"
                    error={extractFormikError(errors, touched, ["walletID"])}
                  />
                  <Textfield
                    id="password"
                    name="password"
                    label="Password"
                    type="password"
                    error={extractFormikError(errors, touched, ["password"])}
                  />
                </FormContent>
                <FormFooter>
                  <Button
                    big={true}
                    block={true}
                    type="submit"
                    variant="primary"
                  >
                    Unlock
                  </Button>
                </FormFooter>
              </Form>
            </form>
          );
        }}
      </Formik>

      <div className="login__footer">
        <div className="flex">
          <div>
            Unable to log in? <a href="/#">Try another method</a>
          </div>
        </div>
        <Spacer mb={4} />
        <a href="/#">Reset your wallet or create a new wallet</a>
        <Spacer mb={32} />
      </div>
    </div>
  );
}

export default Login;
