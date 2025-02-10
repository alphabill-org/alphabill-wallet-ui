import { PropsWithChildren, ReactElement } from 'react';
import { Link } from 'react-router-dom';

import { Button } from '../../../components/Button/Button';
import SendIcon from '../../../images/send-ico.svg?react';
import { formatValueWithDecimalPlaces } from '../../../utils/decimal';

interface ITokenItemProps {
  readonly decimalPlaces: number;
  readonly id: string;
  readonly value: bigint;
}

export function TokenItem(props: PropsWithChildren<ITokenItemProps>): ReactElement {
  const { decimalPlaces, id, value } = props;

  return (
    <div className={`units__content__unit`}>
      <div className="units__content__unit--value">{formatValueWithDecimalPlaces(value, decimalPlaces)}</div>
      <Link to={`/units/transfer/${id}`}>
        <Button type="button" variant="primary" isRounded={true}>
          <SendIcon />
        </Button>
      </Link>
    </div>
  );
}
