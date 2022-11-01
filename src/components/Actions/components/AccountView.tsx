import classNames from "classnames";
import { useState } from "react";
import { Formik } from "formik";
import * as Yup from "yup";
import axios from "axios";

import { HDKey } from "@scure/bip32";
import {
  mnemonicToSeedSync,
  mnemonicToEntropy,
  entropyToMnemonic,
} from "bip39";
import CryptoJS from "crypto-js";

import { Form, FormFooter, FormContent } from "../../Form/Form";
import Textfield from "../../Textfield/Textfield";
import { extractFormikError, pubKeyToHex } from "../../../utils/utils";
import Button from "../../Button/Button";
import { IAccount } from "../../../types/Types";
import { ReactComponent as AddIco } from "../../../images/add-ico.svg";
import { ReactComponent as LockIco } from "../../../images/lock-ico.svg";
import { ReactComponent as CheckIco } from "../../../images/check-ico.svg";

import Profile from "../../../images/profile.svg";
import Spacer from "../../Spacer/Spacer";
import Popup from "../../Popup/Popup";
import { useAuth } from "../../../hooks/useAuth";

export interface IAccountViewProps {
  setAccounts: (e: any) => void;
  setActionsView: (e: any) => void;
  setIsActionsViewVisible: (e: any) => void;
  accounts: IAccount[];
}

function AccountView({
  accounts,
  setAccounts,
  setActionsView,
  setIsActionsViewVisible,
}: IAccountViewProps): JSX.Element | null {
  const [isAddPopupVisible, setIsAddPopupVisible] = useState(false);
  const [isLockPopupVisible, setIsLockPopupVisible] = useState(false);
  const { logout, userKeys, setUserKeys } = useAuth();

  return (
    <div className={classNames("account__view pad-24-h")}>
      <div className="accounts">
        {accounts?.map((account) => {
          return (
            <div
              key={account?.id}
              className="account"
              onClick={() => {
                const updatedData = accounts?.map((obj) => {
                  if (obj.id === account?.id) {
                    return { ...obj, isActive: true };
                  } else return { ...obj, isActive: false };
                });
                setIsActionsViewVisible(false);
                setAccounts(updatedData);
              }}
            >
              <div className="account__item">
                <img height="32" width="32px" src={Profile} alt="Profile" />
              </div>
              <div className="account__item account__item-name">
                <div className="t-medium">{account?.name}</div>
                <div className="t-small c-light account__item-id">
                  {account?.id}
                </div>
              </div>
              <div className="account__item">
                <div className="t-medium">
                  {account?.assets?.[0]?.amount || 0}
                </div>
              </div>
              {account?.isActive && (
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
          <div className="account__menu-item-title">Add New Account</div>
        </div>

        <div
          onClick={() => {
            setIsLockPopupVisible(true);
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
        title="Add New Account"
      >
        <Formik
          initialValues={{
            accountName: "",
            password: "",
          }}
          onSubmit={async (values, { resetForm, setErrors }) => {
            const encryptedEntropy = localStorage.getItem("ab_wallet_entropy");

            const decryptedEntropy = CryptoJS.AES.decrypt(
              encryptedEntropy!,
              values.password
            ).toString(CryptoJS.enc.Latin1);

            if (
              decryptedEntropy.length > 16 &&
              decryptedEntropy.length < 32 &&
              decryptedEntropy.length % 4 === 0
            ) {
              return setErrors({ password: "Password is incorrect!" });
            }

            const mnemonic = entropyToMnemonic(decryptedEntropy);
            const seed = mnemonicToSeedSync(mnemonic);
            const masterKey = HDKey.fromMasterSeed(seed);
            const accountIndex = accounts.length;
            const hashingKey = masterKey.derive(
              `m/44'/634'/${accountIndex}'/0/0`
            );
            const hashingPubKey = hashingKey.publicKey;

            const controlHashingKey = masterKey.derive(`m/44'/634'/0'/0/0`);
            const controlHashingPubKey = controlHashingKey.publicKey;

            if (
              pubKeyToHex(controlHashingPubKey!) !== userKeys?.split(" ")[0]
            ) {
              return setErrors({ password: "Password is incorrect!" });
            }

            /*axios
              .post<void>(
                "https://dev-ab-wallet-backend.abdev1.guardtime.com/admin/add-key",
                {
                  pubkey: hashingPubKey
                }
              )
              .then((r) => {
                // Just to double check
                if (
                  pubKeyToHex(controlHashingPubKey!) === userKeys?.split(" ")[0]
                ) {
                  setUserKeys(userKeys?.concat(" ", pubKeyToHex(hashingPubKey!)));
                }
              });
              */

            if (
              pubKeyToHex(controlHashingPubKey!) === userKeys?.split(" ")[0]
            ) {
              setUserKeys(userKeys?.concat(" ", pubKeyToHex(hashingPubKey!)));
              const names = localStorage
              .getItem("ab_wallet_account_names") || '';
              const accountNames = localStorage.setItem(
                "ab_wallet_account_names",
                names.concat(",", values.accountName)
              );
            }

            const addedAccount = accounts?.concat([
              {
                id: pubKeyToHex(hashingPubKey!),
                name: values.accountName,
                isActive: true,
                assets: [],
                activeNetwork: "AB Testnet",
                networks: [
                  {
                    id: "AB Testnet",
                    isTestNetwork: true,
                  },
                ],
                activities: [],
              },
            ]);

            const updatedAccounts = addedAccount?.map((obj) => {
              if (obj?.id !== pubKeyToHex(hashingPubKey!)) {
                return { ...obj, isActive: false };
              } else return { ...obj };
            });
            setAccounts(updatedAccounts);
            setIsAddPopupVisible(false);
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
                      label="password"
                      type="password"
                      error={extractFormikError(errors, touched, ["password"])}
                    />
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

      <Popup
        isPopupVisible={isLockPopupVisible}
        setIsPopupVisible={setIsLockPopupVisible}
        title="Lock Wallet"
      >
        <Spacer mb={16} />
        <div className="t-medium-small t-bold">
          Password is used to encrypt keys in localStorage.
        </div>

        <Formik
          initialValues={{
            accountName: "",
            password: "",
          }}
          onSubmit={async (values, { resetForm, setErrors }) => {
            const encryptedEntropy = localStorage.getItem("ab_wallet_entropy");

            const decryptedEntropy = CryptoJS.AES.decrypt(
              encryptedEntropy!,
              values.password
            ).toString(CryptoJS.enc.Latin1);

            if (
              decryptedEntropy.length > 16 &&
              decryptedEntropy.length < 32 &&
              decryptedEntropy.length % 4 === 0
            ) {
              return setErrors({ password: "Password is incorrect!" });
            }

            const mnemonic = entropyToMnemonic(decryptedEntropy);
            const seed = mnemonicToSeedSync(mnemonic);
            const masterKey = HDKey.fromMasterSeed(seed);
            const controlHashingKey = masterKey.derive(`m/44'/634'/0'/0/0`);
            const controlHashingPubKey = controlHashingKey.publicKey;
            const encryptedKeys = userKeys
              ? CryptoJS.AES.encrypt(userKeys, values.password).toString()
              : "";
            console.log(userKeys?.split(" ")[0]);

            if (
              pubKeyToHex(controlHashingPubKey!) !== userKeys?.split(" ")[0]
            ) {
              return setErrors({ password: "Password is incorrect!" });
            }

            if (
              pubKeyToHex(controlHashingPubKey!) === userKeys?.split(" ")[0]
            ) {
              setUserKeys(encryptedKeys);
              logout();
            }

            setIsLockPopupVisible(false);
            resetForm();
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
                <Spacer mb={16} />

                <Form>
                  <FormContent>
                    <Textfield
                      id="passwordLockAccount"
                      name="password"
                      label="password"
                      type="password"
                      error={extractFormikError(errors, touched, ["password"])}
                    />
                  </FormContent>
                  <FormFooter>
                    <div className="button__group">
                      <Button
                        type="reset"
                        onClick={() => setIsLockPopupVisible(false)}
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
                        Lock
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
