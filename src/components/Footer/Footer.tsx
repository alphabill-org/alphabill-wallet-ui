import React, { ReactElement } from "react";

import { Link } from "react-router-dom";
import FungibleIcon from "../../images/fungible.svg?react";
import NonFungibleIcon from "../../images/non-fungible.svg?react";
import TransferIcon from "../../images/transfer.svg?react";
import { Button } from "../Button/Button";

export const Footer = (): ReactElement => {
  return (
    <div className="footer">
      <Link to="/fungible">
        <Button variant="icon">
          <FungibleIcon />
        </Button>
      </Link>
      <Link to="/non-fungible">
        <Button variant="icon" onClick={() => {}}>
          <NonFungibleIcon />
        </Button>
      </Link>
      <Link to="/transfer">
        <Button variant="icon" onClick={() => {}}>
          <TransferIcon />
        </Button>
      </Link>
    </div>
  );
};
