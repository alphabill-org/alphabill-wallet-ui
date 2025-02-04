import classNames from 'classnames';
import { MouseEvent, ReactElement, ReactNode, useCallback, useEffect, useRef } from 'react';

import CloseIcon from '../../images/close-ico.svg?react';

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
      ev.preventDefault();
      ev.stopPropagation();
      onClose();
    },
    [onClose],
  );

  const keyboardClosePopover = useCallback(
    (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') {
        onClose();
      }
    },
    [onClose],
  );

  useEffect(() => {
    window.addEventListener('keyup', keyboardClosePopover);
    return (): void => {
      window.removeEventListener('keyup', keyboardClosePopover);
    };
  }, [closePopover]);

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
