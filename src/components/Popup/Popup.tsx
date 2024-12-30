import classNames from "classnames";
import { useEffect, useRef } from "react";

import Close from "../../images/close.svg?react";
import { useDocumentClick } from "../../utils/utils";

export interface IPopupProps {
  setIsPopupVisible?: (e: boolean) => void;
  isPopupVisible: boolean;
  isCloseBtnHidden?: boolean;
  isFixed?: boolean;
  isCloseOnDocumentClickDisabled?: boolean;
  title: string;
  children: React.ReactNode;
}

function Popup({
  setIsPopupVisible,
  isCloseOnDocumentClickDisabled,
  isCloseBtnHidden,
  isPopupVisible,
  isFixed,
  title,
  children,
}: IPopupProps): JSX.Element | null {
  const popupRef = useRef<HTMLDivElement>(null);
  const isVisibleRef = useRef<boolean>(isPopupVisible);

  useDocumentClick(() => {
    !isCloseOnDocumentClickDisabled && isVisibleRef.current && setIsPopupVisible && setIsPopupVisible(false);
  }, popupRef);

  useEffect(() => {
    isVisibleRef.current = isPopupVisible;
  }, [isPopupVisible]);

  return (
    <div
      className={classNames("popup__wrap", {
        "is-visible": Boolean(isPopupVisible),
        fixed: isFixed,
      })}
    >
      <div className="popup" ref={popupRef}>
        <div className="popup__header">
          <p>{title}</p>
          {!isCloseBtnHidden && setIsPopupVisible && <Close onClick={() => setIsPopupVisible(false)} />}
        </div>
        {children}
      </div>
    </div>
  );
}

export default Popup;
