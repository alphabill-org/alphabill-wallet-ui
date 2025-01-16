import classNames from "classnames";
import { ReactElement, ReactNode, useRef } from "react";

import CloseIcon from "../../images/close.svg?react";

export interface ISelectPopoverProps {
  onClose: () => void;
  isPopoverVisible: boolean;
  title: string;
  children: ReactNode;
}

export function SelectPopover({ isPopoverVisible, onClose, title, children }: ISelectPopoverProps): ReactElement {
  const popupRef = useRef<HTMLDivElement>(null);

  return (
    <div
      className={classNames("select__popover-wrap", {
        "select__popover-wrap--open": isPopoverVisible,
      })}
      onClick={(ev) => {
        if (ev.target === ev.currentTarget) {
          ev.stopPropagation();
          onClose();
        }
      }}
    >
      <div className="select__popover" ref={popupRef}>
        <div className="select__popover-header">
          <div>{title}</div>
          <CloseIcon
            onClick={(ev) => {
              ev.stopPropagation();
              onClose();
            }}
          />
        </div>
        {children}
      </div>
    </div>
  );
}
