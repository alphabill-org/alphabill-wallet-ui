import classNames from "classnames";
import { useState } from "react";
import { Formik } from "formik";

import { Form, FormFooter, FormContent } from "../../Form/Form";
import Textfield from "../../Textfield/Textfield";
import { extractFormikError } from "../../../utils/utils";
import Button from "../../Button/Button";
import { IAccount } from "../../../types/Types";
import { ReactComponent as AddIco } from "../../../images/add-ico.svg";
import { ReactComponent as HardwareIco } from "../../../images/hardware-ico.svg";
import { ReactComponent as ImportIco } from "../../../images/import-ico.svg";
import { ReactComponent as LockIco } from "../../../images/lock-ico.svg";
import { ReactComponent as SettingIco } from "../../../images/settings-ico.svg";
import { ReactComponent as CheckIco } from "../../../images/check-ico.svg";

import Profile from "../../../images/profile.svg";
import Spacer from "../../Spacer/Spacer";
import Popup from "../../Popup/Popup";

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

                setAccounts(updatedData);
              }}
            >
              <div className="account__item">
                <img height="32" width="32px" src={Profile} alt="Profile" />
              </div>
              <div className="account__item">
                <div className="t-medium">{account.name}</div>
                <div className="t-small c-light">{account.id}</div>
              </div>
              <div className="account__item">
                <div className="t-medium">{account.balance}</div>
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

        <div className="account__menu-item">
          <div className="account__menu-item-icon">
            <HardwareIco />
          </div>
          <div className="account__menu-item-title">Hardware Wallet</div>
        </div>

        <div className="account__menu-item">
          <div className="account__menu-item-icon">
            <SettingIco />
          </div>
          <div className="account__menu-item-title">Settings</div>
        </div>

        <div className="account__menu-item">
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
            Popup: "",
          }}
          onSubmit={(values) => console.log("Submit")}
        >
          {(formikProps) => {
            const { handleSubmit, errors, touched } = formikProps;

            return (
              <form onSubmit={handleSubmit}>
                <Spacer mb={16} />

                <Form>
                  <FormContent>
                    <Textfield
                      id="Popup"
                      name="Popup"
                      label="Account Name"
                      type="Popup"
                      error={extractFormikError(errors, touched, ["Popup"])}
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
