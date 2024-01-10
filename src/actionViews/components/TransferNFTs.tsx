import { useEffect, useRef, useState } from "react";
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
  ITransactionPayload,
  ITransactionAttributes,
  ITransactionPayloadObj,
} from "../../types/Types";
import { useApp } from "../../hooks/appProvider";
import { useAuth } from "../../hooks/useAuth";
import {
  getRoundNumber,
  getTypeHierarchy,
  makeTransaction,
} from "../../hooks/requests";

import {
  extractFormikError,
  getKeys,
  base64ToHexPrefixed,
  createOwnerProof,
  predicateP2PKH,
  invalidateAllLists,
  createInvariantPredicateSignatures,
  sendTransferMessage,
  removeConnectTransferData,
  FeeCostEl,
  isValidAddress,
  createEllipsisString,
} from "../../utils/utils";
import {
  TimeoutBlocks,
  TokensSystemId,
  AlphaType,
  NFTTokensTransferType,
  NFTListView,
  MaxTransactionFee,
  TokenType,
} from "../../utils/constants";

import {
  prepTransactionRequestData,
  publicKeyHashWithFeeType,
  transferOrderTxHash,
} from "../../utils/hashers";

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
  const { vault, activeAccountId, setActiveAssetLocal, activeAsset } =
    useAuth();
  const queryClient = useQueryClient();
  const activeNFT = account?.assets.nft
    ?.filter((asset) => account?.activeNetwork === asset.network)
    .find((asset) => asset.id === activeAsset.id);

  const defaultAssetId = activeNFT?.id || account?.assets.nft[0]?.id;
  const defaultAsset: { value: INFTAsset | undefined; label: string } = {
    value: activeNFT || account?.assets.nft[0],
    label: createEllipsisString(base64ToHexPrefixed(defaultAssetId), 16, 11),
  };
  const [selectedAsset, setSelectedAsset] = useState<INFTAsset | undefined>(
    defaultAsset?.value
  );
  const selectedTransferNFT = NFTsList?.find(
    (token: IListTokensResponse) => token.id === selectedTransferKey
  );
  const pollingInterval = useRef<NodeJS.Timeout | null>(null);
  const initialRoundNumber = useRef<bigint | null | undefined>(null);
  const transferredToken = useRef<IListTokensResponse | null>(null);
  const [isSending, setIsSending] = useState<boolean>(false);
  const addPollingInterval = () => {
    initialRoundNumber.current = null;
    pollingInterval.current = setInterval(() => {
      invalidateAllLists(activeAccountId, activeAsset.typeId, queryClient);
      getRoundNumber(false).then((roundNumber) => {
        if (!initialRoundNumber?.current) {
          initialRoundNumber.current = roundNumber;
        }

        if (BigInt(initialRoundNumber?.current) + TimeoutBlocks < roundNumber) {
          pollingInterval.current && clearInterval(pollingInterval.current);
        }
      });
    }, 500);
  };

  useEffect(() => {
    const isTokenTransferred = !NFTsList?.find(
      (token) => token.id === transferredToken.current?.id
    );
    if (pollingInterval.current && isTokenTransferred) {
      clearInterval(pollingInterval.current);
    }
  }, [NFTsList]);

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
        onSubmit={async (values, { setErrors, resetForm }) => {
          const { error, hashingPrivateKey, hashingPublicKey } = getKeys(
            values.password,
            Number(account?.idx),
            vault
          );

          if (error || !hashingPrivateKey || !hashingPublicKey) {
            return setErrors({
              password: error || "Hashing keys are missing!",
            });
          }

          const selectedNFT = selectedTransferKey
            ? (selectedTransferNFT as IListTokensResponse)
            : NFTsList?.find(
                (token: IListTokensResponse) => selectedAsset?.id === token.id
              );

          if (!selectedNFT) {
            return setErrors({
              password: error || "NFT is required",
            });
          }

          const newBearer = await predicateP2PKH(values.address);

          setIsSending(true);

          getRoundNumber(false).then(async (roundNumber) => {
            await getTypeHierarchy(selectedNFT.typeId || "")
              .then(async (hierarchy: ITypeHierarchy[]) => {
                const feeCreditRecordID = (await publicKeyHashWithFeeType({
                  key: activeAccountId,
                  isAlpha: false,
                })) as Uint8Array;

                const tokenData: ITransactionPayload = {
                  payload: {
                    systemId: TokensSystemId,
                    type: NFTTokensTransferType,
                    unitId: Buffer.from(selectedNFT.id, "base64"),
                    attributes: {
                      newBearer: newBearer,
                      nftType: Buffer.from(selectedNFT.typeId, "base64"),
                      backlink: Buffer.from(selectedNFT.txHash, "base64"),
                      typeID: Buffer.from(selectedNFT.typeId, "base64"),
                      invariantPredicateSignatures: null,
                    },
                    clientMetadata: {
                      timeout: roundNumber + TimeoutBlocks,
                      MaxTransactionFee: MaxTransactionFee,
                      feeCreditRecordID: feeCreditRecordID,
                    },
                  },
                };
                const tokenDataObj = tokenData;

                const proof = await createOwnerProof(
                  tokenData.payload as ITransactionPayloadObj,
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

                (
                  tokenData.payload.attributes as ITransactionAttributes
                ).invariantPredicateSignatures = signatures;

                transferredToken.current = selectedNFT;
                const feeProof = await createOwnerProof(
                  tokenData.payload as ITransactionPayloadObj,
                  hashingPrivateKey,
                  hashingPublicKey
                );
                proof.isSignatureValid &&
                  makeTransaction(
                    prepTransactionRequestData(
                      tokenData,
                      proof.ownerProof,
                      feeProof.ownerProof
                    ),
                    values.address
                  ).then(async () => {
                    const handleTransferEnd = () => {
                      addPollingInterval();
                      setIsSending(false);
                      setSelectedTransferKey(null);
                      setIsActionsViewVisible(false);
                      resetForm();
                      setPreviousView(null);
                    };

                    if (Boolean(chrome?.storage) && tokenDataObj) {
                      chrome?.storage?.local.get(
                        ["ab_connect_transfer"],
                        async function (transferRes) {
                          const typeId =
                            transferRes?.ab_connect_transfer?.token_type_id;

                          if (Boolean(typeId)) {
                            sendTransferMessage(
                              transferredToken.current as INFTAsset,
                              await transferOrderTxHash(
                                prepTransactionRequestData(
                                  tokenData,
                                  proof.ownerProof,
                                  feeProof.ownerProof
                                )
                              ),
                              handleTransferEnd
                            );
                          } else {
                            handleTransferEnd();
                          }
                        }
                      );
                    } else {
                      handleTransferEnd();
                    }
                  });
              })
              .catch(() => {
                setIsSending(false);
                setErrors({
                  password:
                    "Fetching token hierarchy for " +
                    selectedNFT.typeId +
                    "failed",
                });
              });
          });
        }}
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
            ? base64ToHexPrefixed(selectedTransferKey)
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
                        const hexID = base64ToHexPrefixed(asset.id);
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
