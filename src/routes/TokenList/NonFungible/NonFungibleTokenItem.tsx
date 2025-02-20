import { PropsWithChildren, ReactElement, useState } from 'react';
import { Link } from 'react-router-dom';

import { Button } from '../../../components/Button/Button';
import { ITokenIcon } from '../../../hooks/tokens/ITokenIcon';
import SendIcon from '../../../images/send-ico.svg?react';

interface INonFungibleTokenItemProps {
  readonly icon: ITokenIcon;
  readonly id: string;
  readonly name: string;
}

export function NonFungibleTokenItem(props: PropsWithChildren<INonFungibleTokenItemProps>): ReactElement {
  const { icon, id, name } = props;
  const [error, setError] = useState<boolean>(false);
  return (
    <div className={`units__content__unit hoverable`}>
      <div className="units__content__unit--icon">
        {error ? (
          <span style={{ color: '#000' }}>
            {name
              .split(' ')
              .slice(0, 2)
              .map((el) => el.at(0)?.toUpperCase() ?? '')
              .join('')}
          </span>
        ) : (
          <img
            src={`data:${icon.type};base64,${icon.data}`}
            alt={name}
            onError={() => {
              setError(true);
            }}
          />
        )}
      </div>
      <div className="units__content__unit--text">{name}</div>
      <Link to={`/units/non-fungible/${id}/transfer`}>
        <Button type="button" variant="primary" isRounded={true}>
          <SendIcon />
        </Button>
      </Link>
    </div>
  );
}
