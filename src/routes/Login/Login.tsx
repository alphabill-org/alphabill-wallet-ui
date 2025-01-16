import { FormEvent, ReactElement, useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../../components/Button/Button";
import { Form, FormContent, FormFooter } from "../../components/Form/Form";
import PasswordField from "../../components/InputField/PasswordField";
import { Loading } from "../../components/Loading/Loading";
import Spacer from "../../components/Spacer/Spacer";
import { useAuthentication } from "../../hooks/authentication";
import LogoIcon from "../../images/ab-logo-ico.svg?react";

export function Login(): ReactElement {
  const authentication = useAuthentication();
  const navigate = useNavigate();
  const [loginFailed, setLoginFailed] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const login = useCallback(
    async (ev: FormEvent<HTMLFormElement>): Promise<void> => {
      const time = Date.now();
      setIsLoading(true);
      ev.preventDefault();
      const data = new FormData(ev.currentTarget);
      const password = String(data.get("password") ?? "");
      const result = await authentication.login(password);
      setLoginFailed(!result);
      setTimeout(
        () => {
          setIsLoading(false);
        },
        Math.max(1000 - (Date.now() - time), 0),
      );
    },
    [authentication.login],
  );

  useEffect(() => {
    if (authentication.isLoggedIn) {
      navigate("/", { replace: true });
    }
  }, [authentication.isLoggedIn]);

  if (isLoading) {
    return <Loading title="Logging in..." />;
  }

  return (
    <div className="login pad-24">
      <div className="login__header">
        <LogoIcon desc="Alphabill" />
      </div>
      <div className="login__title">Log in to your wallet!</div>
      <form onSubmit={login}>
        <Form>
          <FormContent>
            <PasswordField
              name="password"
              label="password"
              error={loginFailed ? "Invalid credentials" : undefined}
              focusInput
            />
          </FormContent>
          <FormFooter>
            <Button big={true} block={true} type="submit" variant="primary">
              Log in
            </Button>
          </FormFooter>
        </Form>
      </form>
      <div className="login__footer">
        <Link to="/recover-wallet">Forgot password?</Link>
        <Spacer mb={16} />
        <div>
          Don't have a wallet?
          <Link to="/create-wallet" style={{ marginLeft: "10px" }}>
            Create
          </Link>
        </div>
      </div>
    </div>
  );
}
