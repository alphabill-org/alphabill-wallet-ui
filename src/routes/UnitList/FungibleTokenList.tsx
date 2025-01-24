import { ReactElement } from "react";
import { Link, useParams } from "react-router-dom";
import { useAlphabill } from "../../hooks/alphabill";
import { ITokenIcon, useUnits } from "../../hooks/units";
import BackIcon from "../../images/back-ico.svg?react";

// TODO: Make loading parallel, right now it loads one by one

function FungibleTokenItem({
  name,
  icon,
  value,
  decimalPlaces,
  hoverable,
}: {
  name: string;
  icon: ITokenIcon;
  value: bigint;
  decimalPlaces: number;
  hoverable?: boolean;
}): ReactElement {
  const paddedValue = value.toString().padStart(decimalPlaces, "0");
  return (
    <div className={`units__content__unit ${hoverable ? "hoverable" : ""}`}>
      <div className="units__content__unit--icon">
        <img
          src={`data:${icon.type};base64,${icon.data}`}
          alt={name}
          onError={(ev) => {
            // TODO: Add proper fallback logo
            ev.currentTarget.src = "";
          }}
        />
      </div>
      <div className="units__content__unit--text">{name}</div>
      <div className="units__content__unit--value">
        {decimalPlaces
          ? `${paddedValue.slice(0, -decimalPlaces).padStart(1, "0")}.${paddedValue.slice(-decimalPlaces)}`
          : paddedValue}
      </div>
    </div>
  );
}

export function FungibleTokenList(): ReactElement {
  const alphabill = useAlphabill();
  const { fungible } = useUnits();

  if (!alphabill) {
    return <>No network selected</>;
  }

  if (fungible.isPending) {
    return <>Loading</>;
  }

  // TODO: Create proper loading animation, network selection error and fetch error page.
  if (fungible.error) {
    return <>{fungible.error.toString()}</>;
  }

  const tokenItems = [];
  // TODO: Check that data exists, remove !
  for (const token of fungible.data!.values()) {
    tokenItems.push(
      <Link key={token.id} to={`/units/fungible/${token.id}`}>
        <FungibleTokenItem
          name={token.name}
          icon={token.icon}
          decimalPlaces={token.decimalPlaces}
          value={token.total}
          hoverable={true}
        />
      </Link>,
    );
  }

  return <div className="units__content">{tokenItems}</div>;
}

export function FungibleTokenInfo(): ReactElement {
  const alphabill = useAlphabill();
  const params = useParams<{ id: string }>();
  const { fungible } = useUnits();

  if (!alphabill) {
    return <>No network selected</>;
  }

  if (fungible.isPending) {
    return <>Loading</>;
  }

  // TODO: Create proper loading animation, network selection error and fetch error page.
  if (fungible.error) {
    return <>{fungible.error.toString()}</>;
  }

  const tokenInfo = fungible.data!.get(params.id ?? "");
  if (!tokenInfo) {
    return <>No token found</>;
  }

  return (
    <div className="units__info">
      <div className="units__info__header">
        <Link to="/" className="back-btn">
          <BackIcon />
        </Link>
        <div className="units__info__title">{tokenInfo.name}</div>
      </div>
      <div className="units__info__content">
        {tokenInfo.units.map((token) => {
          return (
            <FungibleTokenItem
              key={token.id}
              name={tokenInfo.name}
              icon={tokenInfo.icon}
              decimalPlaces={tokenInfo.decimalPlaces}
              value={token.value}
            />
          );
        })}
      </div>
    </div>
  );
}
