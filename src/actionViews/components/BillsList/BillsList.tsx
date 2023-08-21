import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "react-query";

import { FeeCostEl, getTokensLabel } from "../../../utils/utils";
import {
  DCTransfersLimit,
  SwapTimeout,
  AlphaType,
  FungibleListView,
} from "../../../utils/constants";
import { IBill } from "../../../types/Types";
import { useApp } from "../../../hooks/appProvider";
import { useAuth } from "../../../hooks/useAuth";
import Spacer from "../../../components/Spacer/Spacer";
import Button from "../../../components/Button/Button";
import { getRoundNumber } from "../../../hooks/requests";
import BillsListPopups from "./BillsListPopups";
import { handleDC, handleSwapRequest } from "./BillsListConsolidation";
import { getKeys, sortBillsByID } from "../../../utils/utils";
import AssetsList from "../../../components/AssetsList/AssetsList";

function BillsList(): JSX.Element | null {
  const [password, setPassword] = useState<string>("");
  const { billsList, account, setPreviousView, feeCreditBills } = useApp();

  // Bills lists
  const sortedListByValue = billsList?.sort(
    (a: IBill, b: IBill) => Number(a.value) - Number(b.value)
  );

  const DCBills = useMemo(
    () =>
      sortedListByValue
        ? sortBillsByID(sortedListByValue)?.filter((b: IBill) =>
            Boolean(b.targetUnitId)
          )
        : [],
    [sortedListByValue]
  );

  const collectableBills =
    billsList?.filter((b: IBill) => !Boolean(b.targetUnitId)) || [];

  const targetIds = DCBills?.map((item) => item.targetUnitId);
  const consolidationTargetUnit =
    collectableBills?.find((bill: IBill) => targetIds.includes(bill.id)) ||
    collectableBills?.[0];

  const billsToConsolidate = collectableBills?.filter(
    (b: IBill) => b.id !== consolidationTargetUnit.id
  );

  const isFeeCredit = Number(feeCreditBills?.ALPHA?.value) >= DCBills.length;

  //Popup hooks
  const [isPasswordFormVisible, setIsPasswordFormVisible] = useState<
    "handleDC" | null | undefined
  >();
  // Swap related hooks
  const [isConsolidationLoading, setIsConsolidationLoading] =
    useState<boolean>(false);
  const [hasSwapBegun, setHasSwapBegun] = useState<boolean>(false);
  // Global hooks
  const { vault, activeAccountId, activeAsset } = useAuth();
  const queryClient = useQueryClient();
  const tokenLabel = getTokensLabel(activeAsset.typeId);

  // Refs
  const swapInterval = useRef<NodeJS.Timeout | null>(null);
  const swapTimer = useRef<NodeJS.Timeout | null>(null);
  const initialRoundNumber = useRef<bigint | null>(null);

  // Bills list functions
  const addInterval = () => {
    initialRoundNumber.current = null;
    swapInterval.current = setInterval(() => {
      queryClient.invalidateQueries(["billsList", activeAccountId]);
      queryClient.invalidateQueries(["balance", activeAccountId]);
      getRoundNumber(activeAsset?.typeId === AlphaType).then((roundNumber) => {
        if (!initialRoundNumber || !initialRoundNumber?.current) {
          initialRoundNumber.current = roundNumber;
        }

        if (initialRoundNumber?.current + SwapTimeout < roundNumber) {
          swapInterval.current && clearInterval(swapInterval.current);
          setIsConsolidationLoading(false);
          setHasSwapBegun(false);
        }
      });
    }, 1000);
  };

  const handleSwap = useCallback(
    (formPassword?: string) => {
      const { error, hashingPrivateKey, hashingPublicKey } = getKeys(
        formPassword || password,
        Number(account?.idx),
        vault
      );

      if (error || !hashingPublicKey || !hashingPrivateKey) {
        return;
      }

      setHasSwapBegun(true);

      handleSwapRequest(
        hashingPublicKey,
        hashingPrivateKey,
        DCBills,
        account,
        activeAccountId,
        consolidationTargetUnit
      );
    },
    [
      DCBills,
      account,
      password,
      vault,
      activeAccountId,
      consolidationTargetUnit,
    ]
  );

  // Effects
  useEffect(() => {
    if (Number(DCBills?.length) >= 1 && password && !hasSwapBegun) {
      handleSwap(password);
    }
  }, [
    handleSwap,
    hasSwapBegun,
    isConsolidationLoading,
    DCBills,
    password,
    account?.idx,
    vault,
    activeAccountId,
    account,
  ]);

  useEffect(() => {
    if (
      Number(DCBills?.length) < 1 &&
      isConsolidationLoading === true &&
      hasSwapBegun === true
    ) {
      swapInterval.current && clearInterval(swapInterval.current);
      swapTimer.current && clearTimeout(swapTimer.current);
      setIsConsolidationLoading(false);
      setHasSwapBegun(false);
    }
  }, [isConsolidationLoading, DCBills, hasSwapBegun, activeAccountId]);

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
                      (billsToConsolidate?.length <= 1 &&
                        DCBills.length <= 0) ||
                      isConsolidationLoading ||
                      !isFeeCredit
                    }
                    onClick={() => {
                      if (password) {
                        handleDC(
                          addInterval,
                          setIsConsolidationLoading,
                          setHasSwapBegun,
                          handleSwap,
                          account,
                          password,
                          vault,
                          billsToConsolidate,
                          DCBills,
                          activeAccountId,
                          consolidationTargetUnit
                        );
                      } else {
                        setIsPasswordFormVisible("handleDC");
                      }
                    }}
                  >
                    {(isFeeCredit && billsToConsolidate?.length > 1) ||
                    (isFeeCredit && DCBills.length >= 1)
                      ? "Consolidate Bills"
                      : billsToConsolidate?.length <= 1 && isFeeCredit
                      ? "At lest three bills needed for consolidation"
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
            DCBills={DCBills}
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
            handleDC(
              addInterval,
              setIsConsolidationLoading,
              setHasSwapBegun,
              handleSwap,
              account,
              formPassword,
              vault,
              billsToConsolidate,
              DCBills,
              activeAccountId,
              consolidationTargetUnit
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
