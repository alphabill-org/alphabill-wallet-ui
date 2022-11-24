import classNames from "classnames";

import { ReactComponent as Close } from "../../images/close.svg";


export interface IPopupProps {
  setIsPopupVisible: (e: boolean) => void;
  isPopupVisible: boolean;
  title: string;
  children: React.ReactNode;
}

function Popup({
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
          <Close onClick={() => setIsPopupVisible(false)} />
        </div>
        {children}
      </div>
    </div>
  );
}

export default Popup;
