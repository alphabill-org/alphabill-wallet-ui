import { Formik } from "formik";
import * as Yup from "yup";
import { Form, FormFooter, FormContent } from "../../Form/Form";

import Button from "../../Button/Button";
import Spacer from "../../Spacer/Spacer";
import Textfield from "../../Textfield/Textfield";
import { extractFormikError } from "../../../utils/utils";
import Select from "../../Select/Select";
import { IAsset } from "../../../types/Types";

function Swap({ account, setAccounts }: any): JSX.Element | null {
  return (
    <Formik
      initialValues={{
        password: "12345678",
        walletID: "0x68ab2...4ff2408",
      }}
      onSubmit={(values) => console.log("Submit")}
      validationSchema={Yup.object().shape({
        password: Yup.string().test(
          "empty-or-8-characters-check",
          "Password must be at least 8 characters",
          (password) => !password || password.length >= 8
        ),
      })}
    >
      {(formikProps) => {
        const { handleSubmit, errors, touched } = formikProps;

        return (
          <form className="pad-24" onSubmit={handleSubmit}>
            <Form>
              <FormContent>
                <div className="select-input-group">
                  <Select
                    label="Swap from"
                    name="SwapFrom"
                    options={account.assets.map((asset: IAsset) => ({
                      value: asset,
                      label: asset.name,
                    }))}
                    error={extractFormikError(errors, touched, ["SwapFrom"])}
                  />
                  <Textfield
                    id="AmountFrom"
                    name="AmountFrom"
                    label=""
                    type="AmountFrom"
                    error={extractFormikError(errors, touched, ["AmountFrom"])}
                  />
                </div>
                <Spacer mb={24} />
                <div className="select-input-group">
                  <Select
                    label="Swap to"
                    name="SwapTo"
                    options={account.assets.map((asset: IAsset) => ({
                      value: asset,
                      label: asset.name,
                    }))}
                    error={extractFormikError(errors, touched, ["SwapTo"])}
                  />
                  <Textfield
                    id="AmountTo"
                    name="AmountTo"
                    label=""
                    type="AmountTo"
                    error={extractFormikError(errors, touched, ["AmountTo"])}
                  />
                </div>
                <Spacer mb={24} />
                <span className="t-medium-small">Slippage</span>
                <Spacer mb={8} />
                <div className="button__group">
                  <Button isBordered variant="secondary">1%</Button>
                  <Button isBordered variant="third">2%</Button>
                  <Button isBordered variant="third">Custom</Button>
                </div>
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
