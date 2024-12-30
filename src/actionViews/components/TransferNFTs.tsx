import { useCallback, useRef, useState } from "react";
import { Formik, FormikErrors, FormikState } from "formik";
import * as Yup from "yup";
import { Form, FormFooter, FormContent } from "../../components/Form/Form";
import { useQueryClient } from "react-query";

import Button from "../../components/Button/Button";
import Spacer from "../../components/Spacer/Spacer";
import Textfield from "../../components/Textfield/Textfield";

import Select from "../../components/Select/Select";
import { INFTAsset, IListTokensResponse, ITransferFormNFT } from "../../types/Types";
import { useApp } from "../../hooks/appProvider";
import { useAuth } from "../../hooks/useAuth";
import { transferNFT } from "../../hooks/requests";

import { extractFormikError, getKeys, invalidateAllLists, removeConnectTransferData, FeeCostEl, isValidAddress, createEllipsisString } from "../../utils/utils";
import { Base16Converter } from "@alphabill/alphabill-js-sdk/lib/util/Base16Converter";

import { AlphaType, NFTListView, TokenType } from "../../utils/constants";


export default function TransferNFTs(): JSX.Element | null {
  const {
    setIsActionsViewVisible,
    isActionsViewVisible,
    account,
    NFTsList,
    selectedTransferKey,
    setActionsView,
    setSelectedTransferKey,
    setPreviousView,
    selectedTransferAccountKey,
    feeCreditBills,
  } = useApp();
  const {
    vault,
    activeAccountId,
    setActiveAssetLocal,
    activeAsset,
  } = useAuth();
  const queryClient = useQueryClient();
  const activeNFT = account?.assets.nft
    ?.filter((asset) => account?.activeNetwork === asset.network)
    .find((asset) => asset.id === activeAsset.id);

  const defaultAssetId = activeNFT?.id || account?.assets.nft[0]?.id;
  const defaultAsset: { value: INFTAsset | undefined; label: string } = {
    value: activeNFT || account?.assets.nft[0],
    label: createEllipsisString(defaultAssetId, 16, 11),
  };
  const [selectedAsset, setSelectedAsset] = useState<INFTAsset | undefined>(
    defaultAsset?.value
  );
  const selectedTransferNFT = NFTsList?.find(
    (token: IListTokensResponse) => token.id === selectedTransferKey
  );
  const pollingInterval = useRef<NodeJS.Timeout | null>(null);
  const [isSending, setIsSending] = useState<boolean>(false);
  

  const removePollingInterval = useCallback((isProof: boolean = false) => {
    pollingInterval.current 
      && clearInterval(pollingInterval.current);

    setIsSending(false);

    if (isProof) {
      setSelectedTransferKey(null);
      setIsActionsViewVisible(false);
      setPreviousView(null);
    }
  }, [setIsActionsViewVisible, setPreviousView, setSelectedTransferKey]);

  const addPollingInterval = useCallback(() => {
    pollingInterval.current = setInterval(async () => {
      try {
        invalidateAllLists(activeAccountId, activeAsset.typeId, queryClient);
        removePollingInterval(true);
      } catch (error) {
        throw new Error("Error fetching transaction proof");
      }
    }, 500);
  }, [activeAccountId, activeAsset.typeId, queryClient, removePollingInterval]);

  const handleSubmit = useCallback(async(
    values: ITransferFormNFT,
    setErrors: (errors: FormikErrors<ITransferFormNFT>) => void,
    resetForm: (nextState?: Partial<FormikState<ITransferFormNFT>> | undefined) => void
  ) => {
    const { error, hashingPrivateKey, hashingPublicKey } = getKeys(
      values.password,
      Number(account.idx),
      vault
    );

    if (error || !hashingPrivateKey || !hashingPublicKey) {
      return setErrors({
        password: error || "Hashing keys are missing!"
      });
    }

    const selectedNFT = selectedTransferKey
      ? (selectedTransferNFT as IListTokensResponse)
      : NFTsList?.find(
        (token: IListTokensResponse) => selectedAsset?.id === token.id
      );

    if (!selectedNFT) {
      return setErrors({
        password: error || "NFT is required!",
      });
    }

    setIsSending(true);

    try {
      const decodedId = Base16Converter.decode(selectedNFT.id);
      const recipient = Base16Converter.decode(values.address);

      const txHash = await transferNFT(hashingPrivateKey, decodedId, recipient);
      if (!txHash) {
        return setErrors({
          password: error || "Error occurred fetching transaction hash"
        });
      }

      addPollingInterval();
    } catch(error) {
      setErrors({
        password: (error as Error).message || "Error occurred during the transaction"
      })
    }
  }, [NFTsList, account.idx, addPollingInterval, selectedAsset?.id, selectedTransferKey, selectedTransferNFT, vault])

  if (!isActionsViewVisible) return <div></div>;

  return (
    <div className="w-100p">
      <Formik
        initialValues={{
          assets: {
            value: defaultAsset,
            label: defaultAsset.label,
          },
          address: selectedTransferAccountKey || "",
          password: "",
        }}
        onSubmit={async (values, { setErrors, resetForm }) => { handleSubmit(values, setErrors, resetForm) }}
        validationSchema={Yup.object().shape({
          assets: Yup.object().required("Selected asset is required"),
          address: Yup.string()
            .required("Address is required")
            .test(
              "account-id-same",
              `Receiver's account is your account`,
              (value) => !value || account?.pubKey !== value
            )
            .test(
              "account-id-correct",
              `Address in not in valid format`,
              (value) => isValidAddress(value)
            ),
          password: Yup.string()
            .test(
              "test less than",
              "Add fee credits",
              () =>
                BigInt(feeCreditBills?.[TokenType]?.value || "0") >= BigInt("1")
            )
            .required("Password is required"),
        })}
      >
        {(formikProps) => {
          const { handleSubmit, errors, touched, values } = formikProps;
          const hexID = selectedTransferKey
            ? selectedTransferKey
            : "";

          return (
            <form className="pad-24" onSubmit={handleSubmit}>
              <Form>
                <FormContent>
                  {selectedTransferKey && (
                    <>
                      {selectedTransferKey && (
                        <div className="t-medium-small">
                          You have selected a specific NFT. You can deselect it
                          by clicking{" "}
                          <Button
                            onClick={() => {
                              setSelectedTransferKey(null);
                              removeConnectTransferData();
                            }}
                            variant="link"
                            type="button"
                          >
                            REMOVE TOKEN
                          </Button>{" "}
                          or select a new token from the{" "}
                          <Button
                            onClick={() => {
                              removeConnectTransferData();
                              setPreviousView(null);
                              setActionsView(NFTListView);
                              setIsActionsViewVisible(true);
                              setSelectedTransferKey(null);
                              invalidateAllLists(
                                activeAccountId,
                                activeAsset.typeId,
                                queryClient
                              );
                            }}
                            type="button"
                            variant="link"
                          >
                            TOKENS LIST
                          </Button>{" "}
                          .
                        </div>
                      )}
                      <Spacer mt={16} />
                      <Textfield
                        id="selectedNFTId"
                        name="selectedNFTId"
                        label={"SELECTED TOKEN ID"}
                        type="selectedNFTId"
                        value={createEllipsisString(hexID, 20, 14)}
                      />
                      <Spacer mb={16} />
                    </>
                  )}
                  <Select
                    label="Assets"
                    name="assets"
                    className={selectedTransferKey ? "d-none" : ""}
                    options={account?.assets.nft
                      ?.filter(
                        (asset) =>
                          account?.activeNetwork === asset.network &&
                          asset.isSendable
                      )
                      .sort((a: INFTAsset, b: INFTAsset) => {
                        if (a?.id! < b?.id!) {
                          return -1;
                        }
                        if (a?.id! > b?.id!) {
                          return 1;
                        }
                        return 0;
                      })
                      .sort(function (a, b) {
                        if (a.id === AlphaType) {
                          return -1; // Move the object with the given ID to the beginning of the array
                        }
                        return 1;
                      })
                      .map((asset: INFTAsset) => {
                        const hexID = asset.id;
                        return {
                          value: asset,
                          label: createEllipsisString(hexID, 16, 11),
                        };
                      })}
                    error={extractFormikError(errors, touched, ["assets"])}
                    onChange={async (_label, option: any) => {
                      setSelectedAsset(option);
                      invalidateAllLists(
                        activeAccountId,
                        activeAsset.typeId,
                        queryClient
                      );
                      setActiveAssetLocal(JSON.stringify(option));
                    }}
                    defaultValue={{
                      value: defaultAsset,
                      label: defaultAsset.label,
                    }}
                  />
                  <Textfield
                    id="address"
                    name="address"
                    label="Address"
                    type="address"
                    error={extractFormikError(errors, touched, ["address"])}
                    value={selectedTransferAccountKey || ""}
                  />
                  <Spacer mb={8} />
                  <Textfield
                    id="password"
                    name="password"
                    label="Password"
                    type="password"
                    error={extractFormikError(errors, touched, ["password"])}
                    disabled={
                      !Boolean(values.assets) && !Boolean(selectedTransferKey)
                    }
                  />
                  <Spacer mb={4} />
                </FormContent>
                <FormFooter>
                  <Button
                    big={true}
                    block={true}
                    type="submit"
                    variant="primary"
                    working={isSending}
                    disabled={isSending}
                  >
                    Transfer
                  </Button>
                  <FeeCostEl />
                </FormFooter>
              </Form>
            </form>
          );
        }}
      </Formik>
    </div>
  );
}
