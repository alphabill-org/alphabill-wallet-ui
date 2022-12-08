import { useState } from "react";
import { Checkbox, FormControlLabel } from "@mui/material";
import classNames from "classnames";
import { Formik } from "formik";
import * as Yup from "yup";

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

function Header(): JSX.Element | null {
  const [showTestNetworks, setShowTestNetworks] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const {
    setIsActionsViewVisible,
    setActionsView,
    account,
    accounts,
    setAccounts,
    networks,
    setNetworksLocal
  } = useApp();

  const testNetworks = account?.networks?.filter(
    (network) => network.isTestNetwork === true
  );
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
          <div className="select__popover">
            <div className="select__popover-header">
              <div>Select Network</div>
              <Close onClick={() => setIsPopoverOpen(!isPopoverOpen)} />
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
              {testNetworks?.map((network) => {
                return (
                  <div
                    key={network.id}
                    className={classNames("select__option", {
                      "select__option--hidden":
                        !showTestNetworks && !Boolean(isTestNetworkActive),
                    })}
                    onClick={() => {
                      const updatedAccounts = accounts?.map((obj) => {
                        if (account?.pubKey === obj?.pubKey) {
                          return { ...obj, activeNetwork: network.id };
                        } else return { ...obj };
                      });
                      setIsPopoverOpen(false);
                      setAccounts(updatedAccounts);
                    }}
                  >
                    {network.id}{" "}
                    {network.id === account?.activeNetwork && <Check />}
                  </div>
                );
              })}
            </div>
          </div>
          <Formik
            initialValues={{
              moneyPartition: "",
              backend: "",
              name: "",
            }}
            validationSchema={Yup.object().shape({
              url: Yup.string().required("URL is required"),
              name: Yup.string().required("Name is required"),
            })}
            onSubmit={(values, { resetForm }) => {
              setNetworksLocal(
                JSON.stringify([
                  ...networks,
                  {
                    moneyPartitionAPI: values.moneyPartition,
                    backendAPI: values.backend,
                    id: values.name,
                    isTestNetwork: true,
                    isActive: true
                  },
                ])
              );
              resetForm();
            }}
          >
            {(formikProps) => {
              const { handleSubmit, errors, touched } = formikProps;

              return (
                <div className="pad-24-h bg-white">
                  <Spacer mt={16} />
                  <form onSubmit={handleSubmit}>
                    <Form>
                      <FormContent>
                        <Textfield
                          id="backend"
                          name="backend"
                          label="Add new network backend URL"
                          type="backend"
                          error={extractFormikError(errors, touched, ["backend"])}
                        />
                        <Textfield
                          id="moneyPartition"
                          name="moneyPartition"
                          label="Add new money partition URL"
                          type="moneyPartition"
                          error={extractFormikError(errors, touched, ["moneyPartition"])}
                        />
                        <Textfield
                          id="name"
                          name="name"
                          label="Add network name"
                          type="name"
                          error={extractFormikError(errors, touched, ["name"])}
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
