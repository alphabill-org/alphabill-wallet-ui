import { Formik } from "formik";
import * as Yup from "yup";

import { Form, FormHeader, FormFooter, FormContent } from "../Form/Form";
import Button from "../Button/Button";
import Textfield from "../Textfield/Textfield";

import Logo from "../../images/ab-logo.svg";
import Spacer from "../Spacer/Spacer";

function Login(props: any): JSX.Element | null {
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
        onSubmit={(values) => console.log(values)}
        validationSchema={Yup.object().shape({
          password: Yup.object().required("Password is required.").nullable(),
        })}
      >
        {(formikProps) => {
          const { handleSubmit, values } = formikProps;

          return (
            <form onSubmit={handleSubmit}>
              <Form>
                <FormContent>
                  <Textfield
                    id="password"
                    name="password"
                    label="Password"
                    type="password"
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
          <div>Unable to log in? {' '} <a href="#">Try another method</a></div>
        </div>
        <Spacer mb={4} />
        <a href="#">Reset your wallet or create a new wallet</a>
        <Spacer mb={32} />
      </div>
    </div>
  );
}

export default Login;
