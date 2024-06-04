import { createContext, FunctionComponent, ReactElement, useContext, useRef, useState } from "react";
import classNames from "classnames";
import Button from "../Button/Button";
import Logo from "../../images/ab-logo-ico.svg?react";
import Profile from "../../images/profile.svg?react";
import Arrow from "../../images/arrow.svg?react";
import { useDocumentClick } from "../../utils/utils";
import SelectPopover from "../SelectPopover/SelectPopover";
import { ActionView } from "../../types/Types";
import Popup from "../Popup/Popup";
import { useNavigate } from "react-router-dom";

interface IAppContext {
  actionsView: ActionView | null;
  setActionsView: (e: ActionView) => void;
  isActionsViewVisible: boolean;
  setIsActionsViewVisible: (e: boolean) => void;
}

export const AppContext = createContext<IAppContext>(
  {} as IAppContext
);

export const AppProvider: FunctionComponent<{
  children: ReactElement | null;
}> = ({ children }) => {
  const [error, setError] = useState<string | null>(null);
  const [isActionsViewVisible, setIsActionsViewVisible] =
    useState<boolean>(false);
  const [actionsView, setActionsView] = useState<ActionView | null>(null);

  return (
    <AppContext.Provider
      value={{
        isActionsViewVisible,
        setIsActionsViewVisible,
        actionsView,
        setActionsView,
      }}
    >
      {children}
      <Popup
        isPopupVisible={Boolean(error)}
        setIsPopupVisible={() => {
          setError(null);
        }}
        title="Error"
      >
        <div className="pad-24-t w-100p">
          <h2 className="c-error m-auto-r">{error}</h2>
        </div>
      </Popup>
    </AppContext.Provider>
  );
};

export const useApp = (): IAppContext => useContext(AppContext);

function Header(): ReactElement | null {
  const navigate = useNavigate();
  // const [showTestNetworks, setShowTestNetworks] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const {
    setIsActionsViewVisible,
    setActionsView,
  } = useApp();

  // const testNetworks = account?.networks?.filter(
  //   (network) => network.isTestNetwork === true
  // );
  // const isTestNetworkActive = account?.networks?.find(
  //   (network) =>
  //     network.isTestNetwork === true && account?.activeNetwork === network.id
  // );
  // const mainNetworks = account?.networks?.filter(
  //   (network) => network.isTestNetwork !== true
  // );
  const popupRef = useRef<HTMLDivElement>(null);

  useDocumentClick(() => {
    isPopoverOpen && setIsPopoverOpen(false);
  }, popupRef);

  return (
    <div className="header">
      <div className="header__ico">
        <Button
          target="_blank"
          type="button"
          variant="icon"
          url="https://alphabill.org/"
        >
          <Logo height="40" width="40" />
        </Button>
      </div>
      <div className="header__select">
        <Button
          variant="icon"
          className="select__button"
          onClick={() => setIsPopoverOpen(!isPopoverOpen)}
        >
          {/*{account?.activeNetwork || "Select Network"}*/}
          <Arrow />
        </Button>
        <SelectPopover
          onClose={() => {
            setIsPopoverOpen(!isPopoverOpen);
          }}
          isPopoverVisible={isPopoverOpen}
          title="SELECT NETWORK"
        >
          <>
           {/* {mainNetworks?.length >= 1 && (
              <div className="select__popover-checkbox">
                <Checkbox
                  label="Show test networks"
                  isChecked={showTestNetworks || Boolean(isTestNetworkActive)}
                  onChange={() => setShowTestNetworks(!showTestNetworks)}
                />
              </div>
            )}*/}
            <div className="select__options">
              {/*mainNetworks?.map((network) => {
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
              })}*/}
              <div
                className={classNames("select__popover-test-networks", {
                  "select__popover-test-networks--hidden": false
                    // !showTestNetworks && !isTestNetworkActive,
                })}
              >
                Test networks
              </div>
              {/*{testNetworks?.map((network) => {*/}
              {/*  return (*/}
              {/*    <div*/}
              {/*      key={network.id}*/}
              {/*      className={classNames("select__option", {*/}
              {/*        "select__option--hidden":*/}
              {/*          !showTestNetworks && !isTestNetworkActive,*/}
              {/*      })}*/}
              {/*      onClick={() => {*/}
              {/*        const updatedAccounts = accounts?.map((obj) => {*/}
              {/*          if (account?.pubKey === obj?.pubKey) {*/}
              {/*            return { ...obj, activeNetwork: network.id };*/}
              {/*          } else return { ...obj };*/}
              {/*        });*/}
              {/*        setIsPopoverOpen(false);*/}
              {/*        setAccounts(updatedAccounts);*/}
              {/*      }}*/}
              {/*    >*/}
              {/*      {network.id}{" "}*/}
              {/*      {network.id === account?.activeNetwork && <Check />}*/}
              {/*    </div>*/}
              {/*  );*/}
              {/*})}*/}
            </div>
          </>
        </SelectPopover>
      </div>
      <Button
        variant="icon"
        onClick={() => {
          navigate('/profile');
        }}
      >
        <Profile className="profile-ico" height="32" width="32px" />
      </Button>
    </div>
  );
}

export default Header;
