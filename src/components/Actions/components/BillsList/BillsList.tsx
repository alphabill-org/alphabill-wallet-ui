import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { Uint64BE } from "int64-buffer";
import * as secp from "@noble/secp256k1";
import { Formik } from "formik";
import * as Yup from "yup";
import classNames from "classnames";
import { useQueryClient } from "react-query";

import { Form, FormFooter, FormContent } from "../../../Form/Form";
import Textfield from "../../../Textfield/Textfield";
import {
  DCTransfersLimit,
  extractFormikError,
  getNewBearer,
  sortIDBySize,
  sortTxProofsByID,
  swapTimeout,
  timeoutBlocks,
} from "../../../../utils/utils";
import {
  IBill,
  ILockedBill,
  IProofsProps,
  ITransfer,
  ITxProof,
} from "../../../../types/Types";
import { useApp } from "../../../../hooks/appProvider";
import { useAuth } from "../../../../hooks/useAuth";
import Spacer from "../../../Spacer/Spacer";
import Button from "../../../Button/Button";
import {
  API_URL,
  getBlockHeight,
  makeTransaction,
} from "../../../../hooks/requests";
import { ReactComponent as Close } from "../../../../images/close.svg";
import Check from "../../../../images/checkmark.gif";
import { ReactComponent as Sync } from "../../../../images/sync-ico.svg";
import {
  getKeys,
  base64ToHexPrefixed,
  unit8ToHexPrefixed,
  startByte,
  opPushSig,
  opPushPubKey,
  sigScheme,
  sortBillsByID,
} from "../../../../utils/utils";
import { useGetProof } from "../../../../hooks/api";
import { handleSwapRequest } from "./Utils";
import BillsListItem from "./BillsListItem";
import Popup from "../../../Popup/Popup";
import { useLocalStorage } from "../../../../hooks/useLocalStorage";
import { isString } from "lodash";

function BillsList(): JSX.Element | null {
  const [password, setPassword] = useState<string>("");
  const [isPasswordFormVisible, setIsPasswordFormVisible] =
    useState<boolean>(false);
  const {
    billsList,
    account,
    lockedBills,
    setLockedBillsLocal,
    setActionsView,
    setIsActionsViewVisible,
    setSelectedSendKey,
    activeAccountId,
  } = useApp();
  const [transferMsgHashes, setTransferMsgHashes] = useState<Uint8Array[]>([]);
  const sortedListByValue = billsList?.sort(
    (a: IBill, b: IBill) => Number(a.value) - Number(b.value)
  );
  const DCBills = useMemo(
    () =>
      sortedListByValue
        ? sortBillsByID(sortedListByValue).filter((b: IBill) => b.isDCBill)
        : [],
    [sortedListByValue]
  );
  const unlockedBills = billsList.filter(
    (b: IBill) =>
      b.isDCBill === false &&
      !lockedBills?.find((key: ILockedBill) => key.billId === b.id)
  );
  const [activeBillId, setActiveBillId] = useState<string>(
    sortedListByValue[0]?.id
  );
  const [isProofVisible, setIsProofVisible] = useState<boolean>(false);
  const [isConsolidationLoading, setIsConsolidationLoading] =
    useState<boolean>(false);
  const [hasSwapBegun, setHasSwapBegun] = useState<boolean>(false);

  const [isLockFormVisible, setIsLockFormVisible] = useState<boolean>(false);
  const [visibleBillSettingID, setVisibleBillSettingID] = useState<
    string | null
  >(null);
  const { data: proof } = useGetProof(
    base64ToHexPrefixed(activeBillId),
    account.pubKey
  );
  const { vault } = useAuth();
  const queryClient = useQueryClient();
  const swapInterval = useRef<NodeJS.Timeout | null>(null);
  const swapTimer = useRef<NodeJS.Timeout | null>(null);
  const initialBlockHeight = useRef<number | null | undefined>(null);
  let DCDenomination: number | null = null;
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

  const handleSwap = useCallback(() => {
    const { error, hashingPrivateKey, hashingPublicKey } = getKeys(
      password,
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
      axios
        .get<IProofsProps>(
          `${API_URL}/proof/${account.pubKey}?bill_id=${base64ToHexPrefixed(
            bill.id
          )}`
        )
        .then(({ data }) => {
          const txProof = data.bills[0].txProof;

          txProofs.push(txProof);

          if (txProofs.length === DCBills.length) {
            handleSwapRequest(
              nonce,
              sortTxProofsByID(txProofs),
              hashingPublicKey,
              hashingPrivateKey,
              sortIDBySize(billIdentifiers),
              getNewBearer(account),
              transferMsgHashes
            );
          }
        })
    );
  }, [
    DCBills,
    account,
    transferMsgHashes,
    lastNonceIDs,
    password,
    vault,
    activeAccountId,
  ]);

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

  useEffect(() => {
    if (
      DCBills?.length >= 1 &&
      DCBills?.length === lastNonceIDs?.[activeAccountId]?.length &&
      password
    ) {
      handleSwap();
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

  const handleDC = async (formPassword?: string) => {
    const { error, hashingPrivateKey, hashingPublicKey } = getKeys(
      formPassword || password,
      Number(account.idx),
      vault
    );

    if (error || !hashingPublicKey || !hashingPrivateKey) {
      return;
    }

    const limitedUnlockedBills = unlockedBills.slice(0, DCTransfersLimit);

    const sortedListByID = sortBillsByID(limitedUnlockedBills);
    let nonce: Buffer[] = [];
    let IDs: string[] = [];

    setIsConsolidationLoading(true);

    if (DCBills.length >= 1) {
      DCBills.map((bill: IBill) => nonce.push(Buffer.from(bill.id, "base64")));
      handleSwap();
      addInterval();
    } else {
      sortedListByID.forEach((bill: IBill) => {
        nonce.push(Buffer.from(bill.id, "base64"));
        IDs.push(bill.id);
      });

      if (!nonce.length) return;

      const nonceHash = await secp.utils.sha256(Buffer.concat(nonce));
      let total = 0;

      getBlockHeight().then((blockData) =>
        sortedListByID.map(async (bill: IBill, idx) => {
          total = total + 1;

          const transferData: ITransfer = {
            systemId: "AAAAAA==",
            unitId: bill.id,
            transactionAttributes: {
              "@type": "type.googleapis.com/rpc.TransferDCOrder",
              backlink: bill.txHash,
              nonce: Buffer.from(nonceHash).toString("base64"),
              targetBearer: getNewBearer(account),
              targetValue: bill.value.toString(),
            },
            timeout: blockData.blockHeight + timeoutBlocks,
            ownerProof: "",
          };

          const msgHash = await secp.utils.sha256(
            secp.utils.concatBytes(
              Buffer.from(transferData.systemId, "base64"),
              Buffer.from(transferData.unitId, "base64"),
              new Uint64BE(transferData.timeout).toBuffer(),
              Buffer.from(Buffer.from(nonceHash).toString("base64"), "base64"),
              Buffer.from(
                transferData.transactionAttributes.targetBearer as string,
                "base64"
              ),
              new Uint64BE(bill.value).toBuffer(),
              Buffer.from(bill.txHash, "base64")
            )
          );

          setTransferMsgHashes([...transferMsgHashes, msgHash]);

          const signature = await secp.sign(msgHash, hashingPrivateKey, {
            der: false,
            recovered: true,
          });

          if (secp.verify(signature[0], msgHash, hashingPublicKey)) {
            const ownerProof = Buffer.from(
              startByte +
                opPushSig +
                sigScheme +
                Buffer.from(
                  secp.utils.concatBytes(
                    signature[0],
                    Buffer.from([signature[1]])
                  )
                ).toString("hex") +
                opPushPubKey +
                sigScheme +
                unit8ToHexPrefixed(hashingPublicKey).substring(2),
              "hex"
            ).toString("base64");

            const dataWithProof = Object.assign(transferData, {
              ownerProof: ownerProof,
              timeout: blockData.blockHeight + timeoutBlocks,
            });

            makeTransaction(dataWithProof)
              .then(() => handleTransactionEnd())
              .catch(() => handleTransactionEnd());

            const handleTransactionEnd = () => {
              setLastNonceIDsLocal(
                JSON.stringify(
                  Object.assign(lastNonceIDs, {
                    [activeAccountId]: IDs,
                  })
                )
              );

              if (sortedListByID.length === idx + 1) {
                addInterval();
                setHasSwapBegun(false);
              }
            };
          }
        })
      );
    }
  };

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
                handleDC();
              } else {
                setIsPasswordFormVisible(true);
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
              setVisibleBillSettingID={(v) => setVisibleBillSettingID(v)}
              visibleBillSettingID={visibleBillSettingID}
              setActiveBillId={(v) => setActiveBillId(v)}
              setIsProofVisible={(v) => setIsProofVisible(v)}
              setIsLockFormVisible={(v) => setIsLockFormVisible(v)}
              setActionsView={(v) => setActionsView(v)}
              setIsActionsViewVisible={(v) => setIsActionsViewVisible(v)}
              setSelectedSendKey={(v) => setSelectedSendKey(v)}
              lockedBills={lockedBills}
              setLockedBillsLocal={(v) => setLockedBillsLocal(v)}
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
            setLockedBillsLocal={(v) => setLockedBillsLocal(v)}
            filteredList={sortedListByValue.filter(
              (b: IBill) =>
                b.isDCBill === false &&
                !lockedBills?.find((key: ILockedBill) => key.billId === b.id)
            )}
            setVisibleBillSettingID={(v) => setVisibleBillSettingID(v)}
            visibleBillSettingID={visibleBillSettingID}
            setActiveBillId={(v) => setActiveBillId(v)}
            setIsProofVisible={(v) => setIsProofVisible(v)}
            setIsLockFormVisible={(v) => setIsLockFormVisible(v)}
            setActionsView={(v) => setActionsView(v)}
            setIsActionsViewVisible={(v) => setIsActionsViewVisible(v)}
            setSelectedSendKey={(v) => setSelectedSendKey(v)}
          />
        )}
        <Spacer mt={32} />
      </div>
      <div
        className={classNames("select__popover-wrap", {
          "select__popover-wrap--open": isProofVisible,
        })}
      >
        <div className="select__popover">
          <div className="select__popover-header">
            <div>BILL PROOF</div>
            <Close
              onClick={() => {
                setIsProofVisible(!isProofVisible);
              }}
            />
          </div>
          <Spacer mt={16} />
          <div className="pad-24-h bills-list__proof">
            <div>
              <b>txHash:</b> {proof?.bills[0]?.txHash}
            </div>
            <Spacer mt={16} />
            {proof?.bills[0]?.txHash ===
              proof?.bills[0]?.txProof?.proof?.transactionsHash && (
              <div className="t-medium flex">
                <img height="32" src={Check} alt="Matches" />{" "}
                <span className="pad-8-l">Transaction hash matches!</span>
              </div>
            )}
          </div>
        </div>
      </div>
      <div
        className={classNames("select__popover-wrap", {
          "select__popover-wrap--open": isPasswordFormVisible === true,
        })}
      >
        <div className="select__popover">
          <div className="select__popover-header">
            <div>INSERT PASSWORD</div>
            <Close
              onClick={() => {
                setIsPasswordFormVisible(false);
              }}
            />
          </div>
          <Spacer mt={16} />
          <Formik
            initialValues={{
              password: "",
            }}
            validationSchema={Yup.object().shape({
              password: Yup.string().required("Password is required"),
            })}
            onSubmit={(values, { setErrors }) => {
              const { error, hashingPrivateKey, hashingPublicKey } = getKeys(
                values.password,
                Number(account.idx),
                vault
              );

              if (error || !hashingPublicKey || !hashingPrivateKey) {
                return setErrors({ password: "Password is incorrect!" });
              }

              setPassword(values.password);
              handleDC(values.password);
              setIsPasswordFormVisible(false);
            }}
          >
            {(formikProps) => {
              const { handleSubmit, errors, touched } = formikProps;

              return (
                <div className="pad-24-h">
                  <form onSubmit={handleSubmit}>
                    <Form>
                      <FormContent>
                        <Textfield
                          id="password"
                          name="password"
                          label=""
                          type="password"
                          error={extractFormikError(errors, touched, [
                            "password",
                          ])}
                        />
                      </FormContent>
                      <FormFooter>
                        <Button
                          big={true}
                          block={true}
                          type="submit"
                          variant="primary"
                        >
                          Submit
                        </Button>
                      </FormFooter>
                    </Form>
                  </form>
                </div>
              );
            }}
          </Formik>
        </div>
      </div>
      <Popup
        isPopupVisible={isLockFormVisible}
        setIsPopupVisible={setIsLockFormVisible}
        title="Add locked bill description"
      >
        <Spacer mt={16} />
        <Formik
          initialValues={{
            desc: "",
          }}
          validationSchema={Yup.object().shape({
            desc: Yup.string().required("Description is required"),
          })}
          onSubmit={(values, { resetForm }) => {
            setLockedBillsLocal(
              JSON.stringify([
                ...lockedBills,
                {
                  billId: activeBillId,
                  desc: values.desc,
                  value: sortedListByValue.find(
                    (bill: IBill) => bill.id === activeBillId
                  ).value,
                },
              ])
            );
            setVisibleBillSettingID(null);
            resetForm();
            setIsLockFormVisible(false);
          }}
        >
          {(formikProps) => {
            const { handleSubmit, errors, touched } = formikProps;

            return (
              <div className="w-100p">
                <form onSubmit={handleSubmit}>
                  <Form>
                    <FormContent>
                      <Textfield
                        id="desc"
                        name="desc"
                        label="Bill description visible in bills list"
                        type="desc"
                        error={extractFormikError(errors, touched, ["desc"])}
                      />
                    </FormContent>
                    <FormFooter>
                      <Button
                        big={true}
                        block={true}
                        type="submit"
                        variant="primary"
                      >
                        Lock & add description
                      </Button>
                    </FormFooter>
                  </Form>
                </form>
              </div>
            );
          }}
        </Formik>
      </Popup>
    </>
  );
}

export default BillsList;
