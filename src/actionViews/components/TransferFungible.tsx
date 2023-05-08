import { useCallback, useEffect, useRef, useState } from "react";
import { Formik } from "formik";
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
  IProofTx,
  ITransfer,
  ITypeHierarchy,
  IActiveAsset,
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
  findClosestBigger,
  getOptimalBills,
  getBillsSum,
  invalidateAllLists,
  addDecimal,
  convertToWholeNumberBigInt,
  createInvariantPredicateSignatures,
  separateDigits,
  getTokensLabel,
} from "../../utils/utils";
import {
  timeoutBlocks,
  TokensTransferType,
  TokensSplitType,
  AlphaTransferType,
  AlphaSplitType,
  AlphaSystemId,
  TokensSystemId,
  AlphaType,
  FungibleListView,
  TransferFungibleView,
} from "../../utils/constants";

import { splitOrderHash, transferOrderHash } from "../../utils/hashers";

export default function TransferFungible(): JSX.Element | null {
  const {
    setIsActionsViewVisible,
    isActionsViewVisible,
    actionsView,
    account,
    billsList,
    selectedTransferKey,
    setActionsView,
    setSelectedTransferKey,
    setPreviousView,
    selectedTransferAccountKey,
  } = useApp();
  const { vault, activeAccountId, setActiveAssetLocal, activeAsset } =
    useAuth();
  const queryClient = useQueryClient();
  const directlySelectedAsset = billsList?.find(
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
    label: directlySelectedAsset?.id || fungibleActiveAsset.name || AlphaType,
  };

  const [selectedAsset, setSelectedAsset] = useState<
    IBill | IFungibleAsset | IActiveAsset | undefined
  >(defaultAsset?.value);
  const decimals = selectedAsset?.decimals || 0;
  const tokenLabel = getTokensLabel(fungibleActiveAsset.typeId);
  const selectedBillValue = directlySelectedAsset?.value || "";
  const pollingInterval = useRef<NodeJS.Timeout | null>(null);
  const initialBlockHeight = useRef<bigint | null | undefined>(null);
  const balanceAfterSending = useRef<bigint | null>(null);
  const [isSending, setIsSending] = useState<boolean>(false);

  const getAvailableAmount = useCallback(
    (decimals: number) => {
      return addDecimal(
        BigInt(
          account?.assets?.fungible?.find(
            (asset) => asset.typeId === selectedAsset?.typeId
          )?.amount || "0"
        ).toString() || "0",
        decimals
      );
    },
    [account, selectedAsset]
  );
  const [availableAmount, setAvailableAmount] = useState<string>(
    getAvailableAmount(selectedAsset?.decimals || 0)
  );

  const addPollingInterval = () => {
    initialBlockHeight.current = null;
    pollingInterval.current = setInterval(() => {
      invalidateAllLists(
        activeAccountId,
        fungibleActiveAsset.typeId,
        queryClient
      );
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

  useEffect(() => {
    setAvailableAmount(getAvailableAmount(selectedAsset?.decimals || 0));
  }, [selectedAsset, getAvailableAmount, isActionsViewVisible]);

  useEffect(() => {
    const activeAssetAmount = account?.assets?.fungible
      ?.filter((asset) => account?.activeNetwork === asset.network)
      .find((asset) => asset.typeId === selectedAsset?.typeId)?.amount;

    if (BigInt(activeAssetAmount || "") === balanceAfterSending.current) {
      pollingInterval.current && clearInterval(pollingInterval.current);
      balanceAfterSending.current = null;
    } else if (
      balanceAfterSending.current === null &&
      pollingInterval.current &&
      !isSending
    ) {
      clearInterval(pollingInterval.current);
    }

    if (actionsView !== TransferFungibleView && pollingInterval.current) {
      clearInterval(pollingInterval.current);
    }
  }, [
    account?.assets,
    account?.activeNetwork,
    selectedAsset?.typeId,
    isSending,
    actionsView,
  ]);

  if (!isActionsViewVisible) return <div></div>;

  return (
    <div className="w-100p">
      <Formik
        initialValues={{
          assets: defaultAsset,
          amount: "",
          address: selectedTransferAccountKey || "",
          password: "",
        }}
        onSubmit={(values, { setErrors, resetForm }) => {
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

          let convertedAmount;
          try {
            convertedAmount = convertToWholeNumberBigInt(
              values.amount,
              selectedAsset?.decimals || 0
            );
          } catch (error) {
            return setErrors({
              password: error.message,
            });
          }

          const billsArr = selectedTransferKey
            ? [directlySelectedAsset]
            : billsList?.filter((bill: IBill) => bill.isDcBill !== true);

          const selectedBills = getOptimalBills(
            convertedAmount.toString(),
            billsArr as IBill[]
          );

          const newBearer = createNewBearer(values.address);

          const billsSumDifference =
            getBillsSum(selectedBills) - convertedAmount;

          const billToSplit =
            billsSumDifference !== 0n
              ? findClosestBigger(selectedBills, billsSumDifference.toString())
              : null;

          const billsToTransfer = billToSplit
            ? selectedBills?.filter((bill) => bill.id !== billToSplit?.id)
            : selectedBills;

          const splitBillAmount = billToSplit
            ? BigInt(billToSplit.value) - billsSumDifference
            : null;

          setIsSending(true);

          getBlockHeight(selectedAsset?.typeId === AlphaType).then(
            async (blockHeight) => {
              let transferType = TokensTransferType;
              let splitType = TokensSplitType;
              let systemId = TokensSystemId;
              let amountField = "targetValue";
              let bearerField = "newBearer";
              let transferField = "value";

              if (selectedAsset?.typeId === AlphaType) {
                transferType = AlphaTransferType;
                splitType = AlphaSplitType;
                systemId = AlphaSystemId;
                bearerField = "targetBearer";
                amountField = "amount";
                transferField = "targetValue";
              }

              billsToTransfer?.map(async (bill, idx) => {
                const transferData: IProofTx = {
                  systemId: systemId,
                  unitId: bill.id,
                  transactionAttributes: {
                    "@type": transferType,
                    newBearer: newBearer,
                    [transferField]: bill.value,
                    backlink: bill.txHash,
                  },
                  timeout: (blockHeight + timeoutBlocks).toString(),
                  ownerProof: "",
                };

                if (selectedAsset?.typeId !== AlphaType) {
                  transferData.transactionAttributes.type = bill.typeId;
                }

                const isLastTransaction =
                  Number(billsToTransfer?.length) === idx + 1 &&
                  !billToSplit &&
                  !splitBillAmount;

                handleValidation(
                  await transferOrderHash(transferData),
                  blockHeight,
                  transferData as ITransfer,
                  isLastTransaction,
                  bill.typeId
                );
              });

              if (billToSplit && splitBillAmount) {
                const splitData: IProofTx = {
                  systemId: systemId,
                  unitId: billToSplit.id,
                  transactionAttributes: {
                    "@type": splitType,
                    [amountField]: splitBillAmount.toString(),
                    [bearerField]: newBearer,
                    remainingValue: (
                      BigInt(billToSplit.value) - splitBillAmount
                    ).toString(),
                    backlink: billToSplit.txHash,
                  },
                  timeout: (blockHeight + timeoutBlocks).toString(),
                  ownerProof: "",
                };

                if (selectedAsset?.typeId !== AlphaType) {
                  splitData.transactionAttributes.type = billToSplit.typeId;
                }

                handleValidation(
                  await splitOrderHash(splitData),
                  blockHeight,
                  splitData as ITransfer,
                  true,
                  billToSplit.typeId
                );
              }
            }
          );

          const handleValidation = async (
            msgHash: Uint8Array,
            blockHeight: bigint,
            billData: ITransfer,
            isLastTransfer: boolean,
            billTypeId?: string
          ) => {
            const proof = await createOwnerProof(
              msgHash,
              hashingPrivateKey,
              hashingPublicKey
            );

            const finishTransaction = (billData: ITransfer) => {
              let dataWithProof = Object.assign(billData, {
                ownerProof: proof.ownerProof,
                timeout: (blockHeight + timeoutBlocks).toString(),
              });

              if (selectedAsset?.typeId !== AlphaType) {
                dataWithProof = { transactions: [dataWithProof] } as any;
              }

              proof.isSignatureValid &&
                makeTransaction(
                  dataWithProof,
                  selectedAsset?.typeId === AlphaType ? "" : values.address
                )
                  .then(() => {
                    setPreviousView(null);
                    const amount: string =
                      billData?.transactionAttributes?.amount ||
                      billData?.transactionAttributes?.targetValue ||
                      billData?.transactionAttributes?.value ||
                      "";
                    const fungibleSelectedAsset = account?.assets?.fungible
                      ?.filter(
                        (asset) => account?.activeNetwork === asset.network
                      )
                      .find(
                        (asset) => asset.typeId === values.assets.value?.typeId
                      ) as IBill | IFungibleAsset | undefined;

                    balanceAfterSending.current = balanceAfterSending.current
                      ? BigInt(balanceAfterSending.current) - BigInt(amount)
                      : BigInt(
                          (fungibleSelectedAsset as IFungibleAsset)?.amount ||
                            (fungibleSelectedAsset as IBill)?.value ||
                            ""
                        ) - BigInt(amount);
                  })
                  .finally(() => {
                    const handleTransferEnd = () => {
                      addPollingInterval();
                      setIsSending(false);
                      setSelectedTransferKey(null);
                      setIsActionsViewVisible(false);
                      resetForm();
                      setSelectedAsset(activeAsset);
                    };

                    if (isLastTransfer) {
                      handleTransferEnd();
                    }
                  });
            };

            if (selectedAsset?.typeId !== AlphaType) {
              await getTypeHierarchy(billTypeId || "")
                .then(async (hierarchy: ITypeHierarchy[]) => {
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
                  billData.transactionAttributes.invariantPredicateSignatures =
                    signatures;
                  finishTransaction(billData);
                })
                .catch(() => {
                  setIsSending(false);
                  setErrors({
                    password:
                      "Fetching token hierarchy for " + billTypeId + "failed",
                  });
                });
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
          const { handleSubmit, setFieldValue, errors, touched, values } =
            formikProps;

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
                                label: activeAsset?.name || activeAsset?.symbol,
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
                        value={base64ToHexPrefixed(selectedTransferKey)}
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
                        if (a?.name! < b?.name!) {
                          return -1;
                        }
                        if (a?.name! > b?.name!) {
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
                        label: asset.name,
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