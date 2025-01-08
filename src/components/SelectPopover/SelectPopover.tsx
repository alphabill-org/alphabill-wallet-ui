import classNames from "classnames";
import { ReactElement, useEffect, useRef } from "react";

import CloseIcon from "../../images/close.svg?react";

export interface ISelectPopoverProps {
  onClose: () => void;
  isPopoverVisible: boolean;
  title: string;
  children: React.ReactNode;
}

function SelectPopover({ isPopoverVisible, onClose, title, children }: ISelectPopoverProps): ReactElement | null {
  const popupRef = useRef<HTMLDivElement>(null);
  const isVisibleRef = useRef<boolean>(isPopoverVisible);

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
          <CloseIcon
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
