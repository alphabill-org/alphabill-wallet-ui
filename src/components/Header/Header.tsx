import { ReactElement } from 'react';
import { useNavigate } from 'react-router-dom';

import LogoIcon from '../../images/ab-logo-ico.svg?react';
import SettingsIcon from '../../images/settings-ico.svg?react';
import { Button } from '../Button/Button';
import { NetworkSelect } from '../NetworkSelect/NetworkSelect';

export function Header(): ReactElement {
  const navigate = useNavigate();

  return (
    <div className="header">
      <div className="header__ico">
        <LogoIcon />
      </div>
      <div className="header__select">
        <NetworkSelect />
      </div>
      <Button
        variant="icon"
        onClick={() => {
          navigate('/settings');
        }}
      >
        <SettingsIcon />
      </Button>
    </div>
  );
}
