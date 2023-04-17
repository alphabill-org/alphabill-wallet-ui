import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "react-query";
import { isString } from "lodash";

import { getTokensLabel } from "../../../utils/utils";
import {
  DCTransfersLimit,
  swapTimeout,
  AlphaType,
  FungibleListView,
} from "../../../utils/constants";
import { IBill } from "../../../types/Types";
import { useApp } from "../../../hooks/appProvider";
import { useAuth } from "../../../hooks/useAuth";
import Spacer from "../../../components/Spacer/Spacer";
import Button from "../../../components/Button/Button";
import { getBlockHeight, getProof } from "../../../hooks/requests";
import { useLocalStorage } from "../../../hooks/useLocalStorage";
import { Verify } from "../../../utils/validators";
import BillsListPopups from "./BillsListPopups";
import { handleDC, handleSwapRequest } from "./BillsListConsolidation";
import {
  getKeys,
  base64ToHexPrefixed,
  sortBillsByID,
} from "../../../utils/utils";
import AssetsList from "../../../components/AssetsList/AssetsList";

function BillsList(): JSX.Element | null {
  const [password, setPassword] = useState<string>("");
  const { billsList, account, setPreviousView } = useApp();
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
  const [isProofVisible, setIsProofVisible] = useState<boolean>(false);

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

  // Bills list functions
  const handleProof = (bill: IBill) => {
    password
      ? getProof(base64ToHexPrefixed(bill.id)).then(async (data) => {
          const { error, hashingPrivateKey, hashingPublicKey } = getKeys(
            password,
            Number(account?.idx),
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
              <Spacer mt={8} />
            </div>
          </>
        )}
        <Spacer mt={24} />
        {Number(
          sortedListByValue?.filter((b: IBill) => b.isDcBill !== true)?.length
        ) >= 1 && (
          <AssetsList
            assetList={sortedListByValue?.filter(
              (b: IBill) => b.isDcBill !== true
            )}
            isTypeListItem
            setIsProofVisible={(asset) => {
              handleProof(asset);
            }}
            isProofButton={sortedListByValue.find(
              (asset: IBill) => asset.typeId === AlphaType
            )}
            isTransferButton
            isHoverDisabled
            onSendClick={() => setPreviousView(FungibleListView)}
          />
        )}
        <Spacer mt={32} />
      </div>
      {!isConsolidationLoading && (
        <BillsListPopups
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
          activeBill={activeAsset}
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
