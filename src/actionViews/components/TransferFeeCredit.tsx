import { useCallback, useEffect, useRef, useState } from "react";
import { Formik, FormikErrors } from "formik";
import * as Yup from "yup";
import { Form, FormFooter, FormContent } from "../../components/Form/Form";
import { useQueryClient } from "react-query";

import Button from "../../components/Button/Button";
import Spacer from "../../components/Spacer/Spacer";
import Textfield from "../../components/Textfield/Textfield";
import Select from "../../components/Select/Select";

import { IBill } from "../../types/Types";
import { useApp } from "../../hooks/appProvider";
import { useAuth } from "../../hooks/useAuth";
import { addFeeCredit } from "../../hooks/requests";
import { AlphaType, AlphaDecimals, MaxTransactionFee, TokenType } from "../../utils/constants";
import { Base16Converter } from "@alphabill/alphabill-js-sdk/lib/util/Base16Converter";
import { IFeeCreditForm } from "../../types/Types";

import {
  extractFormikError,
  getKeys,
  getBillsSum,
  invalidateAllLists,
  convertToWholeNumberBigInt,
  FeeCostEl,
  addDecimal,
  handleBillSelection,
} from "../../utils/utils"
import { TransactionStatus } from '@alphabill/alphabill-js-sdk/lib/transaction/record/TransactionStatus.js';
import {
  TransactionRecordWithProof
} from "@alphabill/alphabill-js-sdk/lib/transaction/record/TransactionRecordWithProof";
import {
  TransferFeeCreditTransactionOrder
} from "@alphabill/alphabill-js-sdk/lib/fees/transactions/TransferFeeCredit";

export default function TransferFeeCredit(): JSX.Element | null {
  const {
    setIsActionsViewVisible,
    isActionsViewVisible,
    account,
    unlockedBillsList,
    setPreviousView
  } = useApp();
  const { vault, activeAccountId } = useAuth();
  const queryClient = useQueryClient();
  const feeAssets = [
    {
      value: AlphaType,
      label: "ALPHA fee credit",
    },
    {
      value: TokenType,
      label: "User Token fee credit",
    },
  ];

  const defaultAsset: {
    value: string;
    label: string;
  } = feeAssets[0];
  const billsArr = unlockedBillsList
    ?.filter((bill: any) => Number(bill.value) >= 1)
    ?.filter((bill: IBill) => !Boolean(bill.targetUnitId));
  const pollingInterval = useRef<NodeJS.Timeout | null>(null);
  const isFeeCreditAdded = useRef<boolean>(false);

  const [isSending, setIsSending] = useState<boolean>(false);
  const [minFeeTransferAmount, setMinFeeTransferAmount] = useState<string | null>(null);
  const [transferredBillsCount, setTransferredBillsCount] = useState<number>(0);

  const getAvailableAmount = useCallback(
    (decimals: number) =>
      addDecimal(getBillsSum(billsArr).toString() || "0", Number(decimals)),
    [billsArr]
  );

  const [availableAmount, setAvailableAmount] = useState<string>(
    getAvailableAmount(AlphaDecimals || 0)
  );

  useEffect(() => {
    setAvailableAmount(getAvailableAmount(AlphaDecimals || 0));
  }, [getAvailableAmount, isActionsViewVisible]);

  const removePollingInterval = useCallback(() => {
    pollingInterval.current 
      && clearInterval(pollingInterval.current);
    setIsSending(false);
    isFeeCreditAdded.current 
      && setIsActionsViewVisible(false)

    isFeeCreditAdded.current = false;
  }, [setIsActionsViewVisible])

  const addPollingInterval = useCallback((txProof: TransactionRecordWithProof<TransferFeeCreditTransactionOrder>) => {
    pollingInterval.current = setInterval(() => {
      queryClient.invalidateQueries(["feeBillsList", activeAccountId])
      invalidateAllLists(activeAccountId, AlphaType, queryClient);

      if (txProof.transactionRecord.serverMetadata.successIndicator === TransactionStatus.Successful) {
        isFeeCreditAdded.current = true;
      } else {
        throw new Error("Transaction failed");
      }

      removePollingInterval();
    }, 1000)
  }, [activeAccountId, queryClient, removePollingInterval])

  const handleSubmit = useCallback( async(
    values: IFeeCreditForm, 
    setErrors: (errors: FormikErrors<IFeeCreditForm>) => void
  ) => {
    const isAlphaTransaction = values.assets.value === AlphaType;
    const {error, hashingPrivateKey, hashingPublicKey} = getKeys(
      values.password,
      Number(account?.idx),
      vault
    )
    
    pollingInterval.current && clearInterval(pollingInterval.current);

    if (error || !hashingPrivateKey || !hashingPublicKey) {
      return setErrors({
        password: error || "Hashing keys are missing"
      });
    }

    setIsSending(true);

    let convertedAmount: bigint;

    try {
      convertedAmount = convertToWholeNumberBigInt(
        values.amount,
        AlphaDecimals
      )
    } catch (error) {
      setIsSending(false);
      return setErrors({
        password: (error as Error).message
      })
    }

    const { optimalBills } = handleBillSelection(convertedAmount.toString(), billsArr)
    const optimalBill = Base16Converter.decode(optimalBills[0].id)

    try {
      const txProof = await addFeeCredit(hashingPrivateKey, convertedAmount, optimalBill, isAlphaTransaction);
      setPreviousView(null);
      addPollingInterval(txProof);
    } catch (error) {
      removePollingInterval()
      return setErrors({
        password: (error as Error).message || "Error occurred during the transaction"
      })
    }
  }, [account?.idx, addPollingInterval, billsArr, removePollingInterval, setPreviousView, vault]); 

  if (!isActionsViewVisible) return <div></div>;

  return (
    <div className="w-100p">
      <Formik
        initialValues={{
          amount: "",
          assets: defaultAsset,
          password: "",
        }}
        onSubmit={async (values, { setErrors }) => handleSubmit(values, setErrors)}
        validationSchema={Yup.object().shape({
          assets: Yup.object().required("Selected asset is required"),
          password: Yup.string().required("Password is required"),
          amount: Yup.string()
            .required("Amount is required")
            .test(
              "test exceeds assets",
              "Amount with fees exceeds available assets",
              (value: string | undefined) => {
                setTransferredBillsCount(0);
                let convertedAmount: bigint;
                if (!value) return false;

                try {
                  convertedAmount = convertToWholeNumberBigInt(
                    value,
                    AlphaDecimals
                  );
                } catch (error) {
                  return false;
                }

                const { optimalBills } = handleBillSelection(
                  convertedAmount.toString(),
                  billsArr
                );

                if (optimalBills.length < 1) return false;

                setTransferredBillsCount(optimalBills.length);

                return (
                  convertToWholeNumberBigInt(value || "", AlphaDecimals) <=
                  convertToWholeNumberBigInt(availableAmount, AlphaDecimals)
                );
              }
            )
            .test(
              "test less than",
              "Min amount with fees is " + minFeeTransferAmount + " ALPHA",
              (value: string | undefined) => {
                let convertedAmount: bigint;
                if (!value) return false;

                try {
                  convertedAmount = convertToWholeNumberBigInt(
                    value,
                    AlphaDecimals
                  );
                } catch (error) {
                  return false;
                }

                const { optimalBills } = handleBillSelection(
                  convertedAmount.toString(),
                  billsArr
                );

                if (optimalBills.length < 1) return false;

                const minAmount =
                  MaxTransactionFee * 3n * BigInt(optimalBills.length);

                setMinFeeTransferAmount(
                  addDecimal(minAmount.toString(), Number(AlphaDecimals))
                );

                return convertedAmount >= minAmount;
              }
            ),
        })}
      >
        {(formikProps) => {
          const { handleSubmit, errors, touched } = formikProps;

          return (
            <form className="pad-24" onSubmit={handleSubmit}>
              <Form>
                <FormContent>
                  <Select
                    label=""
                    name="assets"
                    options={feeAssets}
                    defaultValue={defaultAsset}
                    error={extractFormikError(errors, touched, ["assets"])}
                  />
                  <Spacer mb={8} />
                  <Textfield
                    id="amount"
                    name="amount"
                    label="Amount"
                    desc={
                      availableAmount +
                      " ALPHA available" +
                      (transferredBillsCount >= 1
                        ? " - fee for transfer " +
                          addDecimal(
                            (transferredBillsCount * 2).toString(),
                            AlphaDecimals
                          ).toString() +
                          " ALPHA"
                        : "")
                    }
                    type="text"
                    floatingFixedPoint={AlphaDecimals}
                    error={extractFormikError(errors, touched, ["amount"])}
                    isNumberFloat
                    removeApostrophes
                  />
                  <Spacer mb={8} />
                  <Textfield
                    id="password"
                    name="password"
                    label="Password"
                    type="password"
                    error={extractFormikError(errors, touched, ["password"])}
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
                    Transfer credit
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
