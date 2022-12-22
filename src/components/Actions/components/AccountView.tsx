import classNames from "classnames";
import { useState } from "react";
import { Formik } from "formik";
import * as Yup from "yup";
import axios from "axios";
import { Navigate } from "react-router-dom";

import CryptoJS from "crypto-js";
import { useQueryClient } from "react-query";

import { Form, FormFooter, FormContent } from "../../Form/Form";
import Textfield from "../../Textfield/Textfield";
import {
  extractFormikError,
  getKeys,
  unit8ToHexPrefixed,
} from "../../../utils/utils";
import Button from "../../Button/Button";
import { ReactComponent as AddIco } from "../../../images/add-ico.svg";
import { ReactComponent as LockIco } from "../../../images/lock-ico.svg";
import { ReactComponent as CheckIco } from "../../../images/check-ico.svg";

import Profile from "../../../images/profile.svg";
import Spacer from "../../Spacer/Spacer";
import Popup from "../../Popup/Popup";
import { useAuth } from "../../../hooks/useAuth";
import { useApp } from "../../../hooks/appProvider";
import { API_URL } from "../../../hooks/requests";

function AccountView(): JSX.Element | null {
  const [isAddPopupVisible, setIsAddPopupVisible] = useState(false);
  const [isAddAccountLoading, setIsAddAccountLoading] = useState(false);
  const { logout, userKeys, setUserKeys, vault, setVault } = useAuth();
  const {
    accounts,
    setIsActionsViewVisible,
    activeAccountId,
    setActiveAccountId,
  } = useApp();
  const queryClient = useQueryClient();

  if (
    userKeys!.length <= 0 ||
    !vault ||
    vault === "null" ||
    userKeys === "null"
  ) {
    return <Navigate to="/login" />;
  }

  return (
    <div className={classNames("account__view pad-24-h")}>
      <div className="accounts">
        {accounts?.map((account) => {
          return (
            <div
              key={account?.pubKey}
              className="account"
              onClick={() => {
                setActiveAccountId(account?.pubKey);
                setIsActionsViewVisible(false);
                queryClient.invalidateQueries(["balance", account?.pubKey]);
                queryClient.invalidateQueries(["billsList", activeAccountId]);
              }}
            >
              <div className="account__item">
                <img height="32" width="32px" src={Profile} alt="Profile" />
              </div>
              <div className="account__item account__item-name">
                <div className="t-medium account__item-id">{account?.name}</div>
                <div className="t-small c-light account__item-id">
                  {account?.pubKey}
                </div>
              </div>
              {account?.pubKey === activeAccountId && (
                <CheckIco className="account__item--active" />
              )}
            </div>
          );
        })}
      </div>
      <Spacer mb={8} />
      <div className="account__menu">
        <div
          onClick={() => setIsAddPopupVisible(true)}
          className="account__menu-item"
        >
          <div className="account__menu-item-icon">
            <AddIco />
          </div>
          <div className="account__menu-item-title">Add new public key</div>
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
        isPopupVisible={isAddPopupVisible}
        setIsPopupVisible={setIsAddPopupVisible}
        title="Add new public key"
      >
        <Formik
          initialValues={{
            accountName: "",
            password: "",
          }}
          onSubmit={async (values, { resetForm, setErrors }) => {
            const { error, masterKey, hashingPublicKey, decryptedVault } =
              getKeys(values.password, accounts.length, vault);
            const accountIndex = accounts.length;
            const prefixedHashingPubKey = hashingPublicKey
              ? unit8ToHexPrefixed(hashingPublicKey)
              : "";

            if (error || !masterKey) {
              setIsAddAccountLoading(false);
              return setErrors({ password: "Password is incorrect!" });
            }

            const controlHashingKey = masterKey.derive(`m/44'/634'/0'/0/0`);
            const controlHashingPubKey = controlHashingKey.publicKey;

            const addAccount = () => {
              setVault(
                CryptoJS.AES.encrypt(
                  JSON.stringify(
                    Object.assign(decryptedVault, {
                      pub_keys: userKeys?.concat(" ", prefixedHashingPubKey),
                    })
                  ),
                  values.password
                ).toString()
              );
              setUserKeys(userKeys?.concat(" ", prefixedHashingPubKey));
              const accountNames =
                localStorage.getItem("ab_wallet_account_names") || "";
              const accountNamesObj = accountNames
                ? JSON.parse(accountNames)
                : {};
              const idx = accountIndex;
              localStorage.setItem(
                "ab_wallet_account_names",
                JSON.stringify(
                  Object.assign(accountNamesObj, {
                    ["_" + idx]: values.accountName || "Public key " + (idx + 1),
                  })
                )
              );

              setActiveAccountId(prefixedHashingPubKey);
              setIsAddPopupVisible(false);
              queryClient.invalidateQueries(["balance", prefixedHashingPubKey]);
            };

            if (
              error ||
              unit8ToHexPrefixed(controlHashingPubKey!) !==
                userKeys?.split(" ")[0]
            ) {
              return setErrors({ password: "Password is incorrect!" });
            }

            axios
              .post<void>(API_URL + "/admin/add-key", {
                pubkey: prefixedHashingPubKey,
              })
              .then(() => {
                addAccount();
                setIsAddAccountLoading(false);
              })
              .catch((e) => {
                if (e.response?.data?.message === "pubkey already exists") {
                  addAccount();
                } else {
                  setErrors({ accountName: "Account creation failed" });
                }
                setIsAddAccountLoading(false);
              });

            resetForm();
          }}
          validationSchema={Yup.object().shape({
            accountName: Yup.string().test(
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
                <Spacer mb={16} />

                <Form>
                  <FormContent>
                    <Textfield
                      id="passwordAddAccount"
                      name="password"
                      label="Add your password for decryption"
                      type="password"
                      error={extractFormikError(errors, touched, ["password"])}
                    />
                    <Textfield
                      id="accountName"
                      name="accountName"
                      label="Public key name (Optional)"
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
                        onClick={() => setIsAddPopupVisible(false)}
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
                        working={isAddAccountLoading}
                        onClick={() => setIsAddAccountLoading(true)}
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
    </div>
  );
}

export default AccountView;
