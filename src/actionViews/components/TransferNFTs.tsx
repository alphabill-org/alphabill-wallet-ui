import { useRef, useState } from "react";
import { Formik } from "formik";
import * as Yup from "yup";
import { Form, FormFooter, FormContent } from "../../components/Form/Form";
import { useQueryClient } from "react-query";

import Button from "../../components/Button/Button";
import Spacer from "../../components/Spacer/Spacer";
import Textfield from "../../components/Textfield/Textfield";

import Select from "../../components/Select/Select";
import {
  ITypeHierarchy,
  INFTAsset,
  IListTokensResponse,
  INFTTransferPayload,
} from "../../types/Types";
import { useApp } from "../../hooks/appProvider";
import { useAuth } from "../../hooks/useAuth";
import {
  getBlockHeight,
  getTypeHierarchy,
  makeTransaction,
} from "../../hooks/requests";

import {
  extractFormikError,
  getKeys,
  base64ToHexPrefixed,
  createOwnerProof,
  createNewBearer,
  invalidateAllLists,
  createInvariantPredicateSignatures,
} from "../../utils/utils";
import {
  timeoutBlocks,
  TokensSystemId,
  AlphaType,
  NFTTokensTransferType,
} from "../../utils/constants";

import { NFTTransferOrderHash } from "../../utils/hashers";

export default function TransferNFTs(): JSX.Element | null {
  const {
    setIsActionsViewVisible,
    isActionsViewVisible,
    account,
    NFTsList,
    selectedTransferKey,
    setActionsView,
    setSelectedTransferKey,
  } = useApp();
  const { vault, activeAccountId, setActiveAssetLocal, activeAsset } =
    useAuth();
  const queryClient = useQueryClient();
  const activeNFT = account?.assets.nft
    ?.filter((asset) => account?.activeNetwork === asset.network)
    .find((asset) => asset.typeId === activeAsset.typeId);
  const defaultAsset: { value: INFTAsset | undefined; label: string } = {
    value: activeNFT || account?.assets.nft[0],
    label: base64ToHexPrefixed(activeNFT?.id || account?.assets.nft[0]?.id),
  };
  const [selectedAsset, setSelectedAsset] = useState<INFTAsset | undefined>(
    defaultAsset?.value
  );
  const selectedNFT = NFTsList?.find(
    (token: IListTokensResponse) => token.id === selectedTransferKey
  );
  const pollingInterval = useRef<NodeJS.Timeout | null>(null);
  const initialBlockHeight = useRef<bigint | null | undefined>(null);
  const tokensAmount = useRef<number | null>(null);
  const [isSending, setIsSending] = useState<boolean>(false);
  const addPollingInterval = () => {
    initialBlockHeight.current = null;
    pollingInterval.current = setInterval(() => {
      invalidateAllLists(activeAccountId, activeAsset.typeId, queryClient);
      getBlockHeight(selectedAsset?.typeId === AlphaType).then(
        (blockHeight) => {
          if (!initialBlockHeight?.current) {
            initialBlockHeight.current = blockHeight;
          }

          if (
            BigInt(initialBlockHeight?.current) + timeoutBlocks <
            blockHeight
          ) {
            pollingInterval.current && clearInterval(pollingInterval.current);
          }
        }
      );
    }, 500);
  };

  if (!isActionsViewVisible) return <div></div>;

  return (
    <div className="w-100p">
      <Formik
        initialValues={{
          assets: {
            value: defaultAsset,
            label: defaultAsset.label,
          },
          address: "",
          password: "",
        }}
        onSubmit={(values, { setErrors, resetForm }) => {
          const { error, hashingPrivateKey, hashingPublicKey } = getKeys(
            values.password,
            Number(account.idx),
            vault
          );

          if (error || !hashingPrivateKey || !hashingPublicKey) {
            return setErrors({
              password: error || "Hashing keys are missing!",
            });
          }

          const selectedNFTs = selectedTransferKey
            ? (selectedNFT as IListTokensResponse)
            : NFTsList?.find(
                (token: IListTokensResponse) => selectedAsset?.id === token.id
              );

          if (!selectedNFTs) {
            return setErrors({
              password: error || "Selected NFT is missing!",
            });
          }

          const newBearer = createNewBearer(values.address);

          setIsSending(true);

          getBlockHeight(selectedAsset?.typeId === AlphaType).then(
            async (blockHeight) => {
              await getTypeHierarchy(selectedNFTs.typeId || "")
                .then(async (hierarchy: ITypeHierarchy[]) => {
                  const tokenData: INFTTransferPayload = {
                    systemId: TokensSystemId,
                    unitId: selectedNFTs.id,
                    transactionAttributes: {
                      "@type": NFTTokensTransferType,
                      newBearer: newBearer,
                      nftType: selectedNFTs.typeId,
                      backlink: selectedNFTs.txHash,
                    },
                    timeout: (blockHeight + timeoutBlocks).toString(),
                    ownerProof: "",
                  };
                  const msgHash = await NFTTransferOrderHash(tokenData);
                  const proof = await createOwnerProof(
                    msgHash,
                    hashingPrivateKey,
                    hashingPublicKey
                  );
                  let signatures;
                  try {
                    signatures = createInvariantPredicateSignatures(
                      hierarchy,
                      proof.ownerProof,
                      activeAccountId
                    );
                  } catch (error) {
                    setIsSending(false);
                    return setErrors({
                      password: error.message,
                    });
                  }

                  tokenData.transactionAttributes.invariantPredicateSignatures =
                    signatures;

                  const dataWithProof = {
                    transactions: [
                      Object.assign(tokenData, {
                        ownerProof: proof.ownerProof,
                        timeout: (blockHeight + timeoutBlocks).toString(),
                      }),
                    ],
                  } as any;

                  proof.isSignatureValid &&
                    makeTransaction(
                      dataWithProof,
                      selectedAsset?.typeId === AlphaType ? "" : values.address
                    ).then(() => {
                      tokensAmount.current = Number(NFTsList?.length) - 1;
                      addPollingInterval();
                      setIsSending(false);
                      setSelectedTransferKey(null);
                      setIsActionsViewVisible(false);
                      resetForm();
                    });
                })
                .catch(() => {
                  setIsSending(false);
                  setErrors({
                    password:
                      "Fetching token hierarchy for " +
                      selectedNFTs.typeId +
                      "failed",
                  });
                });
            }
          );
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
            )
            .test(
              "account-id-correct",
              `Address in not in valid format`,
              function (value) {
                if (!value || !Boolean(value.match(/^0x[0-9A-Fa-f]{66}$/))) {
                  return false;
                } else {
                  return true;
                }
              }
            ),
          password: Yup.string().required("Password is required"),
        })}
      >
        {(formikProps) => {
          const { handleSubmit, errors, touched, values } = formikProps;

          return (
            <form className="pad-24" onSubmit={handleSubmit}>
              <Form>
                <FormContent>
                  {selectedTransferKey && (
                    <>
                      {selectedTransferKey && (
                        <div className="t-medium-small">
                          You have selected a specific NFT.
                          You can deselect it by clicking{" "}
                          <Button
                            onClick={() => setSelectedTransferKey(null)}
                            variant="link"
                            type="button"
                          >
                            REMOVE TOKEN
                          </Button>{" "}
                          or select a new token from the{" "}
                          <Button
                            onClick={() => {
                              setActionsView("NFT list view");
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
                        value={base64ToHexPrefixed(selectedTransferKey)}
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
                      .map((asset: INFTAsset) => ({
                        value: asset,
                        label: base64ToHexPrefixed(asset.id),
                      }))}
                    error={extractFormikError(errors, touched, ["assets"])}
                    onChange={(_label, option: any) => {
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
                  <Spacer mb={8} />
                  {selectedTransferKey && (
                    <div>
                      <Spacer mt={8} />
                      <div className="t-medium c-primary">
                        ADD RECEIVER ADDRESS & PASSWORD
                      </div>

                      <Spacer mb={16} />
                    </div>
                  )}
                  <Textfield
                    id="address"
                    name="address"
                    label="Address"
                    type="address"
                    error={extractFormikError(errors, touched, ["address"])}
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
                  >
                    Transfer
                  </Button>
                </FormFooter>
              </Form>
            </form>
          );
        }}
      </Formik>
    </div>
  );
}
