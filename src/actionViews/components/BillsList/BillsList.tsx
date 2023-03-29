import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "react-query";
import { isString } from "lodash";

import { addDecimal, getTokensLabel } from "../../../utils/utils";
import {
  DCTransfersLimit,
  swapTimeout,
  AlphaDecimalPlaces,
  AlphaType,
} from "../../../utils/constants";
import { IBill } from "../../../types/Types";
import { useApp } from "../../../hooks/appProvider";
import { useAuth } from "../../../hooks/useAuth";
import Spacer from "../../../components/Spacer/Spacer";
import Button from "../../../components/Button/Button";
import { getBlockHeight, getProof } from "../../../hooks/requests";
import { useLocalStorage } from "../../../hooks/useLocalStorage";
import { Verify } from "../../../utils/validators";
import BillsListItem from "./BillsListItem";
import BillsListPopups from "./BillsListPopups";
import { handleDC, handleSwapRequest } from "./BillsListConsolidation";
import {
  getKeys,
  base64ToHexPrefixed,
  sortBillsByID,
} from "../../../utils/utils";

function BillsList(): JSX.Element | null {
  const [password, setPassword] = useState<string>("");
  const {
    billsList,
    account,
    setActionsView,
    setIsActionsViewVisible,
    setSelectedSendKey,
  } = useApp();
  // Bills lists
  const sortedListByValue = billsList?.sort(
    (a: IBill, b: IBill) => Number(a.value) - Number(b.value)
  );

  const DCBills = useMemo(
    () =>
      sortedListByValue
        ? sortBillsByID(sortedListByValue)?.filter((b: IBill) => b.isDcBill)
        : [],
    [sortedListByValue]
  );

  //Popup hooks
  const [isPasswordFormVisible, setIsPasswordFormVisible] = useState<
    "proofCheck" | "handleDC" | null | undefined
  >();
  const [activeBill, setActiveBill] = useState<IBill>(sortedListByValue?.[0]);
  const [isProofVisible, setIsProofVisible] = useState<boolean>(false);
  const [visibleBillSettingID, setVisibleBillSettingID] = useState<
    string | null
  >(null);

  // Swap related hooks
  const [isConsolidationLoading, setIsConsolidationLoading] =
    useState<boolean>(false);
  const [proofCheckStatus, setProofCheckStatus] = useState<
    string | null | undefined
  >();
  const [hasSwapBegun, setHasSwapBegun] = useState<boolean>(false);

  // Global hooks
  const { vault, activeAccountId, activeAsset } = useAuth();
  const [lastNonceIDsLocal, setLastNonceIDsLocal] = useLocalStorage(
    "ab_last_nonce",
    null
  );
  const lastNonceIDs = useMemo(
    () =>
      lastNonceIDsLocal
        ? isString(lastNonceIDsLocal)
          ? JSON.parse(lastNonceIDsLocal)
          : lastNonceIDsLocal
        : {},
    [lastNonceIDsLocal]
  );
  const queryClient = useQueryClient();
  const tokenLabel = getTokensLabel(activeAsset.typeId);

  // Refs
  const swapInterval = useRef<NodeJS.Timeout | null>(null);
  const swapTimer = useRef<NodeJS.Timeout | null>(null);
  const initialBlockHeight = useRef<bigint | null>(null);
  let DCDenomination: string | null = null;

  // Bills list functions
  const handleProof = (bill: IBill) => {
    password
      ? getProof(base64ToHexPrefixed(bill.id)).then(async (data) => {
          const { error, hashingPrivateKey, hashingPublicKey } = getKeys(
            password,
            Number(account.idx),
            vault
          );

          if (error || !hashingPublicKey || !hashingPrivateKey) {
            return;
          }

          data?.bills[0] &&
            setProofCheckStatus(
              await Verify(
                data.bills[0],
                bill,
                hashingPrivateKey,
                hashingPublicKey
              )
            );
          await setIsProofVisible(true);
        })
      : setIsPasswordFormVisible("proofCheck");
  };

  const addInterval = () => {
    initialBlockHeight.current = null;
    swapInterval.current = setInterval(() => {
      queryClient.invalidateQueries(["billsList", activeAccountId]);
      queryClient.invalidateQueries(["balance", activeAccountId]);
      getBlockHeight(activeAsset?.typeId === AlphaType).then((blockHeight) => {
        if (!initialBlockHeight || !initialBlockHeight?.current) {
          initialBlockHeight.current = blockHeight;
        }

        if (initialBlockHeight.current + swapTimeout < blockHeight) {
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
        Number(account.idx),
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
        lastNonceIDs,
        activeAsset
      );
    },
    [
      DCBills,
      account,
      lastNonceIDs,
      password,
      vault,
      activeAccountId,
      activeAsset,
    ]
  );

  // Effects
  useEffect(() => {
    if (
      Number(DCBills?.length) >= 1 &&
      DCBills?.length === lastNonceIDs?.[activeAccountId]?.length &&
      password &&
      !hasSwapBegun
    ) {
      handleSwap(password);
    }
  }, [
    handleSwap,
    hasSwapBegun,
    isConsolidationLoading,
    DCBills,
    lastNonceIDs,
    password,
    account.idx,
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

      let remainingNonce = lastNonceIDs;
      delete remainingNonce?.[activeAccountId];
      setLastNonceIDsLocal(JSON.stringify(remainingNonce));
    }
  }, [
    isConsolidationLoading,
    DCBills,
    lastNonceIDs,
    hasSwapBegun,
    setLastNonceIDsLocal,
    activeAccountId,
  ]);

  return (
    <>
      <div className="dashboard__info-col active relative bills-list">
        {activeAsset.typeId === AlphaType && (
          <>
            <Spacer mt={16} />
            <div className="t-medium-small pad-24-h">
              To consolidate your bills into one larger bill click on the{" "}
              <b>Consolidate Bills</b> button.
              {Number(billsList?.length) > DCTransfersLimit &&
                " There is a limit of " +
                  DCTransfersLimit +
                  " bills per consolidation."}
            </div>

            <div>
              {Number(DCBills?.length) > 0 && (
                <>
                  <Spacer mt={16} />
                  <div className="t-medium pad-24-h c-primary">
                    BILLS READY FOR CONSOLIDATION
                  </div>
                  <Spacer mt={3} />
                </>
              )}

              {DCBills?.map((bill: IBill, idx: number) => {
                const isNewDenomination = DCDenomination !== bill.value && true;
                DCDenomination = bill.value;

                return (
                  <div key={bill.id + idx}>
                    {isNewDenomination && (
                      <>
                        {idx !== 0 && <Spacer mt={8} />}
                        <div className="t-medium-small t-bold pad-24-h flex flex-align-c flex-justify-sb">
                          Denomination:{" "}
                          {addDecimal(
                            bill.value,
                            activeAsset.typeId === AlphaType
                              ? AlphaDecimalPlaces
                              : bill?.decimals || 0
                          )}
                        </div>
                        <Spacer mb={2} />
                      </>
                    )}
                    <div
                      key={bill.id}
                      className="dashboard__info-item-wrap small"
                    >
                      <div className="dashboard__info-item-bill">
                        <div className="flex t-small t-bold c-light pad-8-t">
                          <span className="pad-8-r">ID:</span>{" "}
                          <span className="t-ellipsis">
                            {base64ToHexPrefixed(bill.id)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="t-medium-small pad-24-h">
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
                      (billsList?.length <= 1 && DCBills.length <= 0) ||
                      isConsolidationLoading
                    }
                    onClick={() => {
                      if (password) {
                        handleDC(
                          addInterval,
                          setIsConsolidationLoading,
                          setLastNonceIDsLocal,
                          setHasSwapBegun,
                          handleSwap,
                          account,
                          password,
                          vault,
                          billsList,
                          DCBills,
                          lastNonceIDs,
                          activeAccountId,
                          activeAsset
                        );
                      } else {
                        setIsPasswordFormVisible("handleDC");
                      }
                    }}
                  >
                    Consolidate Bills
                  </Button>
                </>
              )}
            </div>
          </>
        )}

        {Number(
          sortedListByValue?.filter(
            (b: IBill) =>
              b.isDcBill !== true
          )?.length
        ) >= 1 && (
          <BillsListItem
            filteredList={sortedListByValue?.filter(
              (b: IBill) =>
                b.isDcBill !== true
            )}
            setVisibleBillSettingID={setVisibleBillSettingID}
            visibleBillSettingID={visibleBillSettingID}
            setActiveBill={setActiveBill}
            setIsProofVisible={(bill) => {
              handleProof(bill);
            }}
            setActionsView={setActionsView}
            setIsActionsViewVisible={setIsActionsViewVisible}
            setSelectedSendKey={setSelectedSendKey}
            activeAsset={activeAsset}
          />
        )}
        <Spacer mt={32} />
      </div>
      {!isConsolidationLoading && (
        <BillsListPopups
          setVisibleBillSettingID={setVisibleBillSettingID}
          setIsProofVisible={setIsProofVisible}
          setProofCheckStatus={setProofCheckStatus}
          setIsPasswordFormVisible={setIsPasswordFormVisible}
          setPassword={setPassword}
          handleDC={(formPassword) =>
            handleDC(
              addInterval,
              setIsConsolidationLoading,
              setLastNonceIDsLocal,
              setHasSwapBegun,
              handleSwap,
              account,
              formPassword,
              vault,
              billsList,
              DCBills,
              lastNonceIDs,
              activeAccountId,
              activeAsset
            )
          }
          isProofVisible={isProofVisible}
          account={account}
          activeBill={activeBill}
          proofCheckStatus={proofCheckStatus}
          isPasswordFormVisible={isPasswordFormVisible}
          sortedListByValue={sortedListByValue}
          tokenLabel={tokenLabel}
        />
      )}
    </>
  );
}

export default BillsList;
