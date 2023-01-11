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
  IAsset,
  IBill,
  IBlockStats,
  ILockedBill,
  IProofTx,
  ITransfer,
} from "../../types/Types";
import { useApp } from "../../hooks/appProvider";
import { useAuth } from "../../hooks/useAuth";
import { getBlockHeight, makeTransaction } from "../../hooks/requests";

import {
  extractFormikError,
  getKeys,
  base64ToHexPrefixed,
  timeoutBlocks,
  createOwnerProof,
  createNewBearer,
  findClosestBigger,
  getOptimalBills,
  getBillsSum,
} from "../../utils/utils";
import { splitOrderHash, transferOrderHash } from "../../utils/hashers";

function Send(): JSX.Element | null {
  const {
    setIsActionsViewVisible,
    account,
    billsList,
    lockedBills,
    selectedSendKey,
    setActionsView,
    setSelectedSendKey,
  } = useApp();
  const { vault, activeAccountId } = useAuth();
  const queryClient = useQueryClient();
  const defaultAsset = selectedSendKey
    ? {
        value: account?.assets
          .filter((asset) => account?.activeNetwork === asset.network)
          .find((asset) => asset.id === "ALPHA"),
        label: account?.assets
          .filter((asset) => account?.activeNetwork === asset.network)
          .find((asset) => asset.id === "ALPHA")?.name,
      }
    : "";
  const abBalance =
    account?.assets.find((asset: IAsset) => (asset.id = "ALPHA"))?.amount || 0;

  const [currentTokenId, setCurrentTokenId] = useState<any>(
    defaultAsset ? defaultAsset?.value : ""
  );

  const [balanceAfterSending, setBalanceAfterSending] = useState<number | null>(
    null
  );

  const pollingInterval = useRef<NodeJS.Timeout | null>(null);
  const initialBlockHeight = useRef<number | null | undefined>(null);

  const addPollingInterval = () => {
    initialBlockHeight.current = null;
    pollingInterval.current = setInterval(() => {
      queryClient.invalidateQueries(["balance", activeAccountId]);
      getBlockHeight().then((blockData) => {
        if (!initialBlockHeight?.current) {
          initialBlockHeight.current = blockData.blockHeight;
        }

        if (
          Number(initialBlockHeight?.current) + timeoutBlocks <
          blockData.blockHeight
        ) {
          pollingInterval.current && clearInterval(pollingInterval.current);
        }
      });
    }, 500);
  };

  useEffect(() => {
    if (abBalance === balanceAfterSending) {
      pollingInterval.current && clearInterval(pollingInterval.current);
      setBalanceAfterSending(null);
    } else if (!balanceAfterSending) {
      pollingInterval.current && clearInterval(pollingInterval.current);
    }
  }, [abBalance, balanceAfterSending]);

  return (
    <div className="w-100p">
      <Formik
        initialValues={{
          assets: defaultAsset,
          amount: 0,
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

          const billsArr = selectedSendKey
            ? ([
                billsList?.find((bill: IBill) => bill.id === selectedSendKey),
              ] as IBill[])
            : (billsList?.filter(
                (bill: IBill) =>
                  bill.isDCBill === false &&
                  !lockedBills?.find((b: ILockedBill) => b.billId === bill.id)
              ) as IBill[]);

          const selectedBills = getOptimalBills(values.amount, billsArr);
          const newBearer = createNewBearer(values.address);
          const billsSumDifference = getBillsSum(selectedBills) - values.amount;
          const billToSplit =
            billsSumDifference !== 0
              ? findClosestBigger(selectedBills, billsSumDifference)
              : null;
          const billsToTransfer = billToSplit
            ? selectedBills.filter((bill) => bill.id !== billToSplit?.id)
            : selectedBills;
          const splitBillAmount = billToSplit
            ? billToSplit?.value - billsSumDifference
            : null;

          getBlockHeight().then(async (blockData) => {
            billsToTransfer.map(async (bill, idx) => {
              const transferData: IProofTx = {
                systemId: "AAAAAA==",
                unitId: bill.id,
                transactionAttributes: {
                  "@type": "type.googleapis.com/rpc.TransferOrder",
                  newBearer: newBearer,
                  targetValue: bill.value.toString(),
                  backlink: bill.txHash,
                },
                timeout: blockData.blockHeight + timeoutBlocks,
                ownerProof: "",
              };

              const isLastTransaction =
                billsToTransfer.length === idx + 1 &&
                !billToSplit &&
                !splitBillAmount;

              handleValidation(
                await transferOrderHash(transferData),
                blockData,
                transferData as ITransfer,
                isLastTransaction
              );
            });

            if (billToSplit && splitBillAmount) {
              const splitData: IProofTx = {
                systemId: "AAAAAA==",
                unitId: billToSplit.id,
                transactionAttributes: {
                  "@type": "type.googleapis.com/rpc.SplitOrder",
                  amount: splitBillAmount,
                  targetBearer: newBearer,
                  remainingValue: billToSplit.value - splitBillAmount,
                  backlink: billToSplit.txHash,
                },
                timeout: blockData.blockHeight + timeoutBlocks,
                ownerProof: "",
              };

              handleValidation(
                await splitOrderHash(splitData),
                blockData,
                splitData as ITransfer,
                true
              );
            }

            setSelectedSendKey(null);
            setIsActionsViewVisible(false);
            resetForm();
          });

          const handleValidation = async (
            msgHash: Uint8Array,
            blockData: IBlockStats,
            billData: ITransfer,
            isLastTransfer: boolean
          ) => {
            const proof = await createOwnerProof(
              msgHash,
              hashingPrivateKey,
              hashingPublicKey
            );

            const dataWithProof = Object.assign(billData, {
              ownerProof: proof.ownerProof,
              timeout: blockData.blockHeight + timeoutBlocks,
            });

            proof.isSignatureValid &&
              makeTransaction(dataWithProof).then(() => {
                isLastTransfer && addPollingInterval();
                const amount: number = Number(
                  billData?.transactionAttributes?.amount ||
                    billData?.transactionAttributes?.targetValue
                );
                setBalanceAfterSending(
                  balanceAfterSending
                    ? balanceAfterSending - amount
                    : abBalance - amount
                );
              });
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
          amount: Yup.number()
            .positive("Value must be greater than 0.")
            .test(
              "test less than",
              `You don't have enough ` + currentTokenId.name + `'s`,
              (value) =>
                Number(value) <=
                Number(
                  billsList
                    .filter(
                      (bill: IBill) =>
                        bill.isDCBill === false &&
                        !lockedBills?.find(
                          (b: ILockedBill) => b.billId === bill.id
                        )
                    )
                    .reduce((acc: number, obj: IBill) => {
                      return acc + obj?.value;
                    }, 0)
                )
            ),
        })}
      >
        {(formikProps) => {
          const { handleSubmit, errors, touched, values } = formikProps;

          return (
            <form className="pad-24" onSubmit={handleSubmit}>
              <Form>
                <FormContent>
                  {selectedSendKey && (
                    <>
                      {selectedSendKey && (
                        <div className="t-medium-small">
                          You have selected a specific bill with a value of{" "}
                          {
                            billsList?.find(
                              (bill: IBill) => bill.id === selectedSendKey
                            )?.value
                          }
                          . You can deselect it by clicking{" "}
                          <Button
                            onClick={() => setSelectedSendKey(null)}
                            variant="link"
                          >
                            REMOVE BILL
                          </Button>{" "}
                          or select a new bill from the{" "}
                          <Button
                            onClick={() => {
                              setActionsView("Bills List");
                              setIsActionsViewVisible(true);
                              queryClient.invalidateQueries([
                                "billsList",
                                activeAccountId,
                              ]);
                            }}
                            variant="link"
                          >
                            BILLS LIST
                          </Button>{" "}
                          .
                        </div>
                      )}
                      <Spacer mt={16} />
                      <Textfield
                        id="selectedBillId"
                        name="selectedBillId"
                        label="SELECTED BILL ID"
                        type="selectedBillId"
                        value={base64ToHexPrefixed(selectedSendKey)}
                      />
                      <Spacer mb={16} />
                    </>
                  )}
                  <Select
                    label="Assets"
                    name="assets"
                    className={selectedSendKey ? "d-none" : ""}
                    options={account?.assets
                      .filter(
                        (asset) => account?.activeNetwork === asset.network
                      )
                      .sort((a: IAsset, b: IAsset) => {
                        if (a?.id! < b?.id!) {
                          return -1;
                        }
                        if (a?.id! > b?.id!) {
                          return 1;
                        }
                        return 0;
                      })
                      .map((asset: IAsset) => ({
                        value: asset,
                        label: asset.name,
                      }))}
                    onChange={(label, value) => setCurrentTokenId(value)}
                    error={extractFormikError(errors, touched, ["assets"])}
                  />
                  <Spacer mb={8} />
                  {selectedSendKey && (
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

                  <div className={selectedSendKey ? "d-none" : ""}>
                    <Textfield
                      id="amount"
                      name="amount"
                      label="Amount"
                      type="number"
                      error={extractFormikError(errors, touched, ["amount"])}
                      disabled={
                        !Boolean(values.assets) || Boolean(selectedSendKey)
                      }
                      value={
                        selectedSendKey &&
                        billsList?.find(
                          (bill: IBill) => bill.id === selectedSendKey
                        )?.value
                      }
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
                      !Boolean(values.assets) && !Boolean(selectedSendKey)
                    }
                  />
                </FormContent>
                <FormFooter>
                  <Button
                    big={true}
                    block={true}
                    type="submit"
                    variant="primary"
                  >
                    Send
                  </Button>
                </FormFooter>
              </Form>
            </form>
          );
        }}
      </Formik>
      {!selectedSendKey && (
        <div className="t-medium-small pad-24-h">
          To select a specific bill open your{" "}
          <Button
            small
            onClick={() => {
              setActionsView("Bills List");
              setIsActionsViewVisible(true);
              queryClient.invalidateQueries(["billsList", activeAccountId]);
            }}
            variant="link"
          >
            BILLS LIST
          </Button>{" "}
          and select it from bills options.
        </div>
      )}
    </div>
  );
}

export default Send;
