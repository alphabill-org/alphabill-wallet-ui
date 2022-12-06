import { useState } from "react";
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
  extractFormikError,
  getNewBearer,
  invalidateWithInterval,
} from "../../../../utils/utils";
import {
  IBill,
  ILockedBill,
  IProofsProps,
  ITransfer,
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

function BillsList(): JSX.Element | null {
  const [password, setPassword] = useState<string>("");
  const [collectableBills, setCollectableBills] = useState<IBill[]>([]);
  const [passwordFormType, setPasswordFormType] = useState<
    "DC" | "swap" | null
  >(null);
  const {
    billsList,
    account,
    lockedBills,
    setLockedBillsLocal,
    setActionsView,
    setIsActionsViewVisible,
    setSelectedSendKey,
  } = useApp();
  const [transferMsgHashes, setTransferMsgHashes] = useState<Uint8Array[]>([]);
  const sortedList = billsList?.bills?.sort(
    (a: IBill, b: IBill) => Number(a.value) - Number(b.value)
  );
  const DCBills = sortedList.filter((b: IBill) => b.isDCBill);
  const [activeBillId, setActiveBillId] = useState<string>(sortedList[0]?.id);
  const [isProofVisible, setIsProofVisible] = useState<boolean>(false);
  const [isCollectLoading, setIsCollectLoading] = useState<boolean>(false);
  const [isSwapLoading, setIsSwapLoading] = useState<boolean>(false);
  const [isLockFormVisible, setIsLockFormVisible] = useState<boolean>(false);
  const [visibleBillSettingID, setVisibleBillSettingID] = useState<
    string | null
  >(null);
  const { data: proof } = useGetProof(
    base64ToHexPrefixed(activeBillId),
    account.pubKey
  );
  const queryClient = useQueryClient();
  const { vault } = useAuth();

  let DCDenomination: number | null = null;

  const handleDC = (bills: IBill[], formPassword?: string) => {
    const { hashingPrivateKey, hashingPublicKey } = getKeys(
      formPassword || password,
      Number(account.idx),
      vault
    );
    let nonce: Buffer[] = [];
    invalidateWithInterval(() =>
      queryClient.invalidateQueries(["billsList", account.pubKey])
    );
    sortBillsByID(collectableBills).map((bill: IBill) =>
      nonce.push(Buffer.from(bill.id, "base64"))
    );

    if (!hashingPublicKey || !hashingPrivateKey) return;

    let total = 0;
    sortBillsByID(bills).map((bill: IBill) =>
      getBlockHeight().then(async (blockData) => {
        total = total + 1;

        if (!nonce.length) return;

        const nonceHash = await secp.utils.sha256(Buffer.concat(nonce));

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
          timeout: blockData.blockHeight + 10,
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

        const isValid = secp.verify(signature[0], msgHash, hashingPublicKey);

        const ownerProof = Buffer.from(
          startByte +
            opPushSig +
            sigScheme +
            Buffer.from(
              secp.utils.concatBytes(signature[0], Buffer.from([signature[1]]))
            ).toString("hex") +
            opPushPubKey +
            sigScheme +
            unit8ToHexPrefixed(hashingPublicKey).substring(2),
          "hex"
        ).toString("base64");

        const dataWithProof = Object.assign(transferData, {
          ownerProof: ownerProof,
          timeout: blockData.blockHeight + 10,
        });

        isValid &&
          makeTransaction(dataWithProof).then(() => {
            const invalidationItems = () => {
              queryClient.invalidateQueries(["billsList", account.pubKey]);
              queryClient.invalidateQueries([
                "balance",
                unit8ToHexPrefixed(hashingPublicKey),
              ]);
            };
            invalidateWithInterval(() => invalidationItems()).then(() =>
              setIsCollectLoading(false)
            );
          });
      })
    );
  };

  const handleSwap = (bills: IBill[], formPassword?: string) => {
    let total = 0;
    let nonce: Buffer[] = [];
    let dcTransfers: any = [];
    let proofs: any = [];
    let billIdentifiers: string[] = [];
    const { hashingPublicKey } = getKeys(
      formPassword || password,
      Number(account.idx),
      vault
    );

    if (!hashingPublicKey) return;

    sortBillsByID(DCBills as IBill[]).map((bill: IBill) =>
      nonce.push(Buffer.from(bill.id, "base64"))
    );

    sortBillsByID(DCBills).map((bill: IBill) =>
      axios
        .get<IProofsProps>(
          `${API_URL}/proof/${account.pubKey}?bill_id=${base64ToHexPrefixed(
            bill.id
          )}`
        )
        .then(({ data }) => {
          total = total + 1;
          const tx = data.bills[0].txProof.tx;
          const proof = data.bills[0].txProof.proof;
          billIdentifiers.push(bill.id);
          dcTransfers.push(tx);
          proofs.push(proof);

          if (total === DCBills.length) {
            handleSwapRequest(
              nonce,
              proofs,
              dcTransfers,
              formPassword,
              password,
              billIdentifiers,
              getNewBearer(account),
              transferMsgHashes,
              account,
              vault,
              invalidateWithInterval(() => {
                const invalidationItems = () => {
                  queryClient.invalidateQueries(["billsList", account.pubKey]);
                  queryClient.invalidateQueries([
                    "balance",
                    unit8ToHexPrefixed(hashingPublicKey),
                  ]);
                };
                invalidateWithInterval(() => invalidationItems()).then(() =>
                  setIsSwapLoading(false)
                );
              })
            );
          }
        })
    );
  };

  return (
    <>
      <div className="dashboard__info-col active relative">
        <Spacer mt={16} />
        <div className="t-medium-small pad-24-h">
          To swap your bills into one bigger bill click on the Dust Collection
          button next to the given bill and then click on Swap Bills button.
          <Spacer mt={8} />
        </div>{" "}
        <div>
          {DCBills.length > 0 && (
            <>
              <Spacer mt={16} />
              <div className="t-medium pad-24-h c-primary">
                COLLECTED BILLS FOR SWAP
              </div>
              <Spacer mt={8} />
            </>
          )}

          {DCBills.map((bill: IBill, idx: number) => {
            const isNewDenomination = DCDenomination !== bill.value && true;
            const amountOfGivenDenomination = DCBills?.filter(
              (b: IBill) => b.value === bill.value
            ).length;
            DCDenomination = bill.value;

            return (
              <div key={bill.id + idx}>
                {isNewDenomination && (
                  <>
                    {idx !== 0 && <Spacer mt={8} />}
                    <div className="t-medium-small pad-24-h flex flex-align-c">
                      Denomination: {bill.value}{" "}
                      <span className="t-medium pad-8-l">
                        (total of {amountOfGivenDenomination} bill{""}
                        {amountOfGivenDenomination > 1 && "s"})
                      </span>
                    </div>
                  </>
                )}
                <div key={bill.id} className="dashboard__info-item-wrap small">
                  <div className="dashboard__info-item-bill">
                    <div className="flex t-small c-light">
                      <span className="pad-8-r">ID:</span>{" "}
                      <span>{base64ToHexPrefixed(bill.id)}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <Spacer mt={16} />
        <div className="t-medium-small pad-24-h">
          <Button
            disabled={DCBills.length <= 0}
            className="w-100p"
            small
            type="button"
            variant="primary"
            working={isSwapLoading}
            onClick={() => {
              setIsSwapLoading(true);
              if (password) {
                handleSwap(DCBills);
              } else {
                setPasswordFormType("swap");
              }
            }}
          >
            Swap Collected Bills
          </Button>
          <Spacer mt={8} />
          {collectableBills.length > 0 && (
            <>
              <Button
                disabled={collectableBills.length <= 0 || DCBills.length > 0}
                className="w-100p"
                small
                type="button"
                variant="primary"
                working={isCollectLoading}
                onClick={() => {
                  setIsCollectLoading(true);
                  if (password) {
                    handleDC(collectableBills);
                  } else {
                    setPasswordFormType("DC");
                  }
                }}
              >
                {DCBills.length > 0
                  ? "Swap Before Collecting New Bills"
                  : "Collect Selected Bills"}
              </Button>
              <Spacer mt={8} />
            </>
          )}

          <Button
            onClick={() => {
              sortedList.filter(
                (b: IBill) =>
                  b.isDCBill === false &&
                  !lockedBills?.find(
                    (key: ILockedBill) => key.billId === b.id
                  ) &&
                  !collectableBills.find((key) => key.id === b.id)
              ).length < 1
                ? setCollectableBills([])
                : setCollectableBills(
                    collectableBills.concat(
                      sortedList.filter(
                        (b: IBill) =>
                          b.isDCBill === false &&
                          !lockedBills?.find(
                            (key: ILockedBill) => key.billId === b.id
                          ) &&
                          !collectableBills.find((key) => key.id === b.id)
                      )
                    )
                  );
              setVisibleBillSettingID(null);
            }}
            className="w-100p"
            small
            type="button"
            variant="secondary"
          >
            {sortedList.filter(
              (b: IBill) =>
                b.isDCBill === false &&
                !lockedBills?.find((key: ILockedBill) => key.billId === b.id) &&
                !collectableBills.find((key) => key.id === b.id)
            ).length < 1
              ? "Unselect All Bills For Collection"
              : "Select All Bills For Collection"}
          </Button>
        </div>
        {sortedList.filter((b: IBill) =>
          lockedBills?.find((key: ILockedBill) => key.billId === b.id)
        ).length > 0 && (
          <BillsListItem
            title={
              <div className="t-medium pad-24-h c-primary">
                LOCKED BILLS{" "}
                <span className="t-small">- Exempt from transfers</span>
              </div>
            }
            filteredList={sortedList.filter((b: IBill) =>
              lockedBills?.find((key: ILockedBill) => key.billId === b.id)
            )}
            isLockedBills
            DCBills={DCBills}
            setVisibleBillSettingID={(v) => setVisibleBillSettingID(v)}
            visibleBillSettingID={visibleBillSettingID}
            setCollectableBills={(v) => setCollectableBills(v)}
            collectableBills={collectableBills}
            setActiveBillId={(v) => setActiveBillId(v)}
            setIsProofVisible={(v) => setIsProofVisible(v)}
            setIsLockFormVisible={(v) => setIsLockFormVisible(v)}
            setActionsView={(v) => setActionsView(v)}
            setIsActionsViewVisible={(v) => setIsActionsViewVisible(v)}
            setSelectedSendKey={(v) => setSelectedSendKey(v)}
            lockedBills={lockedBills}
            setLockedBillsLocal={(v) => setLockedBillsLocal(v)}
          />
        )}
        {sortedList.filter(
          (b: IBill) =>
            b.isDCBill === false &&
            !lockedBills?.find((key: ILockedBill) => key.billId === b.id) &&
            collectableBills.find((key) => key.id === b.id)
        ).length >= 1 && (
          <BillsListItem
            title={
              <div className="t-medium pad-24-h c-primary">
                SELECTED FOR COLLECTION
                {DCBills.length > 0 && (
                  <div className="t-small">
                    Swap Before Collecting New Bills
                  </div>
                )}
              </div>
            }
            filteredList={sortedList.filter(
              (b: IBill) =>
                b.isDCBill === false &&
                !lockedBills?.find((key: ILockedBill) => key.billId === b.id) &&
                collectableBills.find((key) => key.id === b.id)
            )}
            lockedBills={lockedBills}
            setLockedBillsLocal={(v) => setLockedBillsLocal(v)}
            isSelectedForCollection
            DCBills={DCBills}
            setVisibleBillSettingID={(v) => setVisibleBillSettingID(v)}
            visibleBillSettingID={visibleBillSettingID}
            setCollectableBills={(v) => setCollectableBills(v)}
            collectableBills={collectableBills}
            setActiveBillId={(v) => setActiveBillId(v)}
            setIsProofVisible={(v) => setIsProofVisible(v)}
            setIsLockFormVisible={(v) => setIsLockFormVisible(v)}
            setActionsView={(v) => setActionsView(v)}
            setIsActionsViewVisible={(v) => setIsActionsViewVisible(v)}
            setSelectedSendKey={(v) => setSelectedSendKey(v)}
          />
        )}
        {sortedList.filter(
          (b: IBill) =>
            b.isDCBill === false &&
            !lockedBills?.find((key: ILockedBill) => key.billId === b.id) &&
            !collectableBills.find((key) => key.id === b.id)
        ).length >= 1 && (
          <BillsListItem
            title={
              <div className="t-medium pad-24-h c-primary">
                UNCOLLECTED BILLS
                {DCBills.length > 0 && (
                  <div className="t-small">
                    Swap Before Selecting New Bills For Collection
                  </div>
                )}
              </div>
            }
            lockedBills={lockedBills}
            setLockedBillsLocal={(v) => setLockedBillsLocal(v)}
            filteredList={sortedList.filter(
              (b: IBill) =>
                b.isDCBill === false &&
                !lockedBills?.find((key: ILockedBill) => key.billId === b.id) &&
                !collectableBills.find((key) => key.id === b.id)
            )}
            DCBills={DCBills}
            setVisibleBillSettingID={(v) => setVisibleBillSettingID(v)}
            visibleBillSettingID={visibleBillSettingID}
            setCollectableBills={(v) => {
              setCollectableBills(v);
            }}
            collectableBills={collectableBills}
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
          "select__popover-wrap--open": Boolean(passwordFormType),
        })}
      >
        <div className="select__popover">
          <div className="select__popover-header">
            <div>INSERT PASSWORD FOR {passwordFormType?.toUpperCase()}</div>
            <Close
              onClick={() => {
                setPasswordFormType(null);
              }}
            />
          </div>
          <Spacer mt={16} />
          <Formik
            initialValues={{
              password: "",
            }}
            validationSchema={Yup.object().shape({
              password: Yup.string().test(
                "empty-or-8-characters-check",
                "password must be at least 8 characters",
                (password) => !password || password.length >= 8
              ),
            })}
            onSubmit={(values) => {
              if (collectableBills && passwordFormType === "DC") {
                setPassword(values.password);
                setPasswordFormType(null);
                handleDC(collectableBills, values.password);
              } else if (passwordFormType === "swap") {
                setPassword(values.password);
                handleSwap(DCBills, values.password);
                setPasswordFormType(null);
              }
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
      <div
        className={classNames("select__popover-wrap", {
          "select__popover-wrap--open": isLockFormVisible,
        })}
      >
        <div className="select__popover">
          <div className="select__popover-header">
            <div>INSERT LOCKED BILL DESCRIPTION</div>
            <Close
              onClick={() => {
                setIsLockFormVisible(!isLockFormVisible);
              }}
            />
          </div>
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
                    value: sortedList.find(
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
                <div className="pad-24-h">
                  <form onSubmit={handleSubmit}>
                    <Form>
                      <FormContent>
                        <Textfield
                          id="desc"
                          name="desc"
                          label=""
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
                          Lock
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
    </>
  );
}

export default BillsList;
