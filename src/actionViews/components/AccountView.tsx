import classNames from "classnames";
import { Formik } from "formik";
import { useState } from "react";
import { Navigate } from "react-router-dom";
import * as Yup from "yup";

import Button from "../../components/Button/Button";
import { Form, FormFooter, FormContent } from "../../components/Form/Form";
import Popup from "../../components/Popup/Popup";
import Spacer from "../../components/Spacer/Spacer";
import InputField from "../../components/InputField/InputField";
import { useApp } from "../../hooks/appProvider";
import { useAuth } from "../../hooks/useAuth";
import { checkPassword, extractFormikError, getKeys } from "../../utils/utils";
import LockIco from "./../../images/lock-ico.svg?react";
import PasswordIco from "./../../images/password-ico.svg?react";

function AccountView(): JSX.Element | null {
  const [isChangePasswordPopupVisible, setIsChangePasswordPopupVisible] = useState(false);
  const { logout, userKeys, setUserKeys, vault, setVault } = useAuth();
  const { accounts, setIsActionsViewVisible } = useApp();

  if (Number(userKeys?.length) <= 0 || !vault || vault === "null" || userKeys === "null") {
    return <Navigate to="/login" />;
  }

  return (
    <>
      <div className={classNames("account__view pad-24-h")}>
        <div className="account__menu">
          <div
            onClick={() => {
              setIsChangePasswordPopupVisible(true);
            }}
            className="account__menu-item"
          >
            <div className="account__menu-item-icon">
              <PasswordIco />
            </div>
            <div className="account__menu-item-title">Change password</div>
          </div>
          <div
            onClick={() => {
              setIsActionsViewVisible(false);
              setUserKeys(null);
              logout();
            }}
            className="account__menu-item"
          >
            <div className="account__menu-item-icon">
              <LockIco />
            </div>
            <div className="account__menu-item-title">Lock</div>
          </div>
        </div>

        <Popup
          isPopupVisible={isChangePasswordPopupVisible}
          setIsPopupVisible={setIsChangePasswordPopupVisible}
          title="Change password"
        >
          <Formik
            initialValues={{
              currentPassword: "",
              passwordConfirm: "",
              password: "",
            }}
            onSubmit={(values, { setErrors, resetForm }) => {
              const { error, masterKey, decryptedVault } = getKeys(values.currentPassword, accounts.length, vault);

              if (error || !masterKey) {
                return setErrors({ currentPassword: "Password is incorrect!" });
              }

              if (values.currentPassword === values.passwordConfirm) {
                return setErrors({
                  passwordConfirm: "New passwords is the same as current password",
                });
              }

              if (values.password !== values.passwordConfirm) {
                return setErrors({ passwordConfirm: "Passwords don't match" });
              }

              setVault(CryptoJS.AES.encrypt(JSON.stringify(decryptedVault), values.password).toString());

              setIsChangePasswordPopupVisible(false);

              resetForm();
            }}
            validateOnBlur={false}
            validationSchema={Yup.object().shape({
              currentPassword: Yup.string().required("Password is required"),
              passwordConfirm: Yup.string().test(
                "empty-or-8-characters-check",
                "password must be at least 8 characters",
                (password) => checkPassword(password),
              ),
              password: Yup.string().test(
                "empty-or-8-characters-check",
                "password must be at least 8 characters",
                (password) => checkPassword(password),
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
                      <InputField
                        focusInput={isChangePasswordPopupVisible}
                        id="currentPassword"
                        name="currentPassword"
                        label="Insert current password"
                        type="password"
                        error={extractFormikError(errors, touched, ["currentPassword"])}
                      />
                      <InputField
                        id="passwordChange"
                        name="password"
                        label="Add new password"
                        type="password"
                        error={extractFormikError(errors, touched, ["password"])}
                      />
                      <InputField
                        id="passwordChangeConfirm"
                        name="passwordConfirm"
                        label="Confirm new password"
                        type="password"
                        error={extractFormikError(errors, touched, ["passwordConfirm"])}
                        maxLength={26}
                      />
                    </FormContent>
                    <FormFooter>
                      <div className="button__group">
                        <Button
                          type="reset"
                          onClick={() => setIsChangePasswordPopupVisible(false)}
                          big={true}
                          block={true}
                          variant="secondary"
                        >
                          Cancel
                        </Button>
                        <Button big={true} block={true} type="submit" variant="primary">
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
      </div>
    </>
  );
}

export default AccountView;
