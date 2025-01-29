import { Key, ReactElement, ReactNode, useCallback, useState, MouseEvent } from 'react';

import ArrowIcon from '../../images/arrow.svg?react';
import { Button } from '../Button/Button';
import { SelectPopover } from '../SelectPopover/SelectPopover';

interface ISelectBoxProps<T> {
  title: string;
  selectedItem?: ReactNode;
  className?: string;
  data: T[];
  select: (item: T) => void;
  getOptionKey: (item: T) => Key;
  createOption: (item: T) => ReactNode;
}

export function SelectBox<T>({
  selectedItem,
  className,
  title,
  data,
  select,
  getOptionKey,
  createOption,
}: ISelectBoxProps<T>): ReactElement {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const openPopover = useCallback(
    (ev: MouseEvent) => {
      ev.stopPropagation();
      setIsPopoverOpen(true);
    },
    [setIsPopoverOpen],
  );

  const closePopover = useCallback(() => {
    setIsPopoverOpen(false);
  }, [setIsPopoverOpen]);

  return (
    <div className={`select ${className ?? ''}`} onClick={openPopover}>
      <Button variant="icon" className="select__button">
        <span className="select__button--text">{selectedItem ?? '--- SELECT ---'}</span>
        <ArrowIcon className="select__button--icon" />
      </Button>
      <SelectPopover onClose={closePopover} isPopoverVisible={isPopoverOpen} title={title}>
        <div className="select__options">
          {data.map((item) => {
            return (
              <div
                key={getOptionKey(item)}
                className="select__option"
                onClick={(ev) => {
                  ev.stopPropagation();
                  select(item);
                  setIsPopoverOpen(false);
                }}
              >
                {createOption(item)}
              </div>
            );
          })}
        </div>
      </SelectPopover>
    </div>
  );
}
