import { useState } from "react";
import { Formik } from "formik";
import { Form, FormFooter, FormContent } from "../../Form/Form";
import moment from "moment";
import * as Yup from "yup";

import Button from "../../Button/Button";
import Spacer from "../../Spacer/Spacer";
import Textfield from "../../Textfield/Textfield";
import { extractFormikError } from "../../../utils/utils";
import Select from "../../Select/Select";
import { IAsset, ITransferProps } from "../../../types/Types";

const ASSETS = [
  {
    id: "AB",
    name: "AlphaBill Token",
  },
  {
    id: "ETH",
    name: "Ethereum Token",
  },
];

function Swap({
  account,
  accounts,
  setAccounts,
  setIsActionsViewVisible,
}: ITransferProps): JSX.Element | null {
  const [slippage, setSlippage] = useState<string | number>(1);
  const [isCustomVisible, setIsCustomVisible] = useState<boolean>(false);
  const [currentTokenId, setCurrentTokenId] = useState<any>(account.assets[0]);

  return (
    <Formik
      initialValues={{
        swapFrom: account.assets[0],
        swapTo: ASSETS.filter(
          (asset) => asset.id !== account.assets[0].id
        )?.[0],
        amountFrom: 0,
        amountTo: 0,
        customSlippage: 1,
      }}
      onSubmit={(value) => {
        const updatedData = accounts?.map((obj) => {
          if (obj.id === account.id) {
            const assetSwapTo = obj.assets?.find(
              (asset: IAsset) =>
                asset.id === value.swapTo.id &&
                asset.network === account.activeNetwork
            );

            const filteredSwapToAsset = obj.assets?.filter(
              (asset: IAsset) => asset !== assetSwapTo
            );

            let updatedSwapToAsset;

            if (assetSwapTo) {
              updatedSwapToAsset = {
                ...assetSwapTo,
                amount: Number(
                  (
                    Number(assetSwapTo?.amount) + Number(value.amountTo)
                  ).toFixed(2)
                ),
              };
            } else {
              updatedSwapToAsset = {
                id: value.swapTo.id,
                name: value.swapTo.name,
                amount: value.amountTo,
                network: account.activeNetwork,
              };
            }

            const updatedSwapToAssets =
              filteredSwapToAsset.length >= 1
                ? filteredSwapToAsset.concat([updatedSwapToAsset])
                : [updatedSwapToAsset];

            const assetSwapFrom = updatedSwapToAssets.find(
              (asset: IAsset) =>
                asset.id === value.swapFrom.id &&
                asset.network === account.activeNetwork
            );

            const filteredSwapFromAsset = updatedSwapToAssets?.filter(
              (asset: IAsset) =>
                asset !== assetSwapFrom
            );

            const updatedSwapFromAsset = {
              ...assetSwapFrom,
              amount: Number(
                (
                  Number(assetSwapFrom?.amount) - Number(value.amountFrom)
                ).toFixed(2)
              ),
            };

            const updatedSwapFromAssets =
              filteredSwapFromAsset.length >= 1
                ? filteredSwapFromAsset.concat([updatedSwapFromAsset])
                : [updatedSwapFromAsset];

            return {
              ...obj,
              assets: updatedSwapFromAssets,
              activities: obj.activities.concat([
                {
                  id: value.swapTo.id,
                  name: value.swapTo.name,
                  amount: Number(value.amountTo),
                  time: moment().format("ll LTS"),
                  address: account.id,
                  type: "Swap",
                  network: account.activeNetwork!,
                  fromID: value.swapFrom.id,
                  fromAmount: value.amountFrom,
                },
              ]),
            };
          } else return { ...obj };
        });

        setAccounts(updatedData);
        setIsActionsViewVisible(false);
      }}
      validationSchema={Yup.object().shape({
        amountFrom: Yup.number()
          .positive("Value must be greater than 0.")
          .test(
            "test less than",
            `You don't have enough ` + currentTokenId.name + `'s`,
            (value) =>
              Number(value) <=
              Number(
                account?.assets?.find(
                  (asset: any) => asset.id === currentTokenId.id
                )?.amount
              )
          ),
        customSlippage: Yup.number()
          .positive("Slippage must more than 0%")
          .test(
            "test more or less than",
            `Slippage must be more than 0% or less then 100%`,
            (value) => Number(value) >= 0 && Number(value) < 100
          ),
      })}
    >
      {(formikProps) => {
        const { handleSubmit, errors, touched, values, setFieldValue } =
          formikProps;
        const filteredAssets = ASSETS.filter(
          (asset) => asset.id !== values.swapFrom.id
        );
        const slippageVal =
          (values.amountFrom *
            Number(
              values.customSlippage && isCustomVisible
                ? values.customSlippage
                : slippage
            )) /
          100;

        return (
          <form className="pad-24" onSubmit={handleSubmit}>
            <Form>
              <FormContent>
                <div className="select-input-group">
                  <Select
                    label="Swap from"
                    name="swapFrom"
                    options={account.assets
                      .filter(
                        (asset) => account.activeNetwork === asset.network
                      )
                      .map((asset: IAsset) => ({
                        value: asset,
                        label: asset.name,
                      }))}
                    onChange={(label, value: IAsset) => {
                      setCurrentTokenId(value);
                      setFieldValue(
                        "swapTo",
                        ASSETS.filter((asset) => asset.id !== value.id)?.[0]
                      );
                    }}
                    error={extractFormikError(errors, touched, ["swapFrom"])}
                  />
                  <Textfield
                    id="amountFrom"
                    name="amountFrom"
                    label="Add amount"
                    type="number"
                    error={extractFormikError(errors, touched, ["amountFrom"])}
                  />
                </div>
                <Spacer mb={24} />
                <div className="select-input-group">
                  <Select
                    label="Swap to"
                    name="swapTo"
                    options={filteredAssets.map((asset: IAsset) => ({
                      value: asset,
                      label: asset.name,
                    }))}
                    error={extractFormikError(errors, touched, ["swapTo"])}
                  />
                  <Textfield
                    id="amountTo"
                    name="amountTo"
                    label="Add amount"
                    type="number"
                    value={
                      values?.swapTo.id !== values?.swapFrom.id
                        ? values.amountFrom > 0
                          ? (values.amountFrom - slippageVal).toString()
                          : ""
                        : ""
                    }
                    disabled
                    error={extractFormikError(errors, touched, ["amountTo"])}
                  />
                </div>
                <Spacer mb={24} />
                <span className="t-medium-small">Slippage</span>
                <Spacer mb={8} />
                <div className="button__group">
                  <Button
                    onClick={() => {
                      setIsCustomVisible(false);
                      setFieldValue("customSlippage", 1);
                      setSlippage(1);
                    }}
                    isBordered
                    isActive={slippage === 1}
                    variant={"secondary"}
                    type="reset"
                  >
                    1%
                  </Button>
                  <Button
                    onClick={() => {
                      setIsCustomVisible(false);
                      setFieldValue("customSlippage", 2);
                      setSlippage(2);
                    }}
                    isBordered
                    isActive={slippage === 2}
                    variant={"secondary"}
                    type="reset"
                  >
                    2%
                  </Button>
                  <Button
                    onClick={() => {
                      setIsCustomVisible(!isCustomVisible);
                      setSlippage(0);
                    }}
                    isActive={isCustomVisible}
                    isBordered
                    variant={"secondary"}
                    type="reset"
                  >
                    Custom
                  </Button>
                </div>
                {isCustomVisible && (
                  <>
                    <Spacer mb={8} />
                    <Textfield
                      id="customSlippage"
                      name="customSlippage"
                      label="Custom Slippage"
                      type="number"
                      min="2.1"
                      max="100"
                      error={extractFormikError(errors, touched, [
                        "customSlippage",
                      ])}
                    />
                  </>
                )}
              </FormContent>
              <FormFooter>
                <Button big={true} block={true} type="submit" variant="primary">
                  Swap
                </Button>
              </FormFooter>
            </Form>
          </form>
        );
      }}
    </Formik>
  );
}

export default Swap;
