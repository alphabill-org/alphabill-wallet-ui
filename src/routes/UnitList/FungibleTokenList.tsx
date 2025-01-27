import { ReactElement, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { ErrorNotification } from "../../components/ErrorNotification/ErrorNotification";
import { Loading } from "../../components/Loading/Loading";
import { useAlphabill } from "../../hooks/alphabill";
import { ITokenIcon, useUnits } from "../../hooks/units";
import BackIcon from "../../images/back-ico.svg?react";

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
  const [error, setError] = useState<boolean>(false);

  const paddedValue = value.toString().padStart(decimalPlaces, "0");
  return (
    <div className={`units__content__unit ${hoverable ? "hoverable" : ""}`}>
      <div className="units__content__unit--icon">
        {error ? (
          <span style={{ color: "#000" }}>
            {name
              .split(" ")
              .slice(0, 2)
              .map((el) => el.at(0)?.toUpperCase() ?? "")
              .join("")}
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
    return (
      <div className="units--error">
        <ErrorNotification
          title="No network selected"
          info="Select network from the header. If no network exists, add it from settings."
        />
      </div>
    );
  }

  if (fungible.isPending) {
    return (
      <div className="units--loading">
        <Loading title="Loading..." />
      </div>
    );
  }

  if (fungible.error) {
    return <ErrorNotification title="Error occurred" info={fungible.error.toString()} />;
  }

  const tokenItems = [];
  const tokens = fungible.data?.values() || new Map().values();
  for (const token of tokens) {
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
    return (
      <div className="units--error">
        <ErrorNotification title="No network selected" info={<Link to="/units/fungible">Go back</Link>} />
      </div>
    );
  }

  if (fungible.isPending) {
    return <Loading title="Loading..." />;
  }

  if (fungible.error) {
    return <ErrorNotification title="Error occurred" info={fungible.error.toString()} />;
  }

  const tokenInfo = fungible.data?.get(params.id ?? "");
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
