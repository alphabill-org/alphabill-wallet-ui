import classNames from "classnames";
import { useState } from "react";
import { Formik } from "formik";
import { utils, getPublicKey } from "@noble/ed25519";
import * as Yup from "yup";

import { Form, FormFooter, FormContent } from "../../Form/Form";
import Textfield from "../../Textfield/Textfield";
import { extractFormikError } from "../../../utils/utils";
import Button from "../../Button/Button";
import { IAccount } from "../../../types/Types";
import { ReactComponent as AddIco } from "../../../images/add-ico.svg";
import { ReactComponent as ImportIco } from "../../../images/import-ico.svg";
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
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const { logout } = useAuth();

  return (
    <div className={classNames("account__view pad-24-h")}>
      <div className="accounts">
        {accounts?.map((account) => {
          return (
            <div
              key={account.id}
              className="account"
              onClick={() => {
                const updatedData = accounts?.map((obj) => {
                  if (obj.id === account.id) {
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
                <div className="t-medium">{account.name}</div>
                <div className="t-small c-light account__item-id">
                  {account.id}
                </div>
              </div>
              <div className="account__item">
                <div className="t-medium">
                  {account.assets?.[0]?.amount || 0}
                </div>
              </div>
              {account.isActive && (
                <CheckIco className="account__item--active" />
              )}
            </div>
          );
        })}
      </div>
      <Spacer mb={8} />
      <div className="account__menu">
        <div
          onClick={() => setIsPopupVisible(true)}
          className="account__menu-item"
        >
          <div className="account__menu-item-icon">
            <AddIco />
          </div>
          <div className="account__menu-item-title">Add New Account</div>
        </div>

        <div className="account__menu-item">
          <div className="account__menu-item-icon">
            <ImportIco />
          </div>
          <div
            className="account__menu-item-title"
            onClick={() => {
              setActionsView("Import Account");
              setIsActionsViewVisible(true);
            }}
          >
            Import Account
          </div>
        </div>

        <div
          onClick={() => {
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
        isPopupVisible={isPopupVisible}
        setIsPopupVisible={setIsPopupVisible}
        title="Add New Account"
      >
        <Formik
          initialValues={{
            accountName: "",
          }}
          onSubmit={async (values, { resetForm }) => {
            const privateKey = utils.randomPrivateKey();
            const publicKey = await getPublicKey(privateKey);

            const addedAccount = accounts?.concat([
              {
                id: utils.bytesToHex(publicKey),
                name: values.accountName,
                isActive: true,
                assets: [],
                activeNetwork: "AB Testnet",
                networks: [
                  {
                    id: "AB Testnet",
                    isTestNetwork: true,
                  },
                  {
                    id: "AB Mainnet",
                    isTestNetwork: false,
                  },
                ],
                activities: [],
              },
            ]);

            const updatedAccounts = addedAccount?.map((obj) => {
              if (obj?.id !== utils.bytesToHex(publicKey)) {
                return { ...obj, isActive: false };
              } else return { ...obj };
            });
            setAccounts(updatedAccounts);
            setIsPopupVisible(false);
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
                        onClick={() => setIsPopupVisible(false)}
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
    </div>
  );
}

export default AccountView;
