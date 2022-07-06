import classNames from "classnames";

import Spacer from "../Spacer/Spacer";
import { ReactComponent as Close } from "../../images/close.svg";


export interface IPopupProps {
  setAccounts?: (e: any) => void;
  setIsPopupVisible: (e: any) => void;
  isPopupVisible: boolean;
  title: string;
  children: React.ReactNode;
}

function Popup({
  setAccounts,
  setIsPopupVisible,
  isPopupVisible,
  title,
  children
}: IPopupProps): JSX.Element | null {
  return (
    <div
      className={classNames("popup__wrap", {
        "is-visible": Boolean(isPopupVisible),
      })}
    >
      <div className="popup">
        <div className="popup__header">
          <p>{title}</p>
          <Close onClick={() => setIsPopupVisible(null)} />
        </div>
        {children}
      </div>
    </div>
  );
}

export default Popup;
