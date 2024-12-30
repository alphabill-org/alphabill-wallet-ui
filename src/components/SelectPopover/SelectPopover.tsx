import classNames from "classnames";
import { useEffect, useRef } from "react";

import Close from "../../images/close.svg?react";
import { useDocumentClick } from "../../utils/utils";

export interface ISelectPopoverProps {
  onClose: () => void;
  isPopoverVisible: boolean;
  title: string;
  children: React.ReactNode;
}

function SelectPopover({ isPopoverVisible, onClose, title, children }: ISelectPopoverProps): JSX.Element | null {
  const popupRef = useRef<HTMLDivElement>(null);
  const isVisibleRef = useRef<boolean>(isPopoverVisible);

  useDocumentClick(() => {
    isVisibleRef.current && onClose();
  }, popupRef);

  useEffect(() => {
    isVisibleRef.current = isPopoverVisible;
  }, [isPopoverVisible]);

  return (
    <div
      className={classNames("select__popover-wrap", {
        "select__popover-wrap--open": isPopoverVisible,
      })}
    >
      <div className="select__popover" ref={popupRef}>
        <div className="select__popover-header">
          <div>{title}</div>
          <Close
            onClick={() => {
              onClose();
            }}
          />
        </div>
        {children}
      </div>
    </div>
  );
}

export default SelectPopover;
