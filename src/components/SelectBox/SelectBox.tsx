import classNames from "classnames";
import { PropsWithChildren, ReactElement, useState } from "react";
import ArrowIcon from "../../images/arrow.svg?react";
import { Button } from "../Button/Button";
import { SelectPopover } from "../SelectPopover/SelectPopover";

export function SelectBox({
  selectedItem,
  emptyItem,
  className,
  children,
}: PropsWithChildren<{ emptyItem: string; selectedItem?: string; className?: string }>): ReactElement {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  return (
    <div
      className={`select ${className ?? ""}`}
      onClick={() => {
        setIsPopoverOpen(true);
      }}
    >
      <Button variant="icon" className="select__button">
        <span className="select__button--text">{selectedItem ?? emptyItem}</span>
        <ArrowIcon className="select__button--icon" />
      </Button>
      <SelectPopover
        onClose={() => {
          setIsPopoverOpen(false);
        }}
        isPopoverVisible={isPopoverOpen}
        title="SELECT NETWORK"
      >
        {children}
      </SelectPopover>
    </div>
  );
}
