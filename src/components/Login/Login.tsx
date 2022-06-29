import { Formik } from "formik";
import * as Yup from "yup";

import { Form, FormFooter, FormContent } from "../Form/Form";
import Button from "../Button/Button";
import Textfield from "../Textfield/Textfield";

import Logo from "../../images/ab-logo.svg";
import Spacer from "../Spacer/Spacer";
import { IUserProps } from "../../types/Types";
import { extractFormikError } from "../../utils/utils";

function Login(props: IUserProps): JSX.Element | null {
  return (
    <div className="login">
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
        }}
        onSubmit={() =>
          props.setUser({
            id: "Bob",
            isLoggedIn: true,
          })
        }
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
            Unable to log in? <a href="#">Try another method</a>
          </div>
        </div>
        <Spacer mb={4} />
        <a href="#">Reset your wallet or create a new wallet</a>
        <Spacer mb={32} />
      </div>
    </div>
  );
}

export default Login;
