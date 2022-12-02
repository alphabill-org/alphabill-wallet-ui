import { useState } from "react";
import axios from "axios";
import CryptoJS from "crypto-js";
import { Uint64BE } from "int64-buffer";
import * as secp from "@noble/secp256k1";
import { Formik } from "formik";
import * as Yup from "yup";
import classNames from "classnames";
import { useQueryClient } from "react-query";

import { Form, FormFooter, FormContent } from "../../../Form/Form";
import Textfield from "../../../Textfield/Textfield";
import { extractFormikError } from "../../../../utils/utils";
import { IBill, IProofsProps, ITransfer } from "../../../../types/Types";
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
import { ReactComponent as MoreIco } from "../../../../images/more-ico.svg";
import {
  getKeys,
  base64ToHexPrefixed,
  unit8ToHexPrefixed,
  startByte,
  opPushSig,
  opPushPubKey,
  opDup,
  opHash,
  opPushHash,
  opCheckSig,
  opEqual,
  opVerify,
  sigScheme,
} from "../../../../utils/utils";
import { useGetProof } from "../../../../hooks/api";
import { handleSwapRequest } from "./Utils";

function BillsList(): JSX.Element | null {
  const [password, setPassword] = useState<string>("");
  const [firstBills, setFirstBills] = useState<IBill[]>([]);
  const [passwordFormType, setPasswordFormType] = useState<
    "DC" | "swap" | null
  >(null);
  const [isLoadingID, setIsLoadingID] = useState<number | null>();
  const {
    billsList,
    account,
    lockedKeys,
    setLockedKeys,
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

  let denomination: number | null = null;
  let DCDenomination: number | null = null;
  const handleDC = (bills: IBill[], formPassword?: string) => {
    const { hashingPrivateKey, hashingPublicKey } = getKeys(
      formPassword || password,
      Number(account.idx),
      vault
    );

    if (!hashingPublicKey || !hashingPrivateKey) return;
    let total = 0;
    bills.map((bill: IBill) =>
      getBlockHeight().then(async (blockData) => {
        let nonce: Buffer[] = [];
        total = total + 1;

        sortedList.map((bill: IBill) =>
          nonce.push(Buffer.from(bill.id.substring(2), "hex"))
        );

        if (!nonce.length) return;

        const nonceHash = await secp.utils.sha256(Buffer.concat(nonce));

        const transferData: ITransfer = {
          system_id: "AAAAAA==",
          unit_id: bill.id,
          type: "TransferDCOrder",
          attributes: {
            backlink: bill.txHash,
            nonce: Buffer.from(nonceHash).toString("base64"),
            target_bearer: newBearer,
            target_value: bill.value,
          },
          timeout: blockData.blockHeight + 42,
          owner_proof: "",
        };

        const msgHash = await secp.utils.sha256(
          secp.utils.concatBytes(
            Buffer.from(transferData.system_id, "base64"),
            Buffer.from(transferData.unit_id, "base64"),
            new Uint64BE(transferData.timeout).toBuffer(),
            Buffer.from(Buffer.from(nonceHash).toString("base64"), "base64"),
            Buffer.from(
              transferData.attributes.target_bearer as string,
              "base64"
            ),
            new Uint64BE(transferData.attributes.target_value).toBuffer(),
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
          owner_proof: ownerProof,
          timeout: blockData.blockHeight + 42,
        });

        isValid &&
          makeTransaction(dataWithProof).then(() => {
            queryClient.invalidateQueries(["billsList", account.pubKey]);
          });
        setIsLoadingID(null);
      })
    );
  };

  const address = account.pubKey.startsWith("0x")
    ? account.pubKey.substring(2)
    : account.pubKey;
  const addressHash = CryptoJS.enc.Hex.parse(address);
  const SHA256 = CryptoJS.SHA256(addressHash);
  const newBearer = Buffer.from(
    startByte +
      opDup +
      opHash +
      sigScheme +
      opPushHash +
      sigScheme +
      SHA256.toString(CryptoJS.enc.Hex) +
      opEqual +
      opVerify +
      opCheckSig +
      sigScheme,
    "hex"
  ).toString("base64");

  const handleSwap = (formPassword?: string) => {
    let total = 0;
    let nonce: Buffer[] = [];
    let dc_transfers: any = [];
    let proofs: any = [];
    let billIdentifiers: string[] = [];

    DCBills.map((bill: IBill) =>
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

          dc_transfers.push({
            system_id: tx.systemId,
            unit_id: tx.unitId,
            type: "TransferDCOrder",
            attributes: {
              backlink: tx.transactionAttributes.backlink,
              nonce: tx.transactionAttributes.nonce,
              target_bearer: tx.transactionAttributes.targetBearer,
              target_value: tx.transactionAttributes.targetValue,
            },
            timeout: tx.timeout,
            owner_proof: tx.ownerProof,
          });

          proofs.push({
            proof_type: "PRIM",
            block_header_hash: proof.blockHeaderHash,
            transactions_hash: proof.transactionsHash,
            hash_value: proof.hashValue,
            block_tree_hash_chain: proof.blockTreeHashChain,
            unicity_certificate: {
              input_record: {
                previous_hash:
                  proof.unicityCertificate.inputRecord.previousHash,
                hash: proof.unicityCertificate.inputRecord.hash,
                block_hash: proof.unicityCertificate.inputRecord.blockHash,
                summary_value:
                  proof.unicityCertificate.inputRecord.summaryValue,
              },
              unicity_tree_certificate: {
                system_identifier:
                  proof.unicityCertificate.unicityTreeCertificate
                    .systemIdentifier,
                sibling_hashes:
                  proof.unicityCertificate.unicityTreeCertificate.siblingHashes,
                system_description_hash:
                  proof.unicityCertificate.unicityTreeCertificate
                    .systemDescriptionHash,
              },
              unicity_seal: {
                root_chain_round_number:
                  proof.unicityCertificate.unicitySeal.rootChainRoundNumber,
                previous_hash:
                  proof.unicityCertificate.unicitySeal.previousHash,
                hash: proof.unicityCertificate.unicitySeal.hash,
                signatures: proof.unicityCertificate.unicitySeal.signatures,
              },
            },
          });

          sortedList.map((bill: IBill) =>
            nonce.push(Buffer.from(bill.id.substring(2), "hex"))
          );

          if (total === DCBills.length) {
            handleSwapRequest(
              nonce,
              proofs,
              dc_transfers,
              formPassword,
              password,
              billIdentifiers,
              newBearer,
              transferMsgHashes,
              account,
              vault
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
            const amountOfGivenDenomination = billsList?.bills.filter(
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
            onClick={() => {
              if (password) {
                handleSwap();
              } else {
                setPasswordFormType("swap");
              }
            }}
          >
            Swap Collected Bills
          </Button>
          <Spacer mt={8} />
          <Button
            disabled={DCBills.length <= 0}
            className="w-100p"
            small
            type="button"
            variant="secondary"
            onClick={() =>
              queryClient.invalidateQueries(["billsList", account.pubKey])
            }
          >
            Fetch Collected Bills
          </Button>
        </div>
        <div>
          {sortedList
            .filter((b: IBill) => lockedKeys.find((key) => key.billId === b.id)).length > 0 && (
            <>
              <Spacer mt={32} />
              <div className="t-medium pad-24-h c-primary">
                LOCKED BILLS{" "}
                <span className="t-small">- Exempt from transfers</span>
              </div>
            </>
          )}

          {sortedList
            .filter((b: IBill) => lockedKeys.find((key) => key.billId === b.id))
            .map((bill: IBill, idx: number) => (
              <div key={bill.id + idx}>
                <div
                  className={
                    visibleBillSettingID === bill.id
                      ? "flex flex-align-c pad-24-h pad-16-t"
                      : "d-none"
                  }
                >
                  <Spacer mt={8} />

                  <Button
                    onClick={() => {
                      setActiveBillId(bill.id);
                      setIsProofVisible(true);
                      queryClient.invalidateQueries([
                        "proof",
                        base64ToHexPrefixed(bill.id),
                      ]);
                    }}
                    xSmall
                    type="button"
                    variant="primary"
                  >
                    Proof
                  </Button>
                  <span className="pad-8-l">
                    <Button
                      onClick={() => {
                        setLockedKeys(
                          lockedKeys.filter((key) => key.billId !== bill.id)
                        );
                        setActiveBillId(bill.id);
                      }}
                      xSmall
                      type="button"
                      variant="primary"
                    >
                      Unlock
                    </Button>
                  </span>
                  <span className="pad-8-l">
                    <Button
                      onClick={() => {
                        setActionsView("Send");
                        setIsActionsViewVisible(true);
                        setSelectedSendKey(bill.id);
                      }}
                      xSmall
                      type="button"
                      variant="primary"
                    >
                      Send
                    </Button>
                  </span>
                </div>

                <div key={bill.id} className="dashboard__info-item-wrap small">
                  <div className="dashboard__info-item-bill">
                    <div className="flex t-small t-bold c-light">
                      <span className="pad-8-r">ID:</span>{" "}
                      <span>{base64ToHexPrefixed(bill.id)}</span>
                    </div>
                    {lockedKeys.find((key) => key.billId === bill.id) && (
                      <>
                        <div className="flex t-small t-bold c-light">
                          <span className="pad-8-r">Desc:</span>{" "}
                          <span>
                            {
                              lockedKeys?.find((key) => key.billId === bill.id)
                                ?.desc
                            }
                          </span>
                        </div>
                        <div className="flex t-small t-bold c-light">
                          <span className="pad-8-r">Value:</span>{" "}
                          <span>
                            {
                              lockedKeys?.find((key) => key.billId === bill.id)
                                ?.value
                            }
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                  <span className="pad-16-l">
                    <Button
                      onClick={() =>
                        setVisibleBillSettingID(
                          visibleBillSettingID === bill.id ? null : bill.id
                        )
                      }
                      className="bills-list__settings"
                      variant="icon"
                    >
                      <MoreIco
                        className="textfield__btn"
                        width="26"
                        height="12px"
                      />
                    </Button>
                  </span>
                </div>
              </div>
            ))}
        </div>
        {sortedList.filter(
          (b: IBill) =>
            b.isDCBill === false &&
            !lockedKeys.find((key) => key.billId === b.id)
        ).length >= 1 && (
          <>
            <Spacer mt={32} />
            <div className="t-medium pad-24-h c-primary">UNCOLLECTED BILLS</div>
          </>
        )}
        {sortedList
          .filter(
            (b: IBill) =>
              b.isDCBill === false &&
              !lockedKeys.find((key) => key.billId === b.id)
          )
          .map((bill: IBill, idx: number) => {
            const isNewDenomination = denomination !== bill.value && true;
            const amountOfGivenDenomination = billsList?.bills.filter(
              (b: IBill) => b.value === bill.value
            ).length;
            denomination = bill.value;

            return (
              <div key={bill.id}>
                {isNewDenomination &&
                  sortedList.filter(
                    (bill: IBill) => bill.value === amountOfGivenDenomination
                  ).length > 1 && (
                    <>
                      {idx !== 0 && <Spacer mt={32} />}
                      <div className="t-medium-small pad-24-h flex flex-align-c">
                        Denomination: {bill.value}{" "}
                        <span className="t-medium pad-8-l">
                          (total of {amountOfGivenDenomination} bill{""}
                          {amountOfGivenDenomination > 1 && "s"})
                        </span>
                      </div>
                      <Spacer mt={8} />
                      <span className="pad-24-h flex">
                        <Button
                          onClick={() => {
                            setIsLoadingID(bill.value);
                            if (password) {
                              handleDC(
                                sortedList.filter(
                                  (b: IBill) => b.value === bill.value
                                )
                              );
                            } else {
                              setFirstBills(
                                sortedList.filter(
                                  (b: IBill) => b.value === bill.value
                                )
                              );
                              setPasswordFormType("DC");
                            }
                          }}
                          small
                          type="button"
                          variant="secondary"
                          className="w-100p"
                          working={isLoadingID === bill.value}
                        >
                          DC All {bill.value} AB Bills
                        </Button>
                      </span>
                      <Spacer mt={4} />
                    </>
                  )}
                <div
                  className={visibleBillSettingID === bill.id ? "" : "d-none"}
                >
                  <Spacer mt={12} />
                  <div className="flex flex-align-c pad-24-h">
                    <Spacer mt={8} />
                    <Button
                      onClick={() => {
                        setActiveBillId(bill.id);
                        setIsProofVisible(true);
                        queryClient.invalidateQueries([
                          "proof",
                          base64ToHexPrefixed(bill.id),
                        ]);
                      }}
                      xSmall
                      type="button"
                      variant="primary"
                    >
                      Proof
                    </Button>
                    <span className="pad-8-l">
                      <Button
                        onClick={() => {
                          if (password) {
                            handleDC([
                              {
                                id: bill.id,
                                value: bill.value,
                                txHash: bill.txHash,
                              },
                            ]);
                          } else {
                            setFirstBills([
                              {
                                id: bill.id,
                                value: bill.value,
                                txHash: bill.txHash,
                              },
                            ]);
                            setPasswordFormType("DC");
                          }
                        }}
                        xSmall
                        type="button"
                        variant="primary"
                      >
                        Collect
                      </Button>
                    </span>
                    <span className="pad-8-l">
                      <Button
                        onClick={() => {
                          setIsLockFormVisible(true);
                          setActiveBillId(bill.id);
                        }}
                        xSmall
                        type="button"
                        variant="primary"
                      >
                        Lock
                      </Button>
                    </span>
                    <span className="pad-8-l">
                      <Button
                        onClick={() => {
                          setActionsView("Send");
                          setIsActionsViewVisible(true);
                          setSelectedSendKey(bill.id);
                        }}
                        xSmall
                        type="button"
                        variant="primary"
                      >
                        Send
                      </Button>
                    </span>
                  </div>
                </div>
                <div key={bill.id} className="dashboard__info-item-wrap small">
                  <div className="dashboard__info-item-bill">
                    <div className="flex t-small t-bold c-light">
                      <span className="pad-8-r">ID:</span>{" "}
                      <span>{base64ToHexPrefixed(bill.id)}</span>
                    </div>
                    {sortedList.filter(
                      (bill: IBill) => bill.value === amountOfGivenDenomination
                    ).length <= 1 && (
                      <div className="flex t-small t-bold c-light">
                        <span className="pad-8-r">Value:</span>{" "}
                        <span>{bill.value}</span>
                      </div>
                    )}
                  </div>
                  <span className="pad-16-l">
                    <Button
                      onClick={() =>
                        setVisibleBillSettingID(
                          visibleBillSettingID === bill.id ? null : bill.id
                        )
                      }
                      className="bills-list__settings"
                      variant="icon"
                    >
                      <MoreIco
                        className="textfield__btn"
                        width="26"
                        height="12px"
                      />
                    </Button>
                  </span>
                </div>
              </div>
            );
          })}
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
                setIsLoadingID(null);
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
              if (firstBills && passwordFormType === "DC") {
                setPassword(values.password);
                setPasswordFormType(null);
                handleDC(firstBills, values.password);
              } else if (passwordFormType === "swap") {
                setPassword(values.password);
                handleSwap(values.password);
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
              setLockedKeys([
                ...lockedKeys,
                {
                  billId: activeBillId,
                  desc: values.desc,
                  value: sortedList.find(
                    (bill: IBill) => bill.id === activeBillId
                  ).value,
                },
              ]);
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
