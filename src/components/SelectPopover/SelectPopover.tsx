import classNames from 'classnames';
import { MouseEvent, ReactElement, ReactNode, useCallback, useRef } from 'react';

import CloseIcon from '../../images/close.svg?react';

export interface ISelectPopoverProps {
  onClose: () => void;
  isPopoverVisible: boolean;
  title: string;
  children: ReactNode;
}

export function SelectPopover({ isPopoverVisible, onClose, title, children }: ISelectPopoverProps): ReactElement {
  const popupRef = useRef<HTMLDivElement>(null);

  const closePopover = useCallback(
    (ev: MouseEvent) => {
      ev.stopPropagation();
      onClose();
    },
    [onClose],
  );

  return (
    <div
      className={classNames('select__popover-wrap', {
        'select__popover-wrap--open': isPopoverVisible,
      })}
      onClick={closePopover}
    >
      <div className="select__popover" ref={popupRef}>
        <div className="select__popover-header">
          <div>{title}</div>
          <CloseIcon onClick={closePopover} />
        </div>
        {children}
      </div>
    </div>
  );
}
