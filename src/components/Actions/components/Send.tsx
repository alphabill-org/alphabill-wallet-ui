import { useState } from "react";
import moment from "moment";
import { Formik } from "formik";
import * as Yup from "yup";
import { Form, FormFooter, FormContent } from "../../Form/Form";

import Button from "../../Button/Button";
import Spacer from "../../Spacer/Spacer";
import Textfield from "../../Textfield/Textfield";
import { extractFormikError } from "../../../utils/utils";
import Select from "../../Select/Select";
import { IAsset } from "../../../types/Types";
import { useApp } from "../../../hooks/appProvider";

function Send(): JSX.Element | null {
  const [currentTokenId, setCurrentTokenId] = useState<any>("");
  const {
    setIsActionsViewVisible,
    account,
    accounts,
    setAccounts,
  } = useApp();

  return (
    <Formik
      initialValues={{
        assets: "",
        amount: 0,
        address: "",
      }}
      onSubmit={(values) => {
        const updatedData = accounts?.map((obj) => {
          if (obj?.pubKey === values.address) {
            const currentAsset = obj.assets?.find(
              (asset: any) =>
                asset?.id === currentTokenId.id &&
                asset.network === account?.activeNetwork
            );

            const filteredAsset = obj.assets?.filter(
              (asset: any) => asset !== currentAsset
            );

            let updatedAsset;
            if (currentAsset) {
              updatedAsset = {
                ...currentAsset,
                amount: Number(currentAsset?.amount) + Number(values.amount),
              };
            } else {
              updatedAsset = {
                id: currentTokenId.id,
                name: currentTokenId.name,
                amount: values.amount,
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
                  id: currentTokenId.id,
                  name: currentTokenId.name,
                  amount: Number(values.amount),
                  time: moment().format("ll LTS"),
                  address: values.address,
                  type: "Receive",
                  network: account?.activeNetwork!,
                  fromAddress: account?.pubKey,
                },
              ]),
            };
          } else if (obj?.pubKey === account?.pubKey) {
            const currentAsset = obj.assets?.find(
              (asset: any) => asset?.id === currentTokenId.id
            );

            const filteredAsset = obj.assets?.filter(
              (asset: any) => asset !== currentAsset
            );

            let updatedAsset;
            if (currentAsset) {
              updatedAsset = {
                ...currentAsset,
                amount: Number(currentAsset?.amount) - Number(values.amount),
              };
            } else {
              updatedAsset = {
                id: currentTokenId.id,
                name: currentTokenId.name,
                amount: values.amount,
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
                  id: currentTokenId.id,
                  name: currentTokenId.name,
                  amount: Number(values.amount),
                  time: moment().format("ll LTS"),
                  address: values.address,
                  type: "Send",
                  network: account?.activeNetwork!,
                },
              ]),
            };
          } else return { ...obj };
        });

        setAccounts(updatedData);
        setIsActionsViewVisible(false);
      }}
      validationSchema={Yup.object().shape({
        assets: Yup.object().required("Selected asset is required"),
        address: Yup.string()
          .required("Address is required")
          .test(
            "account-id-same",
            `Receiver's account is your account`,
            function (value) {
              if (value) {
                return account?.pubKey !== value;
              } else {
                return true;
              }
            }
          ),
        amount: Yup.number()
          .positive("Value must be greater than 0.")
          .test(
            "test less than",
            `You don't have enough ` + currentTokenId.name + `'s`,
            (value) =>
              Number(value) <=
              Number(
                account?.assets?.find(
                  (asset: any) =>
                    asset?.id === currentTokenId.id &&
                    asset.network === account?.activeNetwork
                )?.amount
              )
          ),
      })}
    >
      {(formikProps) => {
        const { handleSubmit, errors, touched, values } = formikProps;

        return (
          <form className="pad-24" onSubmit={handleSubmit}>
            <Form>
              <FormContent>
                <Select
                  label="Assets"
                  name="assets"
                  options={account?.assets
                    .filter((asset) => account?.activeNetwork === asset.network)
                    .sort((a: IAsset, b: IAsset) => {
                      if (a?.id! < b?.id!) {
                        return -1;
                      }
                      if (a?.id! > b?.id!) {
                        return 1;
                      }
                      return 0;
                    })
                    .map((asset: IAsset) => ({
                      value: asset,
                      label: asset.name,
                    }))}
                  onChange={(label, value) => setCurrentTokenId(value)}
                  error={extractFormikError(errors, touched, ["assets"])}
                />
                <Spacer mb={16} />
                <Textfield
                  id="address"
                  name="address"
                  label="Address"
                  type="address"
                  error={extractFormikError(errors, touched, ["address"])}
                />
                <Spacer mb={16} />
                <Textfield
                  id="amount"
                  name="amount"
                  label="Amount"
                  type="number"
                  error={extractFormikError(errors, touched, ["amount"])}
                  disabled={!Boolean(values.assets)}
                />
              </FormContent>
              <FormFooter>
                <Button big={true} block={true} type="submit" variant="primary">
                  Send
                </Button>
              </FormFooter>
            </Form>
          </form>
        );
      }}
    </Formik>
  );
}

export default Send;
