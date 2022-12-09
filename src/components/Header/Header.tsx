import { useState } from "react";
import { Checkbox, FormControlLabel } from "@mui/material";
import classNames from "classnames";
import { Formik } from "formik";
import * as Yup from "yup";
import { useQueryClient } from "react-query";
import axios from "axios";

import Button from "../Button/Button";
import Logo from "../../images/ab-logo-ico.svg";
import Profile from "../../images/profile.svg";
import { ReactComponent as Arrow } from "../../images/arrow.svg";
import { ReactComponent as Close } from "../../images/close.svg";
import { ReactComponent as Check } from "../../images/check.svg";
import { useApp } from "../../hooks/appProvider";
import { Form, FormFooter, FormContent } from "../Form/Form";
import { extractFormikError } from "../../utils/utils";
import Textfield from "../Textfield/Textfield";
import Spacer from "../Spacer/Spacer";
import { INetwork } from "../../types/Types";
import Select from "../Select/Select";
import { useAuth } from "../../hooks/useAuth";

function Header(): JSX.Element | null {
  const [showTestNetworks, setShowTestNetworks] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isAddNetworkVisible, setIsAddNetworkVisible] = useState(false);
  const {
    setIsActionsViewVisible,
    setActionsView,
    account,
    accounts,
    setAccounts,
    networks,
    setNetworksLocal,
    activeNetwork,
  } = useApp();
  const { userKeys } = useAuth();

  const queryClient = useQueryClient();
  const isTestNetworkActive = account?.networks?.find(
    (network) =>
      network.isTestNetwork === true && account?.activeNetwork === network.id
  );
  const mainNetworks = account?.networks?.filter(
    (network) => network.isTestNetwork !== true
  );

  return (
    <div className="header">
      <div className="header__ico">
        <img height="32" src={Logo} alt="Alphabill" />
      </div>
      <div className="header__select">
        <Button
          variant="icon"
          className="select__button"
          onClick={() => setIsPopoverOpen(!isPopoverOpen)}
        >
          {account?.activeNetwork || "Select Network"}
          <Arrow />
        </Button>
        <div
          className={classNames("select__popover-wrap", {
            "select__popover-wrap--open": isPopoverOpen,
          })}
        >
          <div
            className={classNames("select__popover", {
              "select__popover--hidden": isAddNetworkVisible,
            })}
          >
            <div className="select__popover-header">
              <div>Select Network</div>
              <Close
                className="f-blue--all"
                onClick={() => setIsPopoverOpen(!isPopoverOpen)}
              />
            </div>
            <div className="select__popover-checkbox">
              <FormControlLabel
                control={
                  <Checkbox
                    checked={showTestNetworks || Boolean(isTestNetworkActive)}
                    onChange={() => setShowTestNetworks(!showTestNetworks)}
                    name="TestNetworks"
                    color="primary"
                  />
                }
                label="Show Test & Dev Networks"
              />
            </div>
            <div className="select__options">
              {mainNetworks?.map((network) => {
                return (
                  <div
                    key={network.id}
                    className="select__option"
                    onClick={() => {
                      const updatedAccounts = accounts?.map((obj) => {
                        if (account?.pubKey === obj?.pubKey) {
                          return { ...obj, activeNetwork: network.id };
                        } else return { ...obj };
                      });
                      setIsPopoverOpen(false);
                      setAccounts(updatedAccounts);
                      setShowTestNetworks(false);
                    }}
                  >
                    {network.id}{" "}
                    {network.id === account?.activeNetwork && <Check />}
                  </div>
                );
              })}
              <div
                className={classNames("select__popover-test-networks", {
                  "select__popover-test-networks--hidden":
                    !showTestNetworks && !Boolean(isTestNetworkActive),
                })}
              >
                Test & Dev Networks
              </div>
              {networks
                .filter((network: INetwork) => network.isTestNetwork === true)
                ?.map((network) => {
                  return (
                    <div
                      key={network.id}
                      className={classNames("select__option", {
                        "select__option--hidden":
                          !showTestNetworks && !Boolean(isTestNetworkActive),
                      })}
                      onClick={() => {
                        const updatedNetworks = networks?.map((obj) => {
                          if (network.id === obj?.id) {
                            return { ...obj, isActive: true };
                          } else return { ...obj, isActive: false };
                        });
                        setNetworksLocal(JSON.stringify(updatedNetworks));
                        queryClient.invalidateQueries([
                          "balance",
                          account?.pubKey,
                          activeNetwork?.backendAPI || "",
                        ]);
                        queryClient.invalidateQueries([
                          "billsList",
                          account?.pubKey,
                          activeNetwork?.backendAPI || "",
                        ]);
                        setIsPopoverOpen(false);
                      }}
                    >
                      {network.id}{" "}
                      {network.id === account?.activeNetwork && <Check />}
                    </div>
                  );
                })}
            </div>
          </div>
          <div
            onClick={() => setIsAddNetworkVisible(!isAddNetworkVisible)}
            className="select__popover-header bg-white"
          >
            <div>Add Network</div>
            <Arrow
              className={classNames("transition-all f-blue--all", {
                "rotate-0": !isAddNetworkVisible,
                "rotate-180": isAddNetworkVisible,
              })}
              height="26"
              width="26"
            />
          </div>
          {isAddNetworkVisible && (
            <Formik
              initialValues={{
                moneyPartitionAPI: "",
                backendAPI: "",
                name: "",
                networkType: "",
              }}
              validationSchema={Yup.object().shape({
                moneyPartitionAPI: Yup.string()
                  .required("Partition URL is required.")
                  .test(
                    "duplicate-moneyPartition-check",
                    "Partition URL all ready in use",
                    (moneyPartition) =>
                      !networks?.find(
                        (network) =>
                          network.moneyPartitionAPI === moneyPartition
                      )
                  ),
                name: Yup.string()
                  .required("Name is required.")
                  .test(
                    "duplicate-name-check",
                    "Name all ready in use",
                    (name) => !networks?.find((network) => network.id === name)
                  ),
                backendAPI: Yup.string()
                  .required("Backend URL is required.")
                  .test(
                    "duplicate-moneyPartition-check",
                    "Backend URL all ready in use",
                    (backend) =>
                      !networks?.find(
                        (network) => network.backendAPI === backend
                      )
                  ),
              })}
              onSubmit={(values, { resetForm, setErrors }) => {
                const updatedNetworks = networks?.map((obj) => {
                  if (values.name === obj?.id) {
                    return { ...obj, isActive: false };
                  } else return { ...obj };
                });

                values.backendAPI &&
                  userKeys?.split(" ")?.map((key: string) =>
                    axios
                      .post<void>(values.backendAPI + "/admin/add-key", {
                        pubkey: key,
                      })
                      .then(() => {
                        setNetworksLocal(
                          JSON.stringify([
                            ...updatedNetworks,
                            {
                              moneyPartitionAPI: values.moneyPartitionAPI,
                              backendAPI: values.backendAPI,
                              id: values.name,
                              isTestNetwork: values.networkType !== "mainNet",
                              isActive: true,
                            },
                          ])
                        );
                        setIsAddNetworkVisible(false);
                      })
                      .catch((e) => {
                        if (
                          e.response?.data?.message === "pubkey already exists"
                        ) {
                          setNetworksLocal(
                            JSON.stringify([
                              ...updatedNetworks,
                              {
                                moneyPartitionAPI: values.moneyPartitionAPI,
                                backendAPI: values.backendAPI,
                                id: values.name,
                                isTestNetwork: values.networkType !== "mainNet",
                                isActive: true,
                              },
                            ])
                          );
                          setIsAddNetworkVisible(false);
                        }
                        setErrors({ name: "Network not error" });
                      })
                  );

                resetForm();
              }}
            >
              {(formikProps) => {
                const { handleSubmit, errors, touched } = formikProps;

                return (
                  <div
                    className={classNames("pad-24-h bg-white", {
                      visible: isAddNetworkVisible,
                      hidden: !isAddNetworkVisible,
                    })}
                  >
                    <Spacer mt={16} />
                    <form className="pad-24-b" onSubmit={handleSubmit}>
                      <Form>
                        <FormContent>
                          <Select
                            label="Network type"
                            name="networkType"
                            options={[
                              {
                                value: "devNet",
                                label: "Development Network",
                              },
                              {
                                value: "mainNet",
                                label: "Main Network",
                              },
                              {
                                value: "testNet",
                                label: "Test Network",
                              },
                            ]}
                            error={extractFormikError(errors, touched, [
                              "networkType",
                            ])}
                          />
                          <Textfield
                            id="backendAPI"
                            name="backendAPI"
                            label="Add new network backend URL"
                            type="backendAPI"
                            error={extractFormikError(errors, touched, [
                              "backendAPI",
                            ])}
                          />
                          <Textfield
                            id="moneyPartitionAPI"
                            name="moneyPartitionAPI"
                            label="Add new money partition URL"
                            type="moneyPartitionAPI"
                            error={extractFormikError(errors, touched, [
                              "moneyPartitionAPI",
                            ])}
                          />
                          <Textfield
                            id="name"
                            name="name"
                            label="Add network name"
                            type="name"
                            error={extractFormikError(errors, touched, [
                              "name",
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
                            Add Network
                          </Button>
                        </FormFooter>
                      </Form>
                    </form>
                  </div>
                );
              }}
            </Formik>
          )}
        </div>
      </div>
      <Button
        variant="icon"
        onClick={() => {
          setActionsView("Account");
          setIsActionsViewVisible(true);
        }}
      >
        <img height="32" width="32px" src={Profile} alt="Profile" />
      </Button>
    </div>
  );
}

export default Header;
