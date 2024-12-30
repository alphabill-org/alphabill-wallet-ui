import { useCallback, useRef, useState } from "react";
import { useQueryClient } from "react-query";
import { useApp } from "../../../hooks/appProvider";
import { useAuth } from "../../../hooks/useAuth";

import { FeeCostEl, getBillsAndTargetUnitToConsolidate, getTokensLabel } from "../../../utils/utils";
import { swapBill } from "../../../hooks/requests";
import { getKeys } from "../../../utils/utils";

import { DCTransfersLimit, AlphaType, FungibleListView } from "../../../utils/constants";
import { IBill } from "../../../types/Types";
import { Base16Converter } from "@alphabill/alphabill-js-sdk/lib/util/Base16Converter";

import Spacer from "../../../components/Spacer/Spacer";
import Button from "../../../components/Button/Button";
import BillsListPopups from "./BillsListPopups";
import AssetsList from "../../../components/AssetsList/AssetsList";

function BillsList(): JSX.Element | null {
  const [password, setPassword] = useState<string>("");
  const { billsList, account, setPreviousView, feeCreditBills } = useApp();

  // Bills lists
  const sortedListByValue: IBill[] = billsList?.sort(
    (a: IBill, b: IBill) => Number(a.value) - Number(b.value)
  );

  const { billsToConsolidate, consolidationTargetUnit } =
    getBillsAndTargetUnitToConsolidate(billsList);

  const isFeeForSwap =
    sortedListByValue 
      ? sortedListByValue.length >= 1 && BigInt(feeCreditBills?.ALPHA?.value || "") >= 1n
      : false;

  const isFeeCredit =
    sortedListByValue && sortedListByValue.length >= 2 
      ? isFeeForSwap
      : BigInt(feeCreditBills?.ALPHA?.value || "") >=
        BigInt(billsToConsolidate?.length) + 1n;

  //Popup hooks
  const [isPasswordFormVisible, setIsPasswordFormVisible] = useState<
    "handleDC" | null | undefined
  >();
  // Swap related hooks
  const [isConsolidationLoading, setIsConsolidationLoading] =
    useState<boolean>(false);
  // Global hooks
  const { vault, activeAccountId, activeAsset } = useAuth();
  const queryClient = useQueryClient();
  const tokenLabel = getTokensLabel(activeAsset.typeId);

  // Refs
  const swapInterval = useRef<NodeJS.Timeout | null>(null);

  const removePollingInterval = useCallback(() => {
    swapInterval.current && clearInterval(swapInterval.current);
    setIsConsolidationLoading(false);
  }, [])

  const addPollingInterval = useCallback(async(
    txHash: Uint8Array
  ) => {
    try {
      queryClient.invalidateQueries(["billsList", activeAccountId]);
      queryClient.invalidateQueries(["balance", activeAccountId]);

      removePollingInterval()
    } catch(error) {
      removePollingInterval()
      throw new Error("Error fetching transaction proof");
    }
  }, [activeAccountId, queryClient, removePollingInterval])

  const handleSwap = useCallback(async(
    password: string
  ) => {
    const {error, hashingPrivateKey, hashingPublicKey} = getKeys(
      password,
      Number(account?.idx),
      vault
    );

    if (error || !hashingPrivateKey || !hashingPublicKey) {
      throw new Error("Missing hashing keys");
    }

    if (!consolidationTargetUnit) {
      throw new Error("Missing target unit");
    }

    setIsConsolidationLoading(true)

    const billsToSwapIds: Uint8Array[] = [];

    const targetBillId = Base16Converter.decode(consolidationTargetUnit?.id);

    sortedListByValue.forEach((bill) => {
      billsToSwapIds.push(Base16Converter.decode(bill.id))
    })

    try {
      const txHash = await swapBill(hashingPrivateKey, targetBillId, billsToSwapIds);
      if (!txHash) {
        throw new Error("Transaction hash is missing");
      }

      addPollingInterval(txHash);
    } catch(error) {
      throw new Error("Error while consolidating");
    }
  }, [account?.idx, addPollingInterval, consolidationTargetUnit, sortedListByValue, vault])

  return (
    <>
      <div className="dashboard__info-col active relative bills-list">
        {activeAsset.typeId === AlphaType && (
          <>
            <Spacer mt={16} />
            <div className="t-medium-small pad-16-h">
              To consolidate your bills into one larger bill click on the{" "}
              <b>Consolidate Bills</b> button.
              {Number(billsList?.length) > DCTransfersLimit &&
                " There is a limit of " +
                  DCTransfersLimit +
                  " bills per consolidation."}
            </div>
            <div className="t-medium-small pad-16-h">
              {activeAsset.typeId === AlphaType && (
                <>
                  {" "}
                  <Spacer mt={16} />
                  <Button
                    className="w-100p"
                    small
                    type="button"
                    variant="primary"
                    working={isConsolidationLoading}
                    disabled={
                      (billsToConsolidate?.length < 1) ||
                      isConsolidationLoading 
                    }
                    onClick={() => {
                      if (password) {
                        handleSwap(
                          password
                        );
                      } else {
                        setIsPasswordFormVisible("handleDC");
                      }
                    }}
                  >
                    {(isFeeCredit && sortedListByValue?.length >= 2) ||
                    (isFeeCredit && sortedListByValue?.length >= 2)
                      ? "Consolidate Bills"
                      : sortedListByValue?.length < 2 && isFeeCredit
                      ? "At least 2 bills needed for consolidation"
                      : "Not enough fee credit for consolidation"}
                  </Button>
                  <FeeCostEl />
                </>
              )}
              <Spacer mt={8} />
            </div>
          </>
        )}
        <Spacer mt={24} />
        {Number(
          sortedListByValue?.filter((b: IBill) => !Boolean(b.targetUnitId))
            ?.length
        ) >= 1 && (
          <AssetsList
            assetList={sortedListByValue?.filter(
              (b: IBill) => !Boolean(b.targetUnitId)
            )}
            DCBills={sortedListByValue}
            consolidationTargetUnit={consolidationTargetUnit}
            isTypeListItem
            isTransferButton
            isHoverDisabled
            onSendClick={() => setPreviousView(FungibleListView)}
          />
        )}
        <Spacer mt={32} />
      </div>
      {!isConsolidationLoading && (
        <BillsListPopups
          setIsPasswordFormVisible={setIsPasswordFormVisible}
          setPassword={setPassword}
          handleDC={(formPassword) =>
            handleSwap(
              formPassword
            )
          }
          account={account}
          activeBill={activeAsset}
          isPasswordFormVisible={isPasswordFormVisible}
          sortedListByValue={sortedListByValue}
          tokenLabel={tokenLabel}
        />
      )}
    </>
  );
}

export default BillsList;
