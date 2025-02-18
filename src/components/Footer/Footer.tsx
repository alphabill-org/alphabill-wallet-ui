import React, { ReactElement } from 'react';
import { NavLink } from 'react-router-dom';

import FungibleIcon from '../../images/fungible.svg?react';
import NonFungibleIcon from '../../images/non-fungible.svg?react';
import { Button } from '../Button/Button';

export const Footer = (): ReactElement => {
  return (
    <div className="footer">
      <NavLink to="/units/fungible" className={({ isActive }) => (isActive ? 'active' : '')}>
        <Button variant="icon">
          <FungibleIcon />
        </Button>
      </NavLink>
      <NavLink to="/units/non-fungible" className={({ isActive }) => (isActive ? 'active' : '')}>
        <Button variant="icon">
          <NonFungibleIcon />
        </Button>
      </NavLink>
    </div>
  );
};
