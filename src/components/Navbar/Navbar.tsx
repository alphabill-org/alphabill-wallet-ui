import classNames from "classnames";
import { useQueryClient } from "react-query";
import { useAuth } from "../../hooks/useAuth";
import { INavbarViews } from "../../types/Types";
import { invalidateAllLists } from "../../utils/utils";

export interface INavbarProps {
  onChange: (v: INavbarViews) => void;
  activeBar: INavbarViews;
  isFees?: boolean;
}

export default function Navbar({
  onChange,
  activeBar,
  isFees,
}: INavbarProps): JSX.Element | null {
  const { activeAsset, activeAccountId } = useAuth();
  const queryClient = useQueryClient();

  const handleChange = (v: INavbarViews) => {
    onChange(v);
    invalidateAllLists(activeAccountId, activeAsset.typeId, queryClient);
  };

  return (
    <div className="navbar">
      <div
        onClick={() => {
          handleChange("fungible");
        }}
        className={classNames("navbar-item", {
          active: activeBar === "fungible",
        })}
      >
        Fungible
      </div>

      <div
        onClick={() => {
          handleChange("nonFungible");
        }}
        className={classNames("navbar-item", {
          active: activeBar === "nonFungible",
        })}
      >
        Non Fungible
      </div>
      {isFees && (
        <div
          onClick={() => {
            handleChange("fees");
          }}
          className={classNames("navbar-item", {
            active: activeBar === "fees",
          })}
        >
          Fee Credit
        </div>
      )}
    </div>
  );
}
