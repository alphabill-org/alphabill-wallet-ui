import { ReactElement } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { Button } from '../../components/Button/Button';
import { Navbar } from '../../components/NavBar/NavBar';
import { NetworkSelect } from '../../components/NetworkSelect/NetworkSelect';
import { useAuthentication } from '../../hooks/authenticationContext';
import FeeCreditIcon from '../../images/fee-credit-ico.svg?react';
import KeyIcon from '../../images/key-ico.svg?react';
import PasswordIcon from '../../images/lock-ico.svg?react';
import SettingsIcon from '../../images/settings-ico.svg?react';

export const Settings = (): ReactElement => {
  const navigate = useNavigate();
  const { logout } = useAuthentication();

  const handleLogout = (): void => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    {
      icon: <SettingsIcon />,
      label: 'Add network',
      link: '/network',
    },
    {
      icon: <KeyIcon />,
      label: 'Add key',
      link: '/add-key',
    },
    {
      icon: <FeeCreditIcon />,
      label: 'Transfer fee credits',
      link: '/fees',
    },
    {
      icon: <KeyIcon />,
      label: 'Create new wallet',
      link: '/create-wallet',
    },
    {
      icon: <PasswordIcon />,
      label: 'Recover wallet',
      link: '/recover-wallet',
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
              <Link className="settings__menu-item-row" to={`${item.link}`}>
                <span className="settings__menu-item-icon">{item.icon}</span>
                <span className="settings__menu-item-label">{item.label}</span>
              </Link>
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
