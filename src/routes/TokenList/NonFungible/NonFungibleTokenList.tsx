import { ReactElement } from 'react';

import { NonFungibleTokenItem } from './NonFungibleTokenItem';
import { ErrorNotification } from '../../../components/ErrorNotification/ErrorNotification';
import { Loading } from '../../../components/Loading/Loading';
import { useAlphabill } from '../../../hooks/alphabillContext';
import { useNonFungibleTokens } from '../../../hooks/nonFungibleToken';
import { useNonFungibleTokenTypes } from '../../../hooks/nonFungibleTokenType';
import { useVault } from '../../../hooks/vaultContext';

export function NonFungibleTokenList(): ReactElement {
  const alphabill = useAlphabill();
  const { selectedKey } = useVault();
  const nonFungibleTokens = useNonFungibleTokens(selectedKey?.publicKey.key ?? null);
  const types = useNonFungibleTokenTypes(selectedKey?.publicKey.key ?? null);

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

  if (nonFungibleTokens.isPending) {
    return (
      <div className="units--loading">
        <Loading title="Loading..." />
      </div>
    );
  }

  if (nonFungibleTokens.isError) {
    return (
      <div className="units--error">
        <ErrorNotification title="Error occurred" info={nonFungibleTokens.error?.message} />
      </div>
    );
  }

  const tokenItems: ReactElement[] = [];

  if (nonFungibleTokens.data && types.data) {
    for (const token of nonFungibleTokens.data.values()) {
      const type = types.data.get(token.typeId.toString());
      if (!type) {
        // TODO: Do something with tokens which are missing type
        continue;
      }
      tokenItems.push(
        <NonFungibleTokenItem
          icon={{ data: btoa(new TextDecoder().decode(type.icon.data)), type: type.icon.type }}
          id={token.unitId.toString()}
          key={token.unitId.toString()}
          name={token.name}
        />,
      );
    }
  }

  return <div className="units__content">{tokenItems}</div>;
}
