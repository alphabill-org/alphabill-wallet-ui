import { PropsWithChildren, ReactElement } from 'react';
import { Link } from 'react-router-dom';

import { Button } from '../../../components/Button/Button';
import { ITokenIcon } from '../../../hooks/tokens/ITokenIcon';
import SendIcon from '../../../images/send-ico.svg?react';
import { TokenIcon } from '../TokenIcon';

interface INonFungibleTokenItemProps {
  readonly icon: ITokenIcon | null;
  readonly id: string;
  readonly symbol: string;
}

export function NonFungibleTokenItem(props: PropsWithChildren<INonFungibleTokenItemProps>): ReactElement {
  const { icon, id, symbol } = props;

  return (
    <div className={`units__content__unit hoverable`}>
      <div className="units__content__unit--icon">
        <TokenIcon icon={icon} symbol={symbol} />
      </div>
      <div className="units__content__unit--text">{symbol}</div>
      <Link to={`/units/non-fungible/${id}/transfer`}>
        <Button type="button" variant="primary" isRounded={true}>
          <SendIcon />
        </Button>
      </Link>
    </div>
  );
}
