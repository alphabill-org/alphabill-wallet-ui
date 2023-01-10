import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "react-query";
import { isString } from "lodash";
import * as secp from "@noble/secp256k1";

import {
  createOwnerProof,
  DCTransfersLimit,
  getNewBearer,
  sortIDBySize,
  sortTxProofsByID,
  swapTimeout,
} from "../../../utils/utils";
import {
  IBill,
  ILockedBill,
  IProof,
  IProofTx,
  ISwapProps,
  ISwapTransferProps,
  ITxProof,
} from "../../../types/Types";
import { useApp } from "../../../hooks/appProvider";
import { useAuth } from "../../../hooks/useAuth";
import Spacer from "../../../components/Spacer/Spacer";
import Button from "../../../components/Button/Button";
import {
  getBlockHeight,
  getProof,
  makeTransaction,
} from "../../../hooks/requests";
import { ReactComponent as Sync } from "./../../../images/sync-ico.svg";
import { useLocalStorage } from "../../../hooks/useLocalStorage";
import { Verify } from "../../../utils/validators";
import BillsListItem from "./BillsListItem";
import BillsListPopups from "./BillsListPopups";
import {
  handleDC,
  handleSwapRequest,
} from "./BillsListConsolidation";
import {
  getKeys,
  base64ToHexPrefixed,
  sortBillsByID,
} from "../../../utils/utils";
import { swapOrderHash } from "../../../utils/hashers";

function BillsList(): JSX.Element | null {
  const [password, setPassword] = useState<string>("");
  const {
    billsList,
    account,
    lockedBills,
    setLockedBillsLocal,
    setActionsView,
    setIsActionsViewVisible,
    setSelectedSendKey,
  } = useApp();
  // Bills lists
  const sortedListByValue = billsList?.sort(
    (a: IBill, b: IBill) => Number(a.value) - Number(b.value)
  );
  const unlockedBills = billsList.filter(
    (b: IBill) =>
      b.isDCBill === false &&
      !lockedBills?.find((key: ILockedBill) => key.billId === b.id)
  );
  const DCBills = useMemo(
    () =>
      sortedListByValue
        ? sortBillsByID(sortedListByValue).filter((b: IBill) => b.isDCBill)
        : [],
    [sortedListByValue]
  );

  //Popup hooks
  const [isPasswordFormVisible, setIsPasswordFormVisible] = useState<
    "proofCheck" | "handleDC" | null | undefined
  >();
  const [activeBill, setActiveBill] = useState<IBill>(sortedListByValue[0]);
  const [isProofVisible, setIsProofVisible] = useState<boolean>(false);
  const [isLockFormVisible, setIsLockFormVisible] = useState<boolean>(false);
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
  const { vault, activeAccountId } = useAuth();
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

  // Refs
  const swapInterval = useRef<NodeJS.Timeout | null>(null);
  const swapTimer = useRef<NodeJS.Timeout | null>(null);
  const initialBlockHeight = useRef<number | null | undefined>(null);
  let DCDenomination: number | null = null;

  // Bills list functions
  const handleProof = (bill: IBill) => {
    password
      ? getProof(account.pubKey, base64ToHexPrefixed(bill.id)).then(
          async (data) => {
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
          }
        )
      : setIsPasswordFormVisible("proofCheck");
  };

  const addInterval = () => {
    initialBlockHeight.current = null;
    swapInterval.current = setInterval(() => {
      queryClient.invalidateQueries(["billsList", activeAccountId]);
      getBlockHeight().then((blockData) => {
        if (!initialBlockHeight?.current) {
          initialBlockHeight.current = blockData.blockHeight;
        }

        if (
          Number(initialBlockHeight?.current) + swapTimeout <
          blockData.blockHeight
        ) {
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

      let nonce: Buffer[] = [];
      let txProofs: ITxProof[] = [];
      let billIdentifiers: string[] = [];

      sortIDBySize(lastNonceIDs?.[activeAccountId]).forEach((id: string) => {
        nonce.push(Buffer.from(id, "base64"));
        billIdentifiers.push(id);
      });

      DCBills.map((bill: IBill, idx: number) =>
        getProof(account.pubKey, base64ToHexPrefixed(bill.id)).then((data) => {
          const txProof = data.bills[0].txProof;

          txProofs.push(txProof);

          if (txProofs.length === DCBills.length) {
            handleSwapRequest(
              nonce,
              sortTxProofsByID(txProofs),
              hashingPublicKey,
              hashingPrivateKey,
              sortIDBySize(billIdentifiers),
              getNewBearer(account)
            );
          }
        })
      );
    },
    [DCBills, account, lastNonceIDs, password, vault, activeAccountId]
  );

  // Effects
  useEffect(() => {
    if (
      DCBills?.length >= 1 &&
      DCBills?.length === lastNonceIDs?.[activeAccountId]?.length &&
      password &&
      !hasSwapBegun
    ) {
      handleSwap(password);
    }
  }, [
    handleSwap,
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
      DCBills?.length < 1 &&
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
        <Button
          onClick={() => {
            queryClient.invalidateQueries(["billsList", activeAccountId]);
            queryClient.invalidateQueries(["balance", activeAccountId]);
          }}
          className="btn__refresh w-100p"
          small
          type="button"
          variant="secondary"
        >
          <div className="pad-8-r">Refresh list</div>
          <Sync height="16" width="16" />
        </Button>
        <Spacer mt={16} />
        <div className="t-medium-small pad-24-h">
          To consolidate your bills into one larger bill click on the{" "}
          <b>Consolidate Bills</b> button.
          {unlockedBills.length > DCTransfersLimit &&
            " There is a limit of " +
              DCTransfersLimit +
              " bills per consolidation."}
        </div>
        <div>
          {DCBills.length > 0 && (
            <>
              <Spacer mt={16} />
              <div className="t-medium pad-24-h c-primary">
                BILLS READY FOR CONSOLIDATION
              </div>
              <Spacer mt={3} />
            </>
          )}

          {DCBills.map((bill: IBill, idx: number) => {
            const isNewDenomination = DCDenomination !== bill.value && true;
            DCDenomination = bill.value;

            return (
              <div key={bill.id + idx}>
                {isNewDenomination && (
                  <>
                    {idx !== 0 && <Spacer mt={8} />}
                    <div className="t-medium-small t-bold pad-24-h flex flex-align-c flex-justify-sb">
                      Denomination: {bill.value}
                    </div>
                    <Spacer mb={2} />
                  </>
                )}
                <div key={bill.id} className="dashboard__info-item-wrap small">
                  <div className="dashboard__info-item-bill">
                    <div className="flex t-small t-bold c-light">
                      <span className="pad-8-r">ID:</span>{" "}
                      <span>{base64ToHexPrefixed(bill.id)}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="t-medium-small pad-24-h">
          <Spacer mt={16} />

          <Button
            className="w-100p"
            small
            type="button"
            variant="primary"
            working={isConsolidationLoading}
            disabled={
              unlockedBills?.length <= 1 &&
              DCBills.length <= 0 &&
              !isConsolidationLoading
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
                  unlockedBills,
                  DCBills,
                  lastNonceIDs,
                  activeAccountId
                );
              } else {
                setIsPasswordFormVisible("handleDC");
              }
            }}
          >
            Consolidate Bills
          </Button>
        </div>
        {sortedListByValue.filter((b: IBill) =>
          lockedBills?.find((key: ILockedBill) => key.billId === b.id)
        ).length > 0 && (
          <>
            <Spacer mt={8} />
            <BillsListItem
              title={
                <div className="t-medium pad-24-h c-primary">
                  LOCKED BILLS
                  <br />
                  <span className="t-small">
                    Exempt from transfers & consolidation
                  </span>
                </div>
              }
              filteredList={sortedListByValue.filter((b: IBill) =>
                lockedBills?.find((key: ILockedBill) => key.billId === b.id)
              )}
              isLockedBills
              setVisibleBillSettingID={setVisibleBillSettingID}
              visibleBillSettingID={visibleBillSettingID}
              setActiveBill={setActiveBill}
              setIsProofVisible={(bill) => {
                handleProof(bill);
              }}
              setIsLockFormVisible={setIsLockFormVisible}
              setActionsView={setActionsView}
              setIsActionsViewVisible={setIsActionsViewVisible}
              setSelectedSendKey={setSelectedSendKey}
              lockedBills={lockedBills}
              setLockedBillsLocal={setLockedBillsLocal}
            />
          </>
        )}
        {sortedListByValue.filter(
          (b: IBill) =>
            b.isDCBill === false &&
            !lockedBills?.find((key: ILockedBill) => key.billId === b.id)
        ).length >= 1 && (
          <BillsListItem
            title={
              <div className="t-medium pad-24-h c-primary">UNLOCKED BILLS</div>
            }
            lockedBills={lockedBills}
            setLockedBillsLocal={setLockedBillsLocal}
            filteredList={sortedListByValue.filter(
              (b: IBill) =>
                b.isDCBill === false &&
                !lockedBills?.find((key: ILockedBill) => key.billId === b.id)
            )}
            setVisibleBillSettingID={setVisibleBillSettingID}
            visibleBillSettingID={visibleBillSettingID}
            setActiveBill={setActiveBill}
            setIsProofVisible={(bill) => {
              handleProof(bill);
            }}
            setIsLockFormVisible={setIsLockFormVisible}
            setActionsView={setActionsView}
            setIsActionsViewVisible={setIsActionsViewVisible}
            setSelectedSendKey={setSelectedSendKey}
          />
        )}
        <Spacer mt={32} />
      </div>
      <BillsListPopups
        setVisibleBillSettingID={setVisibleBillSettingID}
        setIsProofVisible={setIsProofVisible}
        setProofCheckStatus={setProofCheckStatus}
        setIsLockFormVisible={setIsLockFormVisible}
        setLockedBillsLocal={setLockedBillsLocal}
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
            unlockedBills,
            DCBills,
            lastNonceIDs,
            activeAccountId
          )
        }
        lockedBills={lockedBills}
        isProofVisible={isProofVisible}
        account={account}
        activeBill={activeBill}
        proofCheckStatus={proofCheckStatus}
        isPasswordFormVisible={isPasswordFormVisible}
        isLockFormVisible={isLockFormVisible}
        sortedListByValue={sortedListByValue}
      />
    </>
  );
}

export default BillsList;
