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
  IActiveAsset,
  ITransferForm,
} from "../../types/Types";
import { useApp } from "../../hooks/appProvider";
import { useAuth } from "../../hooks/useAuth";
import {
  getProof,
  splitBill,
  splitFungibleToken,
  transferBill,
  transferFungibleToken,
} from "../../hooks/requests";

import {
  extractFormikError,
  getKeys,
  base64ToHexPrefixed,
  invalidateAllLists,
  addDecimal,
  convertToWholeNumberBigInt,
  separateDigits,
  getTokensLabel,
  FeeCostEl,
  getFungibleAssetsAmount,
  isValidAddress,
  handleBillSelection,
  createEllipsisString,
} from "../../utils/utils";
import {
  AlphaType,
  FungibleListView,
  TransferFungibleView,
  TokenType,
} from "../../utils/constants";
import { Base16Converter } from "@alphabill/alphabill-js-sdk/lib/util/Base16Converter";

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

  const addPollingInterval = useCallback((txHash: Uint8Array, isAlpha: boolean) => {
    pollingInterval.current = setInterval(() => {
      invalidateAllLists(activeAccountId, fungibleActiveAsset.typeId, queryClient);
      getProof(txHash, isAlpha)
      .then((data) => {
          if(!data?.transactionProof){
            throw new Error('No proof was found!');
          }
          handleTransactionEnd();
        }
      ).catch(() => {
        throw new Error('Error fetching transaction proof')
      })
    }, 500);
  }, [activeAccountId, fungibleActiveAsset.typeId, handleTransactionEnd, queryClient]);

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

  const handleTransfer = useCallback( async(
      values: ITransferForm,
      setErrors: (errors: FormikErrors<ITransferForm>) => void
    ) => {
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

      if(!activeAsset.id){
        return setErrors({
          password: error || "Select an asset to transfer"
        })
      }

      setIsSending(true);

      const isAlpha = selectedAsset?.typeId === AlphaType;
    
    try {
      const decodedId = Base16Converter.decode(activeAsset.id);
      const recipient = Base16Converter.decode(values.address);

      const transferHash = isAlpha 
        ? await transferBill(hashingPrivateKey, recipient, decodedId)
        : await transferFungibleToken(hashingPrivateKey, recipient, decodedId)

      if(!transferHash){
        setIsSending(false);
        return setErrors({
          password: error || "Error occured during the transaction!"
        })
      }
      addPollingInterval(transferHash, isAlpha);
    } catch(error) {
      return setErrors({
        password: (error as Error).message || "Error occured during the transaction"
      })
    }
  }, [account?.idx, activeAsset.id, addPollingInterval, selectedAsset?.typeId, vault])


  const handleSplit =  useCallback( async(
    values: ITransferForm,
    setErrors: (errors: FormikErrors<ITransferForm>) => void
  ) => {
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

    const { billToSplit } = handleBillSelection(convertedAmount.toString(), billsArr as IBill[]);

    if(!billToSplit) {
      return setErrors({
        password: error || "Select an asset to transfer"
      })
    }

    setIsSending(true);

    const isAlpha = selectedAsset?.typeId === AlphaType;

    try {
      const decodedId = Base16Converter.decode(billToSplit?.id);
      const recipient = Base16Converter.decode(values.address);

      const splitHash = isAlpha
        ? await splitBill(hashingPrivateKey, convertedAmount, recipient, decodedId)
        : await splitFungibleToken(hashingPrivateKey, convertedAmount, recipient, decodedId)

      if(!splitHash){
        return setErrors({
          password: error || "Error fetching transaction hash" 
        })
      }
      addPollingInterval(splitHash, isAlpha);
    } catch(error) {
      setIsSending(false);
      return setErrors({
        password: (error as Error).message || "Error occured during the transaction"
      })
    }
  }, [account?.idx, addPollingInterval, directlySelectedAsset, selectedAsset?.decimals, selectedAsset?.typeId, selectedTransferKey, unlockedBillsList, vault])

  if (!isActionsViewVisible) return <div></div>;

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
          directlySelectedAsset 
            ? handleTransfer(values, setErrors) 
            : handleSplit(values, setErrors)
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
