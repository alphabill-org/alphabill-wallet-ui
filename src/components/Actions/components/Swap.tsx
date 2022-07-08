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
      }}
      onSubmit={(value) => {
        const updatedData = accounts?.map((obj) => {
          if (obj.id === account.id) {
            const assetSwapTo = obj.assets?.find(
              (asset: IAsset) => asset.id === value.swapTo.id
            );

            const filteredSwapToAsset = obj.assets?.filter(
              (asset: IAsset) => asset.id !== value.swapTo.id
            );

            let updatedSwapToAsset;

            if (assetSwapTo) {
              updatedSwapToAsset = {
                ...assetSwapTo,
                amount: Number(assetSwapTo?.amount) + Number(value.amountTo),
              };
            } else {
              updatedSwapToAsset = {
                id: value.swapTo.id,
                name: value.swapTo.name,
                amount: value.amountTo,
              };
            }

            const updatedSwapToAssets =
              filteredSwapToAsset.length >= 1
                ? filteredSwapToAsset.concat([updatedSwapToAsset])
                : [updatedSwapToAsset];

            const assetSwapFrom = updatedSwapToAssets.find(
              (asset: IAsset) => asset.id === value.swapFrom.id
            );

            const filteredSwapFromAsset = updatedSwapToAssets?.filter(
              (asset: IAsset) => asset.id !== value.swapFrom.id
            );

            const updatedSwapFromAsset = {
              ...assetSwapFrom,
              amount: Number(assetSwapFrom?.amount) - Number(value.amountFrom),
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
                  time: moment().format("LLL"),
                  address: account.id,
                  type: "Swap",
                  network: account.activeNetwork!,
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
      })}
    >
      {(formikProps) => {
        const { handleSubmit, errors, touched, values, setFieldValue } =
          formikProps;
        const filteredAssets = ASSETS.filter(
          (asset) => asset.id !== values.swapFrom.id
        );

        return (
          <form className="pad-24" onSubmit={handleSubmit}>
            <Form>
              <FormContent>
                <div className="select-input-group">
                  <Select
                    label="Swap from"
                    name="swapFrom"
                    options={account.assets.map((asset: IAsset) => ({
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
                          ? values.amountFrom.toString()
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
                    onClick={() => setSlippage(1)}
                    isBordered
                    variant={slippage === 1 ? "secondary" : "third"}
                  >
                    1%
                  </Button>
                  <Button
                    onClick={() => setSlippage(2)}
                    isBordered
                    variant={slippage === 2 ? "secondary" : "third"}
                  >
                    2%
                  </Button>
                  <Button
                    onClick={() => {
                      setIsCustomVisible(!isCustomVisible);
                      setSlippage(0);
                    }}
                    isBordered
                    variant={isCustomVisible ? "secondary" : "third"}
                  >
                    Custom
                  </Button>
                </div>
                {isCustomVisible && (
                  <>
                    <Spacer mb={8} />
                    <Textfield
                      id="custom"
                      name="custom"
                      label="Custom Slippage"
                      type="custom"
                      error={extractFormikError(errors, touched, ["custom"])}
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
