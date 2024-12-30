import { NavLink } from "react-router-dom";
import { ICHistory, ICHome, ICNft, ICTransfer } from "../../css/icons";
import { ICFungible } from "../../css/icons/ICFungible";
import Button from "../Button/Button";

export const ToolBar = () => {
  return (
    <div className="tool-bar">
      <NavLink to="/">
        <Button variant="icon" className="navigation-button">
          <ICHome className="navigation-button__icon" />
          Home
        </Button>
      </NavLink>

      <NavLink to="/fungible">
        <Button variant="icon" className="navigation-button">
          <ICFungible className="navigation-button__icon" />
          Fungible
        </Button>
      </NavLink>

      <Button variant="primary">
        <ICTransfer />
      </Button>

      <NavLink to="/nft">
        <Button variant="icon" className="navigation-button">
          <ICNft className="navigation-button__icon" />
          Non fungible
        </Button>
      </NavLink>

      <NavLink to="/history">
        <Button variant="icon" className="navigation-button">
          <ICHistory className="navigation-button__icon" />
          History
        </Button>
      </NavLink>
    </div>
  );
};
