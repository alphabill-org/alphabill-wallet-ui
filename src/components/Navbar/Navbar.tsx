import classNames from "classnames";
import { useQueryClient } from "react-query";
import { useAuth } from "../../hooks/useAuth";
import { invalidateAllLists } from "../../utils/utils";

export interface INavbarProps {
  onChange: (v: boolean) => void;
  isFungibleActive: boolean;
}

export default function Navbar({ onChange, isFungibleActive }: INavbarProps): JSX.Element | null {
  const { activeAsset, activeAccountId } = useAuth();
  const queryClient = useQueryClient();

  const handleChange = (v: boolean) => {
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
          active: isFungibleActive,
        })}
      >
        Fungible
      </div>

      <div
        onClick={() => {
          handleChange(false);
        }}
        className={classNames("navbar-item", {
          active: !isFungibleActive,
        })}
      >
        Non Fungible
      </div>
    </div>
  );
}
