import axios from "axios";
import CryptoJS from "crypto-js";
import { Uint64BE } from "int64-buffer";
import * as secp from "@noble/secp256k1";
import { Formik } from "formik";
import * as Yup from "yup";
import classNames from "classnames";
import { Form, FormFooter, FormContent } from "../../Form/Form";
import Textfield from "../../Textfield/Textfield";
import { extractFormikError } from "../../../utils/utils";

import { IBill, ITransfer } from "../../../types/Types";
import { useApp } from "../../../hooks/appProvider";
import { useAuth } from "../../../hooks/useAuth";
import Spacer from "../../Spacer/Spacer";
import Button from "../../Button/Button";
import { getBlockHeight, makeTransaction } from "../../../hooks/requests";
import { ReactComponent as Close } from "../../../images/close.svg";

import {
  getKeys,
  pubKeyToHex,
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
function BillsList(): JSX.Element | null {
  const [password, setPassword] = useState<string>("");
  const [firstBills, setFirstBills] = useState<IBill[]>([]);
  const [isFormVisible, setIsFormVisible] = useState<boolean>(false);
  const [isLoadingID, setIsLoadingID] = useState<number | null>();
  const { billsList, account } = useApp();
  const sortedList = billsList?.bills?.sort(
    (a: IBill, b: IBill) => Number(a.value) - Number(b.value)
  );
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
      axios
        .get<any>(
          `https://dev-ab-wallet-backend.abdev1.guardtime.com/block-proof?bill_id=${bill.id}`
        )
        .then(async (proofData) => {
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
              unit_id: Buffer.from(bill.id.substring(2), "hex").toString(
                "base64"
              ),
              type: "TransferDCOrder",
              attributes: {
                backlink: proofData.data.blockProof.transactions_hash,
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
                Buffer.from(
                  Buffer.from(nonceHash).toString("base64"),
                  "base64"
                ),
                Buffer.from(
                  transferData.attributes.target_bearer as string,
                  "base64"
                ),
                new Uint64BE(transferData.attributes.target_value).toBuffer(),
                Buffer.from(
                  proofData.data.blockProof.transactions_hash,
                  "base64"
                )
              )
            );

            const signature = await secp.sign(msgHash, hashingPrivateKey, {
              der: false,
              recovered: true,
            });

            const isValid = secp.verify(
              signature[0],
              msgHash,
              hashingPublicKey
            );

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
                pubKeyToHex(hashingPublicKey).substring(2),
              "hex"
            ).toString("base64");

            const dataWithProof = Object.assign(transferData, {
              owner_proof: ownerProof,
              timeout: blockData.blockHeight + 42,
            });
            console.log(bills.length, total);

            isValid && makeTransaction(dataWithProof);
            setIsLoadingID(null);
          });
        });

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
            disabled={true}
            className="w-100p"
            small
            type="button"
            variant="primary"
          >
            Swap Bills
          </Button>
        </div>

        <Spacer mt={32} />
        {sortedList.map((bill: IBill, idx: number) => {
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
                  <div className="t-regular pad-24-h flex flex-align-c">
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
                          console.log(bill.value);

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
                  <Spacer mt={16} />
                </>
              )}
              <div key={bill.id} className="dashboard__info-item-wrap small">
                <div className="dashboard__info-item-bill">
                  <div className="flex t-small c-light">
                    <span className="pad-8-r">ID:</span> <span>{bill.id}</span>
                  </div>
                </div>
                <span className="pad-16-l">
                  <Button
                    onClick={() => {
                      if (password) {
                        handleDC([{ id: bill.id, value: bill.value }]);
                      } else {
                        setFirstBills([{ id: bill.id, value: bill.value }]);
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
          "select__popover-wrap--open": isFormVisible,
        })}
      >
        <div className="select__popover">
          <div className="select__popover-header">
            <div>INSERT PASSWORD TO TRANSFER</div>
            <Close onClick={() => setIsFormVisible(!isFormVisible)} />
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
