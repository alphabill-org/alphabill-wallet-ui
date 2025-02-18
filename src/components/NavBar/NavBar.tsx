import React from 'react';
import { useNavigate } from 'react-router-dom';

import BackIcon from '../../images/back-arrow-ico.svg?react';
import { Button } from '../Button/Button';

interface INavbarProps {
  title: string;
}

export const Navbar: React.FC<INavbarProps> = ({ title }) => {
  const navigate = useNavigate();

  return (
    <div className="navbar">
      <div className="navbar__icon">
        <Button
          variant="icon"
          onClick={() => {
            navigate(-1);
          }}
        >
          <BackIcon />
        </Button>
      </div>
      <div className="navbar__title">{title}</div>
    </div>
  );
};
