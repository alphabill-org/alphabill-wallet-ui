import { useRef, useState } from "react";
import classNames from "classnames";

import Button from "../Button/Button";
import { ReactComponent as Check } from "../../images/check.svg";
import { useApp } from "../../hooks/appProvider";
import Checkbox from "../Checkbox/Checkbox";
import { useDocumentClick } from "../../utils/utils";
import SelectPopover from "../SelectPopover/SelectPopover";
import { ProfileView } from "../../utils/constants";
import { ICLogo, ICSettings } from "../../css/icons";
import CopyToClipboard from "react-copy-to-clipboard";
import { ICCopy } from "../../css/icons/ICCopy";
import { ICDown } from "../../css/icons/ICDown";

function Header(): JSX.Element | null {
  const [showTestNetworks, setShowTestNetworks] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const {
    setIsActionsViewVisible,
    setActionsView,
    account,
    accounts,
    setAccounts,
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
  const popupRef = useRef<HTMLDivElement>(null);

  useDocumentClick(() => {
    isPopoverOpen && setIsPopoverOpen(false);
  }, popupRef);

  return (
    <div className="header">
      <div className="header__ico">
        <ICLogo className="header__ico"/>
      </div>
      <div className="header__select">
        <Button
          variant="icon"
          className="select__button"
          onClick={() => setIsPopoverOpen(!isPopoverOpen)}
        >
          { account?.name}
          <ICDown className="select__button--icon"/>
        </Button>
        <CopyToClipboard text={account?.pubKey || ""}>
          <Button
            id="copy-tooltip"
            tooltipContent="Key copied"
            variant="icon"
            className="copy__button"
          >
            <ICCopy />
          </Button>
        </CopyToClipboard>
        <SelectPopover
          onClose={() => {
            setIsPopoverOpen(!isPopoverOpen);
          }}
          isPopoverVisible={isPopoverOpen}
          title="SELECT NETWORK"
        >
          <>
            {mainNetworks?.length >= 1 && (
              <div className="select__popover-checkbox">
                <Checkbox
                  label="Show test networks"
                  isChecked={showTestNetworks || Boolean(isTestNetworkActive)}
                  onChange={() => setShowTestNetworks(!showTestNetworks)}
                />
              </div>
            )}
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
                Test networks
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
          </>
        </SelectPopover>
      </div>
      <Button
        variant="icon"
        onClick={() => {
          setActionsView(ProfileView);
          setIsActionsViewVisible(true);
        }}
      >
        <ICSettings className="header__settings"/>
      </Button>
    </div>
  );
}

export default Header;
