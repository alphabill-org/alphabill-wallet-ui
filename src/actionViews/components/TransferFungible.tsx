import { useCallback, useEffect, useRef, useState } from "react";
import { Formik, FormikErrors } from "formik";
import * as Yup from "yup";
import { Form, FormFooter, FormContent } from "../../components/Form/Form";
import { useQueryClient } from "react-query";

import Button from "../../components/Button/Button";
import Spacer from "../../components/Spacer/Spacer";
import Textfield from "../../components/Textfield/Textfield";

import Select from "../../components/Select/Select";
import {
  IFungibleAsset,
  IBill,
  ITransactionPayload,
  ITypeHierarchy,
  IActiveAsset,
  ITransactionAttributes,
  ITransactionPayloadObj,
} from "../../types/Types";
import { useApp } from "../../hooks/appProvider";
import { useAuth } from "../../hooks/useAuth";
import {
  getRoundNumber,
  makeTransaction,
} from "../../hooks/requests";

import {
  extractFormikError,
  getKeys,
  base64ToHexPrefixed,
  createOwnerProof,
  predicateP2PKH,
  invalidateAllLists,
  addDecimal,
  convertToWholeNumberBigInt,
  createInvariantPredicateSignatures,
  separateDigits,
  getTokensLabel,
  FeeCostEl,
  getFungibleAssetsAmount,
  isValidAddress,
  handleBillSelection,
  createEllipsisString,
} from "../../utils/utils";
import {
  TimeoutBlocks,
  TokensTransferType,
  TokensSplitType,
  AlphaTransferType,
  AlphaSplitType,
  AlphaSystemId,
  TokensSystemId,
  AlphaType,
  FungibleListView,
  TransferFungibleView,
  MaxTransactionFee,
  TokenType,
} from "../../utils/constants";

import {
  prepTransactionRequestData,
  publicKeyHashWithFeeType,
} from "../../utils/hashers";

export default function TransferFungible(): JSX.Element | null {
  const {
    setIsActionsViewVisible,
    isActionsViewVisible,
    actionsView,
    account,
    unlockedBillsList,
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

  const directlySelectedAsset = unlockedBillsList?.find(
    (bill: IBill) => bill.id === selectedTransferKey
  );
  const fungibleAssets = account?.assets?.fungible?.filter(
    (asset) => account?.activeNetwork === asset.network
  );
  const fungibleActiveAsset =
    fungibleAssets.find((asset) => asset.typeId === activeAsset.typeId) ||
    fungibleAssets.find((asset) => asset.typeId === AlphaType)!;

  const defaultAsset: {
    value: IBill | IFungibleAsset | undefined;
    label: string;
  } = {
    value: directlySelectedAsset ? directlySelectedAsset : fungibleActiveAsset,
    label: directlySelectedAsset?.id || fungibleActiveAsset.symbol || AlphaType,
  };

  const [selectedAsset, setSelectedAsset] = useState<
    IBill | IFungibleAsset | IActiveAsset | undefined
  >(defaultAsset?.value);

  const decimals = selectedAsset?.decimals || 0;
  const tokenLabel = getTokensLabel(fungibleActiveAsset.typeId);
  const selectedBillValue = directlySelectedAsset?.value || "";
  const formRef = useRef(null);
  const pollingInterval = useRef<NodeJS.Timeout | null>(null);
  const initialRoundNumber = useRef<bigint | null | undefined>(null);
  const balanceAfterSending = useRef<bigint | null>(null);
  const [isSending, setIsSending] = useState<boolean>(false);

  const getAvailableAmount = useCallback(
    (decimals: number) =>
      getFungibleAssetsAmount(account, decimals, selectedAsset?.typeId || ""),
    [account, selectedAsset]
  );

  const [availableAmount, setAvailableAmount] = useState<string>(
    getAvailableAmount(selectedAsset?.decimals || 0)
  );

  const handleTransactionEnd = useCallback(() => {
    pollingInterval.current && clearInterval(pollingInterval.current);
    setIsSending(false);
    setSelectedTransferKey(null);
    setIsActionsViewVisible(false);
  }, [setIsActionsViewVisible, setSelectedTransferKey]);

  const addPollingInterval = () => {
    initialRoundNumber.current = null;
    pollingInterval.current = setInterval(() => {
      invalidateAllLists(
        activeAccountId,
        fungibleActiveAsset.typeId,
        queryClient
      );
      getRoundNumber(selectedAsset?.typeId === AlphaType).then(
        (roundNumber) => {
          if (!initialRoundNumber?.current) {
            initialRoundNumber.current = roundNumber;
          }

          if (
            BigInt(initialRoundNumber?.current ?? 0n) + TimeoutBlocks <
            (roundNumber ?? 0n)
          ) {
            handleTransactionEnd();
          }
        }
      );
    }, 500);
  };

  useEffect(() => {
    setAvailableAmount(getAvailableAmount(selectedAsset?.decimals || 0));
  }, [selectedAsset, getAvailableAmount, isActionsViewVisible]);

  useEffect(() => {
    const activeAssetAmount = account?.assets?.fungible
      ?.filter((asset) => account?.activeNetwork === asset.network)
      .find((asset) => asset.typeId === selectedAsset?.typeId)?.amount;

    if (BigInt(activeAssetAmount || "") === balanceAfterSending.current) {
      handleTransactionEnd();
      balanceAfterSending.current = null;
    } else if (
      balanceAfterSending.current === null &&
      pollingInterval.current &&
      !isSending
    ) {
      handleTransactionEnd();
    }

    if (actionsView !== TransferFungibleView && pollingInterval.current) {
      handleTransactionEnd();
    }
  }, [
    account?.assets,
    account?.activeNetwork,
    selectedAsset?.typeId,
    isSending,
    actionsView,
    handleTransactionEnd,
  ]);

  if (!isActionsViewVisible) return <div></div>;

  // interface FormikValues {
  //   assets: {
  //     value: IBill | IFungibleAsset | undefined;
  //     label: string;
  //   };
  //   amount: string;
  //   address: string;
  //   password: string;
  // }

  // const handleSubmit = async(
  //   values: FormikValues,
  //   setErrors: (errors: FormikErrors<FormikValues>) => void
  // ) => {

  // }

  return (
    <div className="w-100p">
      <Formik
        innerRef={formRef}
        initialValues={{
          assets: defaultAsset,
          amount: "",
          address: selectedTransferAccountKey || "",
          password: "",
        }}
        onSubmit={async (values, { setErrors }) => {
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

          let convertedAmount: bigint;
          try {
            convertedAmount = convertToWholeNumberBigInt(
              values.amount,
              selectedAsset?.decimals || 0
            );
          } catch (error) {
            return setErrors({
              password: (error as Error).message,
            });
          }

          const billsArr = selectedTransferKey
            ? [directlySelectedAsset]
            : unlockedBillsList || [];

          const {
            billsToTransfer,
            billToSplit,
            splitBillAmount,
          } = handleBillSelection(
            convertedAmount.toString(),
            billsArr as IBill[]
          );

          const newBearer = await predicateP2PKH(values.address);

          setIsSending(true);

          const isAlpha = selectedAsset?.typeId === AlphaType;

          getRoundNumber(isAlpha).then(async (roundNumber) => {
            let transferType = TokensTransferType;
            let splitType = TokensSplitType;
            let systemId = TokensSystemId;

            if (isAlpha) {
              transferType = AlphaTransferType;
              splitType = AlphaSplitType;
              systemId = AlphaSystemId;
            }

            const targetRecord = (await publicKeyHashWithFeeType({
              key: activeAccountId,
              isAlpha: Boolean(isAlpha),
            })) as Uint8Array;

            const baseObj = (bill: IBill, transferType: string) => {
              return {
                systemId: systemId,
                type: transferType,
                unitId: isAlpha
                  ? Buffer.from(bill.id, "base64")
                  : Buffer.from(bill.id.substring(2), "hex"),
              };
            };

            const clientDataObj = {
              clientMetadata: {
                timeout: roundNumber ?? 0n + TimeoutBlocks,
                MaxTransactionFee: MaxTransactionFee,
                feeCreditRecordID: targetRecord,
              },
            };

            billsToTransfer?.map(async (bill, idx) => {
              const transferData: ITransactionPayload = {
                payload: {
                  ...baseObj(bill, transferType),
                  attributes: {
                    newBearer: newBearer,
                    targetValue: BigInt(bill.value),
                    backlink: Buffer.from(bill.txHash, "base64"),
                  } as ITransactionAttributes,
                  ...clientDataObj,
                },
              };

              const isLastTransaction =
                Number(billsToTransfer?.length) === idx + 1 &&
                !billToSplit &&
                !splitBillAmount;

              handleTransaction(
                transferData as ITransactionPayload,
                isLastTransaction,
                bill.typeId
              );
            });

            if (billToSplit && splitBillAmount) {
              const splitData: ITransactionPayload = await {
                payload: {
                  ...baseObj(billToSplit, splitType),
                  attributes: {
                    targetUnits: [
                      Object.values({
                        targetValue: splitBillAmount,
                        targetOwner: newBearer,
                      }),
                    ],
                    remainingValue: BigInt(billToSplit.value) - splitBillAmount,
                    backlink: Buffer.from(billToSplit.txHash, "base64"),
                  } as ITransactionAttributes,
                  ...clientDataObj,
                },
              };

              handleTransaction(
                splitData as ITransactionPayload,
                true,
                billToSplit.typeId
              );
            }
          });

          const handleTransaction = async (
            billData: any,
            isLastTransfer: boolean,
            billTypeId?: string
          ) => {
            if (billTypeId && billTypeId !== AlphaType) {
              const attr = billData.payload.attributes;
              billData.payload.attributes = {
                bearer: newBearer,
                value:
                  Number(splitBillAmount) > 0
                    ? splitBillAmount
                    : attr.targetValue,
                nonce: null,
                backlink: attr.backlink,
                typeID: Buffer.from(billTypeId.substring(2), "hex"),
              };

              if (billData.payload.type === TokensSplitType) {
                billData.payload.attributes.remainingValue =
                  attr.remainingValue;
              }
              billData.payload.attributes.invariantPredicateSignatures = null;
            }

            const attributes = billData?.payload
              .attributes as ITransactionAttributes;
            const amount =
              attributes?.targetValue ||
              attributes?.value ||
              splitBillAmount ||
              0n;

            const proof = await createOwnerProof(
              billData.payload,
              hashingPrivateKey,
              hashingPublicKey
            );

            const finishTransaction = async (
              transferData: ITransactionPayload
            ) => {
              const feeProof = await createOwnerProof(
                transferData.payload as ITransactionPayloadObj,
                hashingPrivateKey,
                hashingPublicKey
              );

              if (proof.isSignatureValid) {
                makeTransaction(
                  prepTransactionRequestData(
                    transferData,
                    proof.ownerProof,
                    feeProof.ownerProof
                  ),
                  account.pubKey,
                  selectedAsset?.typeId === AlphaType
                )
                  .then(() => {
                    setPreviousView(null);

                    const fungibleSelectedAsset = account?.assets?.fungible
                      ?.filter(
                        (asset) => account?.activeNetwork === asset.network
                      )
                      .find(
                        (asset) => asset.typeId === values.assets.value?.typeId
                      ) as IBill | IFungibleAsset;

                    balanceAfterSending.current = balanceAfterSending.current
                      ? BigInt(balanceAfterSending.current) - amount
                      : BigInt(
                          (fungibleSelectedAsset as IFungibleAsset)?.amount ||
                            (fungibleSelectedAsset as IBill)?.value ||
                            ""
                        ) - amount;
                  })
                  .finally(() => {
                    const handleTransferEnd = () => {
                      addPollingInterval();
                      setSelectedAsset(activeAsset);
                    };

                    if (isLastTransfer) {
                      handleTransferEnd();
                    }
                  });
              }
            };

            if (selectedAsset?.typeId !== AlphaType) {
              try {
                const hierarchy: ITypeHierarchy[] = await Hierarchy(
                  billTypeId || ""
                );
                const signatures = createInvariantPredicateSignatures(
                  hierarchy,
                  proof.ownerProof,
                  activeAccountId
                );

                billData.payload.attributes.invariantPredicateSignatures = signatures;
                finishTransaction(billData);
              } catch (error) {
                setIsSending(false);
                setErrors({
                  password: error.message,
                });
              }
            } else {
              finishTransaction(billData);
            }
          };
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
                BigInt(
                  feeCreditBills?.[
                    selectedAsset?.typeId === AlphaType ? AlphaType : TokenType
                  ]?.value || "0"
                ) >= BigInt("1")
            )
            .required("Password is required"),
          amount: Yup.string()
            .required("Amount is required")
            .test(
              "test more than",
              "Value must be greater than 0",
              (value: string | undefined) => Number(value || "") > 0n
            )
            .test(
              "test less than",
              "Amount exceeds available assets",
              (value: string | undefined) =>
                selectedTransferKey
                  ? true
                  : value
                  ? convertToWholeNumberBigInt(value || "", decimals) <=
                    convertToWholeNumberBigInt(availableAmount, decimals)
                  : true
            ),
        })}
      >
        {(formikProps) => {
          const {
            handleSubmit,
            setFieldValue,
            errors,
            touched,
            values,
          } = formikProps;
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
                          You have selected a {tokenLabel} with a value of{" "}
                          {selectedBillValue &&
                            selectedAsset &&
                            separateDigits(
                              addDecimal(
                                selectedBillValue || "0",
                                selectedAsset?.decimals || 0
                              )
                            )}
                          . You can deselect it by clicking{" "}
                          <Button
                            onClick={() => {
                              setSelectedTransferKey(null);
                              setSelectedAsset(activeAsset);
                              setFieldValue("assets", {
                                value: activeAsset,
                                label: activeAsset?.symbol,
                              });
                            }}
                            variant="link"
                            type="button"
                          >
                            REMOVE {tokenLabel.toUpperCase()}
                          </Button>{" "}
                          or select a new {tokenLabel} from the{" "}
                          <Button
                            onClick={() => {
                              setPreviousView(null);
                              setActionsView(FungibleListView);
                              setIsActionsViewVisible(true);
                              setSelectedTransferKey(null);
                              invalidateAllLists(
                                activeAccountId,
                                fungibleActiveAsset.typeId,
                                queryClient
                              );
                            }}
                            type="button"
                            variant="link"
                          >
                            {tokenLabel.toUpperCase()}S LIST
                          </Button>
                        </div>
                      )}
                      <Spacer mt={16} />
                      <Textfield
                        id="selectedBillId"
                        name="selectedBillId"
                        label={"SELECTED " + tokenLabel + " ID"}
                        type="selectedBillId"
                        value={createEllipsisString(hexID, 20, 14)}
                      />
                      <Spacer mb={16} />
                    </>
                  )}
                  <Select
                    label="Assets"
                    name="assets"
                    className={selectedTransferKey ? "d-none" : ""}
                    options={account?.assets?.fungible
                      ?.filter(
                        (asset) =>
                          account?.activeNetwork === asset.network &&
                          asset.isSendable
                      )
                      .sort((a: IFungibleAsset, b: IFungibleAsset) => {
                        if (a?.symbol! < b?.symbol!) {
                          return -1;
                        }
                        if (a?.symbol! > b?.symbol!) {
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
                      .map((asset: IFungibleAsset) => ({
                        value: asset,
                        label: asset.symbol,
                      }))}
                    defaultValue={defaultAsset}
                    error={extractFormikError(errors, touched, ["assets"])}
                    onChange={(_label, option: any) => {
                      setSelectedAsset(option);
                      invalidateAllLists(
                        activeAccountId,
                        fungibleActiveAsset.typeId,
                        queryClient
                      );
                      setActiveAssetLocal(JSON.stringify(option));
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
                  <div className={selectedTransferKey ? "d-none" : ""}>
                    <Textfield
                      id="amount"
                      name="amount"
                      label="Amount"
                      desc={availableAmount + " " + values.assets?.label}
                      type="text"
                      floatingFixedPoint={selectedAsset?.decimals}
                      error={extractFormikError(errors, touched, ["amount"])}
                      disabled={
                        !Boolean(values.assets) || Boolean(selectedTransferKey)
                      }
                      value={
                        (selectedTransferKey &&
                          (addDecimal(
                            selectedBillValue,
                            selectedAsset?.decimals || 0
                          ) as string | undefined)) ||
                        ""
                      }
                      isNumberFloat
                      removeApostrophes
                    />
                    <Spacer mb={8} />
                  </div>
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
      {!selectedTransferKey && (
        <div className="t-medium-small pad-24-h pad-24-b">
          To select a specific {tokenLabel} open your{" "}
          <Button
            small
            onClick={() => {
              setPreviousView(null);
              setActiveAssetLocal(JSON.stringify(fungibleActiveAsset));
              setActionsView(FungibleListView);
              setIsActionsViewVisible(true);
              invalidateAllLists(
                activeAccountId,
                activeAsset.typeId,
                queryClient
              );
            }}
            variant="link"
            type="button"
          >
            {tokenLabel.toUpperCase()}S LIST
          </Button>{" "}
          and select it from {tokenLabel}s options.
        </div>
      )}
    </div>
  );
}
