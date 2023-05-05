import { Formik } from "formik";
import * as Yup from "yup";

import { Form, FormFooter, FormContent } from "../components/Form/Form";
import Button from "../components/Button/Button";
import { extractFormikError } from "../utils/utils";
import { useAuth } from "../hooks/useAuth";
import { useMemo } from "react";
import Select from "../components/Select/Select";
import Popup from "../components/Popup/Popup";
import Spacer from "../components/Spacer/Spacer";

function ConnectPopup(): JSX.Element {
  const { setIsConnectWalletPopup, userKeys, isConnectWalletPopup } = useAuth();
  const keysArr = useMemo(() => userKeys?.split(" ") || [], [userKeys]);

  return (
    <div>
      <Popup
        isPopupVisible={isConnectWalletPopup}
        setIsPopupVisible={(v) => {
          setIsConnectWalletPopup(v);
          chrome?.storage?.local.set({ ab_is_connect_popup: v });
        }}
        title="Select key to connect"
      >
        <Formik
          initialValues={{
            keys: { label: keysArr[0], value: keysArr[0] },
          }}
          onSubmit={(values) => {
            // Send a message from the content script to the background script
            chrome?.runtime
              ?.sendMessage({
                walletMessage: {
                  ab_connection_is_confirmed: true,
                  ab_pub_key: values?.keys.value,
                },
              })
              .then(() => {
                setIsConnectWalletPopup(false);
                chrome?.storage?.local
                  .set({
                    ab_is_connect_popup: false,
                    ab_connected_key: values?.keys.value,
                  })
                  .then(() => window.close());
              });
          }}
          validationSchema={Yup.object().shape({
            keys: Yup.object().required("Selected key is required"),
          })}
        >
          {(formikProps) => {
            const { handleSubmit, errors, touched } = formikProps;

            return (
              <form onSubmit={handleSubmit}>
                <Form>
                  <FormContent>
                    <Spacer mb={16} />
                    <Select
                      label=""
                      name="keys"
                      options={keysArr?.map((key: string) => ({
                        value: key,
                        label: key,
                      }))}
                      error={extractFormikError(errors, touched, ["keys"])}
                    />
                  </FormContent>
                  <FormFooter>
                    <Button
                      big={true}
                      block={true}
                      type="submit"
                      variant="primary"
                    >
                      Connect wallet
                    </Button>
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

export default ConnectPopup;
