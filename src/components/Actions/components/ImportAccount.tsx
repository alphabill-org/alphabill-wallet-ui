import { Formik } from "formik";
import { useState } from "react";
import classNames from "classnames";

import { Form, FormFooter, FormContent } from "../../Form/Form";
import Button from "../../Button/Button";
import Spacer from "../../Spacer/Spacer";
import Textfield from "../../Textfield/Textfield";
import { extractFormikError } from "../../../utils/utils";

function ImportAccount({ account, setAccounts }: any): JSX.Element | null {
  const [isAssetsColActive, setIsAssetsColActive] = useState(false);
  const [isImportTypeKey, setIsImportTypeKey] = useState(true);

  return (
    <div className="import-account">
      <Spacer mb={8} />
      <div className="dashboard__navbar">
        <div
          onClick={() => setIsAssetsColActive(true)}
          className={classNames("dashboard__navbar-item", {
            active: isAssetsColActive === true,
          })}
        >
          Import
        </div>
        <div
          onClick={() => setIsAssetsColActive(false)}
          className={classNames("dashboard__navbar-item", {
            active: isAssetsColActive !== true,
          })}
        >
          Hardware
        </div>
      </div>
      <Spacer mb={8} />
      <div className="pad-24">
        <p>
          Imported accounts will not be associated with your originally created
          Binance Wallet account seed phrase.
        </p>
        <Spacer mb={8} />
        <p>Select type</p>
        <Spacer mb={4} />
        <div className="button__group">
          <Button
            variant="secondary"
            onClick={() => setIsImportTypeKey(true)}
            isActive={isImportTypeKey}
          >
            Private Key
          </Button>
          <Button
            variant="secondary"
            onClick={() => setIsImportTypeKey(false)}
            isActive={!isImportTypeKey}
          >
            JSON file
          </Button>
        </div>
        <Spacer mb={16} />

        <Formik
          initialValues={{
            PrivateKey: "",
          }}
          onSubmit={(values) => console.log("Submit")}
        >
          {(formikProps) => {
            const { handleSubmit, errors, touched } = formikProps;

            return (
              <form onSubmit={handleSubmit}>
                <Form>
                  <FormContent>
                    <Textfield
                      id="PrivateKey"
                      name="PrivateKey"
                      label="Paste Your Private Key String Here"
                      type="PrivateKey"
                      error={extractFormikError(errors, touched, [
                        "PrivateKey",
                      ])}
                    />
                  </FormContent>
                  <FormFooter>
                    <Button
                      big={true}
                      block={true}
                      type="submit"
                      variant="primary"
                    >
                      Import
                    </Button>
                  </FormFooter>
                </Form>
              </form>
            );
          }}
        </Formik>
      </div>
    </div>
  );
}

export default ImportAccount;
