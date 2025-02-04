import { ReactElement } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '../../components/Button/Button';
import { Navbar } from '../../components/Navbar/Navbar';
import { NetworkSelect } from '../../components/NetworkSelect/NetworkSelect';
import { useAuthentication } from '../../hooks/authentication';
import ArrowIcon from '../../images/arrow-ico.svg?react';
import FeeCreditIcon from '../../images/fee-credit-ico.svg?react';
import KeyIcon from '../../images/key-ico.svg?react';
import PasswordIcon from '../../images/lock-ico.svg?react';

export const Settings = (): ReactElement => {
  const navigate = useNavigate();
  const { logout } = useAuthentication();

  const handleLogout = (): void => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    {
      icon: <FeeCreditIcon />,
      label: 'Transfer fee credits',
    },
    {
      icon: <KeyIcon />,
      label: 'Keys',
    },
    {
      icon: <PasswordIcon />,
      label: 'Change password',
    },
  ];

  return (
    <>
      <Navbar title="Settings" />
      <div className="settings__content">
        <NetworkSelect label="Network" />
        <ul className="settings__menu">
          {menuItems.map((item, index) => (
            <li className="settings__menu-item" key={index}>
              <span className="settings__menu-item-icon">{item.icon}</span>
              <span className="settings__menu-item-label">{item.label}</span>
              <span className="settings__menu-item-chevron">
                <ArrowIcon />
              </span>
            </li>
          ))}
        </ul>
        <Button className="settings__logout-button" variant="primary" block onClick={handleLogout}>
          Log out
        </Button>
      </div>
    </>
  );
};
