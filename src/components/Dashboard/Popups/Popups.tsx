import { useState } from "react";
import { useQueryClient } from "react-query";
import * as Yup from "yup";
import { Formik } from "formik";
import axios from "axios";
import moment from "moment";

import { Form, FormFooter, FormContent } from "../../Form/Form";
import Textfield from "../../Textfield/Textfield";
import Button from "../../Button/Button";
import Spacer from "../../Spacer/Spacer";
import Popup from "../../Popup/Popup";

import { extractFormikError } from "../../../utils/utils";
import { IAccount } from "../../../types/Types";

export interface IPopupsProps {
  setAccounts: (e: any) => void;
  account: IAccount;
  accounts?: IAccount[];
  setIsRenamePopupVisible: (e: any) => void;
  setIsBuyPopupVisible: (e: any) => void;
  isBuyPopupVisible: boolean;
  isRenamePopupVisible: boolean;
}

function Popups({
  isBuyPopupVisible,
  setIsBuyPopupVisible,
  isRenamePopupVisible,
  setIsRenamePopupVisible,
  account,
  accounts,
  setAccounts,
}: IPopupsProps): JSX.Element | null {
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  return (
    <>
      <Popup
        isPopupVisible={isBuyPopupVisible}
        setIsPopupVisible={setIsBuyPopupVisible}
        title={isRenamePopupVisible ? "" : "Experiment with Test Tokens"}
      >
        <div className="mw-100p">
          <Spacer mb={24} />
          Alphabill provides free test tokens that users can deploy to trial
          testnet features on the network.
          <Spacer mb={24} />
          <div className="t-medium-small flex t-bold">
            Account: <div className="t-ellipsis pad-8-h">{account?.pubKey}</div>
          </div>
          <Spacer mb={8} />
          <Button
            onClick={() => {
              setIsLoading(true);
              setIsBuyPopupVisible(false);
              axios({
                method: "post",
                url: "https://dev-ab-faucet-api.abdev1.guardtime.com/sendBills",
                data: {
                  pubKey: account?.pubKey,
                },
              })
                .then((data) => {
                  queryClient.invalidateQueries(["balance", account?.pubKey]);
                  const updatedData = accounts?.map((obj) => {
                    if (obj?.pubKey === account.pubKey) {
                      const currentAsset = obj.assets?.find(
                        (asset: any) =>
                          asset?.id === "AB" &&
                          asset.network === account?.activeNetwork
                      );

                      const filteredAsset = obj.assets?.filter(
                        (asset: any) =>
                          asset !== currentAsset
                      );

                      let updatedAsset;
                      if (currentAsset) {
                        updatedAsset = {
                          ...currentAsset,
                          amount: Number(currentAsset?.amount) + 100,
                        };
                      } else {
                        updatedAsset = {
                          id: "AB",
                          name: "AlphaBill Token",
                          amount: 100,
                          network: account?.activeNetwork,
                        };
                      }

                      const updatedAssets =
                        filteredAsset.length >= 1
                          ? filteredAsset.concat([updatedAsset])
                          : [updatedAsset];

                      return {
                        ...obj,
                        assets: updatedAssets,
                        activities: obj.activities.concat([
                          {
                            id: "AB",
                            name: "AlphaBill Token",
                            amount: 100,
                            time: moment().format("ll LTS"),
                            address: account.pubKey,
                            type: "Receive",
                            network: account?.activeNetwork!,
                            fromAddress: account?.pubKey,
                          },
                        ]),
                      };
                    } else if (obj?.pubKey === account?.pubKey) {
                      const currentAsset = obj.assets?.find(
                        (asset: any) => asset?.id === "AB"
                      );

                      const filteredAsset = obj.assets?.filter(
                        (asset: any) =>
                          asset !== currentAsset
                      );

                      let updatedAsset;
                      if (currentAsset) {
                        updatedAsset = {
                          ...currentAsset,
                          amount: Number(currentAsset?.amount) - 100,
                        };
                      } else {
                        updatedAsset = {
                          id: "AB",
                          name: "AlphaBill Token",
                          amount: 100,
                        };
                      }

                      const updatedAssets =
                        filteredAsset.length >= 1
                          ? filteredAsset.concat([updatedAsset])
                          : [updatedAsset];

                      return {
                        ...obj,
                        assets: updatedAssets,
                        activities: obj.activities.concat([
                          {
                            id: "AB",
                            name: "AlphaBill Token",
                            amount: 100,
                            time: moment().format("ll LTS"),
                            address: account.pubKey,
                            type: "Send",
                            network: account?.activeNetwork!,
                          },
                        ]),
                      };
                    } else return { ...obj };
                  });

                  setAccounts(updatedData);
                  setIsLoading(false);
                  return data;
                })
                .catch((error) => {
                  console.error(error.response.data.error);
                  setIsLoading(false);
                  return;
                });
            }}
            big={true}
            block={true}
            working={isLoading}
            variant="primary"
          >
            Request From Faucet
          </Button>
        </div>
      </Popup>

      {isRenamePopupVisible && (
        <Popup
          isPopupVisible={isRenamePopupVisible}
          setIsPopupVisible={setIsRenamePopupVisible}
          title="Rename Account"
        >
          <Formik
            initialValues={{
              accountName: account?.name,
            }}
            onSubmit={async (values, { resetForm }) => {
              const accountNames =
                localStorage.getItem("ab_wallet_account_names");
              const accountNamesObj = accountNames ? JSON.parse(accountNames) : {};
              const idx = Number(account?.idx);
              console.log(account);

              localStorage.setItem(
                "ab_wallet_account_names",
                JSON.stringify(
                  Object.assign(accountNamesObj, {
                    ['_' + idx]: values.accountName,
                  })
                )
              );

              const updatedAccounts = accounts?.map((obj) => {
                if (obj?.pubKey === account?.pubKey) {
                  return { ...obj, name: values.accountName };
                } else return { ...obj };
              });
              setAccounts(updatedAccounts);
              setIsRenamePopupVisible(false);
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
                          onClick={() => setIsRenamePopupVisible(false)}
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
      )}
    </>
  );
}

export default Popups;
