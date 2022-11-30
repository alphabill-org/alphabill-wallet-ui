import axios from "axios";
import CryptoJS from "crypto-js";
import { Uint64BE } from "int64-buffer";
import * as secp from "@noble/secp256k1";
import { Formik } from "formik";
import * as Yup from "yup";
import classNames from "classnames";
import { useQueryClient } from "react-query";

import { Form, FormFooter, FormContent } from "../../Form/Form";
import Textfield from "../../Textfield/Textfield";
import { extractFormikError } from "../../../utils/utils";
import {
  IBill,
  IProofsProps,
  ISwapProofProps,
  ISwapProps,
  ITransfer,
} from "../../../types/Types";
import { useApp } from "../../../hooks/appProvider";
import { useAuth } from "../../../hooks/useAuth";
import Spacer from "../../Spacer/Spacer";
import Button from "../../Button/Button";
import {
  API_URL,
  getBlockHeight,
  makeTransaction,
} from "../../../hooks/requests";
import { ReactComponent as Close } from "../../../images/close.svg";
import Check from "../../../images/checkmark.gif";
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
} from "../../../utils/utils";
import { useState } from "react";
import { useGetProof } from "../../../hooks/api";

function BillsList(): JSX.Element | null {
  const [password, setPassword] = useState<string>("");
  const [firstBills, setFirstBills] = useState<IBill[]>([]);
  const [isFormVisible, setIsFormVisible] = useState<boolean>(false);
  const [isLoadingID, setIsLoadingID] = useState<number | null>();
  const { billsList, account } = useApp();
  const [swapList, setSwapList] = useState<string[]>([]);
  const [transferMsgHashes, setTransferMsgHashes] = useState<Uint8Array[]>([]);
  const sortedList = billsList?.bills?.sort(
    (a: IBill, b: IBill) => Number(a.value) - Number(b.value)
  );
  const [activeBillId, setActiveBillId] = useState<string>(sortedList[0]?.id);
  const [isProofVisible, setIsProofVisible] = useState<boolean>(false);
  const { data: proof } = useGetProof(base64ToHexPrefixed(activeBillId));
  const queryClient = useQueryClient();

  const { vault } = useAuth();

  let denomination: number | null = null;

  const handleDC = (bills: IBill[], formPassword?: string) => {
    const { hashingPrivateKey, hashingPublicKey } = getKeys(
      formPassword || password,
      Number(account.idx),
      vault
    );

    if (!hashingPublicKey || !hashingPrivateKey) return;
    let total = 0;
    bills.map((bill: IBill) => {
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
          makeTransaction(dataWithProof).then(() =>
            setSwapList([...swapList, bill.id.toString()])
          );
        setSwapList([...swapList, bill.id.toString()]);

        setIsLoadingID(null);
      });
    });
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
    const { hashingPrivateKey, hashingPublicKey } = getKeys(
      formPassword || password,
      Number(account.idx),
      vault
    );

    if (!hashingPublicKey || !hashingPrivateKey) return;
    let total = 0;
    let nonce: Buffer[] = [];
    let dc_transfers: any = [];
    let proofs: any = [];

    swapList.map((id: string) => {
      axios
        .get<IProofsProps>(
          `${API_URL}/proof?bill_id=${base64ToHexPrefixed(id)}`
        )
        .then(({ data }) => {
          total = total + 1;
          const tx = data.bills[0].txProof.tx;
          const proof = data.bills[0].txProof.proof;

          dc_transfers.push({
            system_id: tx.systemId,
            unit_id: tx.unitId,
            type: tx.transactionAttributes["@type"],
            attributes: tx.transactionAttributes,
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

          if (total - 1 === swapList.length) {
            handleSwapRequest();
          }
        });

      sortedList.map((bill: IBill) =>
        nonce.push(Buffer.from(bill.id.substring(2), "hex"))
      );

      const handleSwapRequest = async () => {
        if (!nonce.length) return;
        const nonceHash = await secp.utils.sha256(Buffer.concat(nonce));
        getBlockHeight().then(async (blockData) => {
          const transferData: ISwapProps = {
            system_id: "AAAAAA==",
            unit_id: Buffer.from(nonceHash).toString("base64"),
            type: "SwapOrder",
            attributes: {
              bill_identifiers: swapList,
              dc_transfers: dc_transfers,
              owner_condition: newBearer,
              proofs: proofs,
              target_value: 10,
            },
            timeout: blockData.blockHeight + 42,
            owner_proof: "",
          };

          const identifiersBuffer =
            transferData.attributes.bill_identifiers.map((i) =>
              Buffer.from(i, "base64")
            );

          const proofsBuffer = proofs.map((p: ISwapProofProps) => {
            const chainItems = p.block_tree_hash_chain.items.map(i => Buffer.concat([Buffer.from(i.val), Buffer.from(i.hash)]));
            const treeHashes = p.unicity_certificate.unicity_tree_certificate.sibling_hashes.map(i => Buffer.from(i));
            const signatureHashes = Object.values(p.unicity_certificate.unicity_seal.signatures).map(s => Buffer.from(s));

            return [
              Buffer.from(p.proof_type),
              Buffer.from(p.block_header_hash, "base64"),
              Buffer.from(p.transactions_hash, "base64"),
              Buffer.concat(chainItems),
              Buffer.from(p.unicity_certificate.input_record.previous_hash, "base64"),
              Buffer.from(p.unicity_certificate.input_record.hash, "base64"),
              Buffer.from(p.unicity_certificate.input_record.block_hash, "base64"),
              Buffer.from(p.unicity_certificate.input_record.summary_value, "base64"),
              Buffer.from(p.unicity_certificate.unicity_tree_certificate.system_identifier, "base64"),
              Buffer.concat(treeHashes),
              Buffer.from(p.unicity_certificate.unicity_tree_certificate.system_description_hash, "base64"),
              new Uint64BE(p.unicity_certificate.unicity_seal.root_chain_round_number).toBuffer(),
              Buffer.from(p.unicity_certificate.unicity_seal.previous_hash, "base64"),
              Buffer.from(p.unicity_certificate.unicity_seal.hash, "base64"),
              Buffer.concat(signatureHashes),
            ];
          });

          const msgHash = await secp.utils.sha256(
            secp.utils.concatBytes(
              Buffer.from(transferData.system_id, "base64"),
              Buffer.from(transferData.unit_id, "base64"),
              new Uint64BE(transferData.timeout).toBuffer(),
              Buffer.from(transferData.attributes.owner_condition, "base64"),
              Buffer.concat(identifiersBuffer),
              Buffer.concat(transferMsgHashes),
              Buffer.concat(proofsBuffer),
              new Uint64BE(transferData.attributes.target_value).toBuffer()
            )
          );

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
            owner_proof: ownerProof
          });

          isValid && makeTransaction(dataWithProof)
        });
      };
    });
  };

  return (
    <>
      <div className="dashboard__info-col active relative">
        <Spacer mt={16} />
        <div className="t-medium-small pad-24-h">
          To swap your bills into one bigger bill click on the Dust Collection
          button next to the given bill and then click on Swap Bills button.
          <Spacer mt={8} />
          <Button
            disabled={swapList.length <= 0}
            className="w-100p"
            small
            type="button"
            variant="primary"
            onClick={() => handleSwap()}
          >
            Swap Bills
          </Button>
        </div>
        <Spacer mt={16} />
        <div>
          {swapList.length > 0 && (
            <>
              <div className="t-medium pad-24-h">Bills ready to swap:</div>
              <Spacer mt={4} />
            </>
          )}

          {sortedList
            .filter((b: IBill) => swapList.includes(b.id))
            .map((bill: IBill) => (
              <div key={bill.id} className="dashboard__info-item-wrap small">
                <div className="dashboard__info-item-bill">
                  <div className="flex t-small c-light">
                    <span className="pad-8-r">ID:</span>{" "}
                    <span>{base64ToHexPrefixed(bill.id)}</span>
                  </div>
                </div>
              </div>
            ))}
        </div>

        <Spacer mt={32} />
        {sortedList
          .filter((b: IBill) => !swapList.includes(b.id))
          .map((bill: IBill, idx: number) => {
            const isNewDenomination = denomination !== bill.value && true;
            const amountOfGivenDenomination = billsList?.bills.filter(
              (b: IBill) => b.value === bill.value
            ).length;
            denomination = bill.value;

            return (
              <div key={bill.id}>
                {isNewDenomination && (
                  <>
                    {idx !== 0 && <Spacer mt={32} />}
                    <div className="t-medium pad-24-h flex flex-align-c">
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
                            setIsFormVisible(true);
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
                <div key={bill.id} className="dashboard__info-item-wrap small">
                  <div className="dashboard__info-item-bill">
                    <div className="flex t-small c-light">
                      <span className="pad-8-r">ID:</span>{" "}
                      <span>{base64ToHexPrefixed(bill.id)}</span>
                    </div>
                  </div>
                  <span className="pad-16-l button__group">
                    <Button
                      onClick={() => {
                        setActiveBillId(bill.id);
                        setIsProofVisible(true);
                        queryClient.invalidateQueries([
                          "proof",
                          base64ToHexPrefixed(bill.id),
                        ]);
                      }}
                      small
                      type="button"
                      variant="primary"
                    >
                      Proof
                    </Button>

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
                          setIsFormVisible(true);
                        }
                      }}
                      small
                      type="button"
                      variant="primary"
                    >
                      DC
                    </Button>
                  </span>
                </div>
              </div>
            );
          })}
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
          "select__popover-wrap--open": isFormVisible,
        })}
      >
        <div className="select__popover">
          <div className="select__popover-header">
            <div>INSERT PASSWORD TO TRANSFER</div>
            <Close
              onClick={() => {
                setIsLoadingID(null);
                setIsFormVisible(!isFormVisible);
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
              if (firstBills) {
                setPassword(values.password);
                setIsFormVisible(false);
                handleDC(firstBills, values.password);
              }
            }}
          >
            {(formikProps) => {
              const { handleSubmit, errors, touched } = formikProps;

              return (
                <form className="pad-24-h" onSubmit={handleSubmit}>
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
              );
            }}
          </Formik>
        </div>
      </div>
    </>
  );
}

export default BillsList;
