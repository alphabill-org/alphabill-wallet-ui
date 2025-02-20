import { PropsWithChildren, ReactElement } from 'react';

import { ErrorNotification } from '../../components/ErrorNotification/ErrorNotification';
import { Loading } from '../../components/Loading/Loading';
import { useAlphabill } from '../../hooks/alphabillContext';
import { IKeyInfo } from '../../hooks/vaultContext';
import { QueryResult } from '../../utils/queryResult';

export function TokenContent({
  selectedKey,
  query,
  children,
}: PropsWithChildren<{ selectedKey: IKeyInfo | null; query: QueryResult<unknown> }>): ReactElement {
  const alphabill = useAlphabill();

  if (!alphabill) {
    return (
      <div className="units--error">
        <ErrorNotification
          title="No network selected"
          info="Select network from the header. If no network exists, add it from settings."
        />
      </div>
    );
  }

  if (!selectedKey) {
    return (
      <div className="units--error">
        <ErrorNotification title="No key selected" info="Select key from the selectbox above." />
      </div>
    );
  }

  if (query.isPending) {
    return (
      <div className="units--loading">
        <Loading title="Loading..." />
      </div>
    );
  }

  if (query.isError) {
    console.error(query.error);
    return (
      <div className="units--error">
        <ErrorNotification title="Error occurred" info={query.error?.message} />
      </div>
    );
  }

  return <div className="units__content">{children}</div>;
}
