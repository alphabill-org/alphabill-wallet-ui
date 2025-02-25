import { Key, ReactElement, ReactNode, useCallback, useState, MouseEvent, useMemo } from 'react';

import ArrowIcon from '../../images/arrow-ico.svg?react';
import { Button } from '../Button/Button';
import { SelectPopover } from '../SelectPopover/SelectPopover';

interface ISelectBoxProps<T> {
  readonly title: string;
  readonly label?: string;
  readonly selectedItem?: ReactNode;
  readonly className?: string;
  readonly data: Iterable<T>;
  readonly select: (item: T) => void;
  readonly getOptionKey: (item: T) => Key;
  readonly createOption: (item: T) => ReactNode;
  readonly addButton: ReactNode;
}

export function SelectBox<T>({
  selectedItem,
  className,
  title,
  label,
  data,
  select,
  getOptionKey,
  createOption,
  addButton,
}: ISelectBoxProps<T>): ReactElement {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const openPopover = useCallback(
    (ev: MouseEvent) => {
      ev.preventDefault();
      ev.stopPropagation();
      setIsPopoverOpen(true);
    },
    [setIsPopoverOpen],
  );

  const closePopover = useCallback(() => {
    setIsPopoverOpen(false);
  }, [setIsPopoverOpen]);

  const items = useMemo(() => {
    const result: ReactNode[] = [];
    for (const item of data) {
      result.push(
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
        </div>,
      );
    }

    return result;
  }, [data, createOption, select, getOptionKey]);

  return (
    <div className={`select ${className ?? ''}`}>
      {label && <div className="select__label">{label}</div>}
      <div className="select__body" onClick={openPopover}>
        <Button type="button" variant="icon" className="select__button">
          <span className="select__button--text">{selectedItem ?? '--- SELECT ---'}</span>
          <ArrowIcon className="select__button--icon" />
        </Button>
        <SelectPopover onClose={closePopover} isPopoverVisible={isPopoverOpen} title={title}>
          <div className="select__options">{items}</div>
          <div className="select__popover-footer">{addButton}</div>
        </SelectPopover>
      </div>
    </div>
  );
}
