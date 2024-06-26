import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "react-query";

import {
  FeeCostEl,
  getBillsAndTargetUnitToConsolidate,
  getTokensLabel,
} from "../../../utils/utils";
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

  const { billsToConsolidate, consolidationTargetUnit } =
    getBillsAndTargetUnitToConsolidate(billsList);

  const isFeeForSwap =
    DCBills.length >= 1 && BigInt(feeCreditBills?.ALPHA?.value || "") >= 1n;

  const isFeeCredit =
    DCBills.length >= 1
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
  const [haveDCBillsUpdated, setHaveDCBillsUpdated] = useState<boolean>(false);
  const [collectorBillsCount, setCollectorBillsCount] = useState<number | null>(
    null
  );
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
          setHaveDCBillsUpdated(false);
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

      if (
        error ||
        !hashingPublicKey ||
        !hashingPrivateKey ||
        !consolidationTargetUnit
      ) {
        return;
      }

      handleSwapRequest(
        hashingPublicKey,
        hashingPrivateKey,
        DCBills,
        account,
        activeAccountId
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
    if (DCBills?.length >= 1 && isConsolidationLoading) {
      setHaveDCBillsUpdated(true);
    }

    if (
      password &&
      collectorBillsCount === DCBills?.length &&
      isConsolidationLoading &&
      haveDCBillsUpdated
    ) {
      handleSwap(password);
      setCollectorBillsCount(null);
    }

    if (
      DCBills?.length < 1 &&
      isConsolidationLoading === true &&
      haveDCBillsUpdated
    ) {
      swapInterval.current && clearInterval(swapInterval.current);
      swapTimer.current && clearTimeout(swapTimer.current);
      setIsConsolidationLoading(false);
      setHaveDCBillsUpdated(false);
    }
  }, [
    handleSwap,
    haveDCBillsUpdated,
    isConsolidationLoading,
    DCBills,
    password,
    account?.idx,
    vault,
    activeAccountId,
    account,
    collectorBillsCount,
  ]);

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
                      (billsToConsolidate?.length < 1 && DCBills.length <= 0) ||
                      isConsolidationLoading ||
                      !isFeeCredit
                    }
                    onClick={() => {
                      setCollectorBillsCount(billsToConsolidate.length);

                      if (password) {
                        handleDC(
                          addInterval,
                          setIsConsolidationLoading,
                          handleSwap,
                          account,
                          password,
                          vault,
                          billsToConsolidate,
                          DCBills,
                          activeAccountId,
                          consolidationTargetUnit as IBill
                        );
                      } else {
                        setIsPasswordFormVisible("handleDC");
                      }
                    }}
                  >
                    {(isFeeCredit && billsToConsolidate?.length >= 1) ||
                    (isFeeCredit && DCBills.length >= 1)
                      ? "Consolidate Bills"
                      : billsToConsolidate?.length < 1 && isFeeCredit
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
              handleSwap,
              account,
              formPassword,
              vault,
              billsToConsolidate,
              DCBills,
              activeAccountId,
              consolidationTargetUnit as IBill
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
