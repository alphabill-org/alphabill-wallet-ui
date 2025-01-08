import classNames from "classnames";
import { ReactElement } from "react";
import LogoIcon from "../../images/ab-logo-ico.svg?react";
import ArrowIcon from "../../images/arrow.svg?react";
import CheckIcon from "../../images/check.svg?react";
import CopyIcon from "../../images/copy-ico.svg?react";
import ProfileIcon from "../../images/profile.svg?react";
import Button from "../Button/Button";
import SelectPopover from "../SelectPopover/SelectPopover";

function Header(): ReactElement | null {
  // const [showTestNetworks, setShowTestNetworks] = useState(false);
  // const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  // const { setIsActionsViewVisible, setActionsView, account, accounts, setAccounts } = useApp();
  //
  // const testNetworks = account?.networks?.filter((network) => network.isTestNetwork === true);
  // const isTestNetworkActive = account?.networks?.find(
  //   (network) => network.isTestNetwork === true && account?.activeNetwork === network.id,
  // );
  // const mainNetworks = account?.networks?.filter((network) => network.isTestNetwork !== true);
  // const popupRef = useRef<HTMLDivElement>(null);
  //
  // useDocumentClick(() => {
  //   isPopoverOpen && setIsPopoverOpen(false);
  // }, popupRef);

  return (
    <div className="header">
      <div className="header__ico">
        <LogoIcon className="header__ico" />
      </div>
      <div className="header__select">
        <Button
          variant="icon"
          className="select__button"
          onClick={() => {
            // Open account options
          }}
        >
          ACCOUNT NAME
          <ArrowIcon className="select__button--icon" />
        </Button>
        {/* COPY PUBLIC KEY */}
        <Button id="copy-tooltip" tooltipContent="Key copied" variant="icon" className="copy__button">
          <CopyIcon className="tere" />
        </Button>
        <SelectPopover
          onClose={() => {
            // Open network selection
          }}
          isPopoverVisible={false}
          title="SELECT NETWORK"
        >
          <>
            {/*{mainNetworks?.length >= 1 && (*/}
            {/*  <div className="select__popover-checkbox">*/}
            {/*    <Checkbox*/}
            {/*      label="Show test networks"*/}
            {/*      isChecked={showTestNetworks || Boolean(isTestNetworkActive)}*/}
            {/*      onChange={() => setShowTestNetworks(!showTestNetworks)}*/}
            {/*    />*/}
            {/*  </div>*/}
            {/*)}*/}
            NETWORK CHECKBOX
            <div className="select__options">
              SELECT NETWORK
              <div
                className={classNames("select__popover-test-networks", {
                  "select__popover-test-networks--hidden": false,
                })}
              >
                Test networks
              </div>
              {[]?.map(() => {
                return (
                  <div
                    key={/* ID */ 1}
                    className={classNames("select__option", {
                      "select__option--hidden": true,
                    })}
                    onClick={() => {

                    }}
                  >
                    NETWORK ID | <CheckIcon />
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
          // PROFILE VIEW
        }}
      >
        <ProfileIcon className="header__settings" />
      </Button>
    </div>
  );
}

export default Header;
