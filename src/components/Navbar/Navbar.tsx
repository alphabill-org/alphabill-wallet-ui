import classNames from "classnames";
import { useState } from "react";
import { useQueryClient } from "react-query";
import { useAuth } from "../../hooks/useAuth";
import { invalidateAllLists } from "../../utils/utils";

export interface INavbarProps {
  onChange: (v: boolean) => void;
}

export default function Navbar({ onChange }: INavbarProps): JSX.Element | null {
  const { activeAsset, activeAccountId } = useAuth();
  const [isFungibleTransfer, setIsFungibleTransfer] = useState<boolean>(true);
  const queryClient = useQueryClient();

  const handleChange = (v: boolean) => {
    setIsFungibleTransfer(v);
    onChange(v);
    invalidateAllLists(activeAccountId, activeAsset.typeId, queryClient);
  };

  return (
    <div className="navbar">
      <div
        onClick={() => {
          handleChange(true);
        }}
        className={classNames("navbar-item", {
          active: isFungibleTransfer,
        })}
      >
        Fungible
      </div>

      <div
        onClick={() => {
          handleChange(false);
        }}
        className={classNames("navbar-item", {
          active: !isFungibleTransfer,
        })}
      >
        Non Fungible
      </div>
    </div>
  );
}
