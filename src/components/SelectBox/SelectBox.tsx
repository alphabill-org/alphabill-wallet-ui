import { PropsWithChildren, ReactElement, ReactNode, useState } from 'react';

import ArrowIcon from '../../images/arrow.svg?react';
import { Button } from '../Button/Button';
import { SelectPopover } from '../SelectPopover/SelectPopover';

export function SelectBox({
  selectedItem,
  className,
  title,
  children,
}: PropsWithChildren<{ title: string; selectedItem?: ReactNode; className?: string }>): ReactElement {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  return (
    <div
      className={`select ${className ?? ''}`}
      onClick={() => {
        setIsPopoverOpen(true);
      }}
    >
      <Button variant="icon" className="select__button">
        <span className="select__button--text">{selectedItem ?? '--- SELECT ---'}</span>
        <ArrowIcon className="select__button--icon" />
      </Button>
      <SelectPopover
        onClose={() => {
          setIsPopoverOpen(false);
        }}
        isPopoverVisible={isPopoverOpen}
        title={title}
      >
        {children}
      </SelectPopover>
    </div>
  );
}
