import { Formik } from "formik";
import * as Yup from "yup";
import CryptoJS from "crypto-js";

import { Form, FormFooter, FormContent } from "../Form/Form";
import Button from "../Button/Button";
import Textfield from "../Textfield/Textfield";

import Logo from "../../images/ab-logo.svg";
import Spacer from "../Spacer/Spacer";
import { extractFormikError } from "../../utils/utils";

export interface ILoginProps {
  setIsCreateAccountView: (e: any) => void;
  setIsLoggedIn: (e: any) => void;
}

function Login(props: ILoginProps): JSX.Element | null {
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
          password: "",
        }}
        onSubmit={(values) => {
          const keys = localStorage.getItem("pubKeys");
          const encrypted = localStorage.getItem("encryptedKeys") || "";
          const decrypted = CryptoJS.AES.decrypt(
            encrypted,
            values.password
          );

          if (
            keys === decrypted.toString(CryptoJS.enc.Utf8)
          ) {
            props.setIsLoggedIn(true);
          }
        }}
        validationSchema={Yup.object().shape({
          password: Yup.string().test(
            "empty-or-8-characters-check",
            "password must be at least 8 characters",
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
                    id="password"
                    name="password"
                    label="password"
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
                  <Spacer mb={16} />
                  <Button
                    big={true}
                    block={true}
                    type="button"
                    variant="secondary"
                  >
                    Import a wallet
                  </Button>
                </FormFooter>
              </Form>
            </form>
          );
        }}
      </Formik>

      <div className="login__footer">
        <div className="flex">
          <Button
            big={true}
            block={true}
            type="button"
            variant="primary"
            onClick={() => {
              props.setIsCreateAccountView?.(true);
            }}
          >
            Create a wallet
          </Button>
        </div>
      </div>
    </div>
  );
}

export default Login;
