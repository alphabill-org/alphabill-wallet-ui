import classNames from "classnames";
import { useEffect, useRef } from "react";

import { ReactComponent as Close } from "../../images/close.svg";
import { useDocumentClick } from "../../utils/utils";

export interface IPopupProps {
  setIsPopupVisible?: (e: boolean) => void;
  isPopupVisible: boolean;
  title: string;
  children: React.ReactNode;
}

function Popup({
  setIsPopupVisible,
  isPopupVisible,
  title,
  children,
}: IPopupProps): JSX.Element | null {
  const popupRef = useRef<HTMLDivElement>(null);
  const isVisibleRef = useRef<boolean>(isPopupVisible);

  useDocumentClick(() => {
    isVisibleRef.current && setIsPopupVisible && setIsPopupVisible(false);
  }, popupRef);

  useEffect(() => {
    isVisibleRef.current = isPopupVisible;
  }, [isPopupVisible]);

  return (
    <div
      className={classNames("popup__wrap", {
        "is-visible": Boolean(isPopupVisible),
      })}
    >
      <div className="popup" ref={popupRef}>
        <div className="popup__header">
          <p>{title}</p>
          {setIsPopupVisible && (
            <Close onClick={() => setIsPopupVisible(false)} />
          )}
        </div>
        {children}
      </div>
    </div>
  );
}

export default Popup;
