import classNames from "classnames";
import { useState } from "react";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { useQueryClient } from "react-query";
import * as Yup from "yup";
import { Formik } from "formik";
import CryptoJS from "crypto-js";

import { Form, FormFooter, FormContent } from "./../Form/Form";
import { ReactComponent as AddIco } from "./../../images/add-ico.svg";
import { IAccount, IFungibleAsset } from "../../types/Types";
import { ReactComponent as CopyIco } from "../../images/copy-ico.svg";
import { ReactComponent as Sync } from "../../images/sync-ico.svg";
import { ReactComponent as Send } from "../../images/send-ico.svg";
import { ReactComponent as Edit } from "./../../images/edit.svg";
import { ReactComponent as CheckIco } from "./../../images/check-ico.svg";
import { ReactComponent as Close } from "../../images/close.svg";
import { ReactComponent as Arrow } from "../../images/arrow.svg";
import Profile from "./../../images/profile.svg";

import Button from "../Button/Button";
import Spacer from "../Spacer/Spacer";
import { useApp } from "../../hooks/appProvider";
import Spinner from "../Spinner/Spinner";
import { useAuth } from "../../hooks/useAuth";

import {
  extractFormikError,
  getKeys,
  invalidateAllLists,
  unit8ToHexPrefixed,
} from "../../utils/utils";
import { AlphaType, TransferView } from "../../utils/constants";
import FungibleAssetsCol from "./components/FungibleAssetsCol";
import NFTAssetsCol from "./components/NFTAssetsCol";
import Navbar from "../Navbar/Navbar";
import SelectPopover from "../SelectPopover/SelectPopover";
import Textfield from "../Textfield/Textfield";
import Popup from "../Popup/Popup";

function Dashboard(): JSX.Element | null {
  const {
    activeAccountId,
    activeAsset,
    setActiveAssetLocal,
    setActiveAccountId,
    setUserKeys,
    userKeys,
    setVault,
    vault,
  } = useAuth();
  const {
    setIsActionsViewVisible,
    setActionsView,
    account,
    accounts,
    setAccounts,
  } = useApp();
  const balance: string =
    account?.assets?.fungible?.find(
      (asset: IFungibleAsset) => asset.typeId === AlphaType
    )?.UIAmount || "";

  const balanceSizeClass =
    Number(balance?.length) > 7
      ? balance?.length > 12
        ? "x-small"
        : "small"
      : "";

  const [isFungibleActive, setIsFungibleActive] = useState<boolean>(true);
  const [renamePopupAccountIndex, setRenamePopupAccountIndex] = useState<
    number | null
  >(null);
  const [isAddAccountLoading, setIsAddAccountLoading] = useState(false);
  const [isKeySelectOpen, setIsKeySelectOpen] = useState(false);
  const [isAddPopupVisible, setIsAddPopupVisible] = useState(false);
  useState(false);
  const queryClient = useQueryClient();

  if (!accounts) {
    return (
      <div className="m-auto">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="dashboard">
      <Spacer mb={48} />
      <div className="dashboard__balance">
        <div
          className={classNames("dashboard__balance-amount", balanceSizeClass)}
        >
          {balance || "0"}
        </div>
        <div
          className={classNames(
            "dashboard__balance-id t-ellipsis",
            balanceSizeClass
          )}
        >
          {AlphaType}
        </div>
      </div>
      <Spacer mb={32} />

      <div className="dashboard__account">
        <div
          className="dashboard__account-id"
          onClick={() => setIsKeySelectOpen(!isKeySelectOpen)}
        >
          <span className="dashboard__account-name">{account?.name}</span>
          <span className="dashboard__account-id-item">
            {account?.name && "-"} {account?.pubKey}
          </span>
          <Arrow />
        </div>
        <div className="dashboard__account-buttons">
          <CopyToClipboard text={account?.pubKey || ""}>
            <Button
              id="copy-tooltip"
              tooltipContent="Key copied"
              variant="icon"
              className="copy-btn"
            >
              <CopyIco className="textfield__btn" height="12px" />
            </Button>
          </CopyToClipboard>
        </div>
      </div>
      <Spacer mb={8} />
      <div className="dashboard__buttons">
        <Button
          onClick={() =>
            invalidateAllLists(activeAccountId, activeAsset.typeId, queryClient)
          }
          variant="primary"
        >
          <Sync height="16" width="16" />
          <div className="pad-8-l">Refresh</div>
        </Button>
        <Button
          variant="primary"
          onClick={() => {
            setActionsView(TransferView);
            setActiveAssetLocal(
              JSON.stringify(
                account.assets.fungible.find(
                  (asset) => asset.typeId === AlphaType
                )
              )
            );
            setIsActionsViewVisible(true);
            invalidateAllLists(
              activeAccountId,
              activeAsset.typeId,
              queryClient
            );
          }}
        >
          <Send height="16" width="16" />
          <div className="pad-8-l">Transfer</div>
        </Button>
      </div>
      <Spacer mb={32} />
      <div className="dashboard__footer">
        <Navbar
          isFungibleActive={isFungibleActive}
          onChange={(v: boolean) => setIsFungibleActive(v)}
        />
        <div className="dashboard__info">
          {isFungibleActive === true ? <FungibleAssetsCol /> : <NFTAssetsCol />}
        </div>
      </div>
      <SelectPopover
        onClose={() => {
          setIsKeySelectOpen(!isKeySelectOpen);
          setRenamePopupAccountIndex(null);
        }}
        isPopoverVisible={isKeySelectOpen}
        title="CHANGE KEY"
      >
        <>
          <div className="select__options accounts">
            {accounts?.map((account) => {
              return (
                <div
                  className={classNames("select__option-wrap", {
                    selected: account?.pubKey === activeAccountId,
                  })}
                >
                  <div
                    key={account?.pubKey}
                    className="account select__option"
                    onClick={() => {
                      setActiveAccountId(account?.pubKey);
                      setActiveAssetLocal(
                        JSON.stringify(
                          account.assets.fungible.find(
                            (asset) => asset.typeId === AlphaType
                          )
                        )
                      );
                      setIsActionsViewVisible(false);
                      invalidateAllLists(
                        account?.pubKey,
                        activeAsset.typeId,
                        queryClient
                      );
                    }}
                  >
                    <div className="account__item">
                      <img
                        height="32"
                        width="32px"
                        src={Profile}
                        alt="Profile"
                      />
                    </div>
                    <div className="account__item account__item-name">
                      {renamePopupAccountIndex === Number(account?.idx) ? (
                        <Formik
                          initialValues={{
                            accountName: account?.name,
                          }}
                          onSubmit={async (values, { resetForm }) => {
                            const accountNames = localStorage.getItem(
                              "ab_wallet_account_names"
                            );
                            const accountNamesObj = accountNames
                              ? JSON.parse(accountNames)
                              : {};
                            const idx = Number(account?.idx);

                            localStorage.setItem(
                              "ab_wallet_account_names",
                              JSON.stringify(
                                Object.assign(accountNamesObj, {
                                  ["_" + idx]: values.accountName,
                                })
                              )
                            );

                            const updatedAccounts = accounts?.map((obj) => {
                              if (obj?.pubKey === account?.pubKey) {
                                return { ...obj, name: values.accountName };
                              } else return { ...obj };
                            });
                            setAccounts(updatedAccounts as IAccount[]);
                            setRenamePopupAccountIndex(null);
                            resetForm();
                          }}
                          validateOnBlur={false}
                          validationSchema={Yup.object().shape({
                            accountName: Yup.string()
                              .required("Address is required")
                              .test(
                                "account-name-taken",
                                `The public key name is taken`,
                                function (value) {
                                  if (value) {
                                    return !Boolean(
                                      accounts?.find((a) => a.name === value)
                                    );
                                  } else {
                                    return true;
                                  }
                                }
                              ),
                          })}
                        >
                          {(formikProps) => {
                            const { handleSubmit, errors, touched } =
                              formikProps;

                            return (
                              <form onSubmit={handleSubmit}>
                                <Form>
                                  <FormContent>
                                    <Textfield
                                      focusInput={true}
                                      id="accountName"
                                      name="accountName"
                                      label=""
                                      type="accountName"
                                      error={extractFormikError(
                                        errors,
                                        touched,
                                        ["accountName"]
                                      )}
                                      maxLength={26}
                                    />
                                  </FormContent>
                                  <FormFooter>
                                    <div className="button__group">
                                      <Button
                                        type="reset"
                                        onClick={() =>
                                          setRenamePopupAccountIndex(null)
                                        }
                                        big={true}
                                        block={true}
                                        variant="icon"
                                      >
                                        <Close className="cancel" width="16" height="16" />
                                      </Button>
                                      <Button
                                        className="submit"
                                        big={true}
                                        block={true}
                                        type="submit"
                                        variant="icon"
                                      >
                                        <CheckIco width="16" height="16" />
                                      </Button>
                                    </div>
                                  </FormFooter>
                                </Form>
                              </form>
                            );
                          }}
                        </Formik>
                      ) : (
                        <>
                          <div className="t-medium account__item-id">
                            {account?.name}
                          </div>
                          <div className="t-small t-ellipsis account__item-id">
                            {account?.pubKey}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  <Edit
                    className="edit-ico"
                    onClick={() => {
                      setRenamePopupAccountIndex(
                        renamePopupAccountIndex === Number(account.idx)
                          ? null
                          : Number(account.idx)
                      );
                    }}
                  />
                </div>
              );
            })}
            <div
              className="add-key"
              onClick={() => {
                setIsAddPopupVisible(true);
                setIsKeySelectOpen(false);
              }}
            >
              <span>Add key</span>
              <AddIco width="18" height="18" />
            </div>
          </div>
        </>
      </SelectPopover>
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
              return setErrors({ password: "Password is incorrect!" });
            }

            setIsAddAccountLoading(true);
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
                    ["_" + idx]:
                      values.accountName || "Public key " + (idx + 1),
                  })
                )
              );

              setActiveAccountId(prefixedHashingPubKey);
              setIsAddPopupVisible(false);
              invalidateAllLists(
                activeAccountId,
                activeAsset.typeId,
                queryClient
              );
            };

            if (
              error ||
              unit8ToHexPrefixed(controlHashingPubKey!) !==
                userKeys?.split(" ")[0]
            ) {
              return setErrors({ password: "Password is incorrect!" });
            }

            addAccount();
            setIsAddAccountLoading(false);

            resetForm();
          }}
          validateOnBlur={false}
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
            password: Yup.string().required("Password is required"),
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
                      focusInput={isAddPopupVisible}
                      id="passwordAddAccount"
                      name="password"
                      label="Add your password for decryption"
                      type="password"
                      error={extractFormikError(errors, touched, ["password"])}
                    />
                    <Textfield
                      id="accountName"
                      name="accountName"
                      label="Key name (Optional - max 26 characters)"
                      type="accountName"
                      error={extractFormikError(errors, touched, [
                        "accountName",
                      ])}
                      maxLength={26}
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

export default Dashboard;
