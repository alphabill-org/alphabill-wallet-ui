import { Bill } from "@alphabill/alphabill-js-sdk/lib/money/Bill";
import { FungibleToken } from "@alphabill/alphabill-js-sdk/lib/tokens/FungibleToken";
import { FungibleTokenType } from "@alphabill/alphabill-js-sdk/lib/tokens/FungibleTokenType";
import { Base16Converter } from "@alphabill/alphabill-js-sdk/lib/util/Base16Converter";
import { useQuery } from "@tanstack/react-query";
import { ReactElement, useCallback } from "react";
import { useAlphabill } from "../../hooks/alphabill";

const ALPHA_LOGO =
  "PHN2ZyBmaWxsPSIjMEMwQTNFIiBoZWlnaHQ9IjI0IiB2aWV3Qm94PSIwIDAgNDAgMjQiIHdpZHRoPSI0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICAgIDxnPgogICAgICAgIDxwYXRoIGQ9Im0zMC4xODI0LjI5NDg0MmgtOC4xODk4Yy0uMTQyMiAxLjEwOTM0OC0uMzQ3NCAyLjIwOTY5OC0uNjE0NiAzLjI5NTcwOC0xLjE5NTItMS4xODQ4Ni0yLjYxOTItMi4xMTM3NS00LjE4NTEtMi43MzAwMzctMS41NjU5LS42MTYyODUtMy4yNDEtLjkwNzAxNTgtNC45MjMtLjg1NDQ3MzI4LTYuOTY3OTggMC0xMi4yNjk5IDQuNTQ3MzEwMjgtMTIuMjY5OSAxMS45NzU1NjAyOCAwIDcuNDI4MyA1LjI1NzQ5IDEyLjAxMjYgMTIuMjI1NSAxMi4wMTI2IDEuNjkwNC4wNTE0IDMuMzczNi0uMjQxOCA0Ljk0NzEtLjg2MTlzMy4wMDQzLTEuNTU0IDQuMjA1NC0yLjc0NDhjLjI2NzEgMS4wOTM1LjQ3MjMgMi4yMDEzLjYxNDYgMy4zMTc5aDguMTg5OGMtLjgyOTctNC4wODIxLTIuMjQzOC04LjAyMzItNC4xOTg2LTExLjcwMTYgMS45NTQzLTMuNjgxMTIgMy4zNjg0LTcuNjI0NiA0LjE5ODYtMTEuNzA4OTU4em0tMTcuNjgyOSAxNi42MTE4NThjLS45NzA1IDAtMS45MTkxLS4yODgxLTIuNzI1NzQtLjgyNzktLjgwNjYxLS41Mzk3LTEuNDM0OS0xLjMwNjctMS44MDUyNi0yLjIwMzktLjM3MDM3LS44OTcyLS40NjYxMS0xLjg4NDEtLjI3NTE2LTIuODM1OC4xOTA5Ni0uOTUxNi42NjAwNS0xLjgyNTE2IDEuMzQ3ODQtMi41MDk5NC42ODc3OC0uNjg0NzggMS41NjMzMi0xLjE0OTk1IDIuNTE1NjItMS4zMzY2MS45NTI0LS4xODY2NiAxLjkzODctLjA4NjQxIDIuODM0MS4yODgwOC44OTUzLjM3NDQ5IDEuNjU5NCAxLjAwNjM2IDIuMTk1MyAxLjgxNTU0LjUzNi44MDkxMy44MTk3IDEuNzU5MjMuODE1MyAyLjcyOTkzLS4wMDU5IDEuMjk2NC0uNTI0OSAyLjUzNzgtMS40NDM2IDMuNDUyNC0uOTE4Ny45MTQ3LTIuMTYyMiAxLjQyODItMy40NTg0IDEuNDI4MnoiLz4KICAgICAgICA8cGF0aCBkPSJtMzUuMDk4MSAxNi44MTQ5YzIuNzA3MyAwIDQuOTAyLTIuMTk1MSA0LjkwMi00LjkwMjggMC0yLjcwNzc2LTIuMTk0Ny00LjkwMjgyLTQuOTAyLTQuOTAyODJzLTQuOTAyMSAyLjE5NTA2LTQuOTAyMSA0LjkwMjgyYzAgMi43MDc3IDIuMTk0OCA0LjkwMjggNC45MDIxIDQuOTAyOHoiLz4KICAgIDwvZz4KPC9zdmc+";

interface IFungibleToken {
  readonly id: string;
  readonly name: string;
  readonly decimalPlaces: number;
  readonly icon: { data: string; type: string };
  readonly value: bigint;
}

const textDecoder = new TextDecoder();

export function FungibleTokenList(): ReactElement {
  const alphabill = useAlphabill();
  const getAlphaInfo = useCallback(
    async (ownerId: Uint8Array): Promise<IFungibleToken> => {
      if (!alphabill) {
        throw new Error("No alphabill context defined.");
      }

      const { bills } = await alphabill.moneyClient.getUnitsByOwnerId(ownerId);
      let value = 0n;
      for (const unitId of bills) {
        const bill = await alphabill.moneyClient.getUnit(unitId, false, Bill);
        if (!bill) {
          continue;
        }

        value += bill.value;
      }

      return {
        id: "ALPHA",
        name: "ALPHA",
        decimalPlaces: 0,
        icon: {
          data: ALPHA_LOGO,
          type: "image/svg+xml",
        },
        value,
      };
    },
    [alphabill],
  );

  const getFungibleTokenInfo = useCallback(
    async (ownerId: Uint8Array): Promise<IFungibleToken[]> => {
      if (!alphabill) {
        throw new Error("No alphabill context defined.");
      }

      const tokens = new Map<string, FungibleToken[]>();
      const { fungibleTokens } = await alphabill.tokenClient.getUnitsByOwnerId(ownerId);
      for (const unitId of fungibleTokens) {
        const token = await alphabill.tokenClient.getUnit(unitId, false, FungibleToken);
        if (!token) {
          continue;
        }

        const typeId = Base16Converter.encode(token.typeId.bytes);
        const typeTokens = tokens.get(typeId) ?? [];
        if (typeTokens.length === 0) {
          tokens.set(typeId, typeTokens);
        }

        typeTokens.push(token);
      }

      const result: IFungibleToken[] = [];
      for (const [typeId, typeTokens] of tokens) {
        const type = await alphabill.tokenClient.getUnit(typeTokens[0].typeId, false, FungibleTokenType);
        // TODO: Return error cause this cannot happen if token exists
        if (!type) {
          continue;
        }

        result.push({
          id: typeId,
          name: type.name,
          decimalPlaces: type.decimalPlaces,
          icon: {
            data: btoa(textDecoder.decode(type.icon.data)),
            type: type.icon.type,
          },
          value: typeTokens.reduce((previousValue, currentValue) => previousValue + currentValue.value, 0n),
        });
      }

      return result;
    },
    [alphabill],
  );

  // TODO: Reset state when changing network
  const { isPending, error, data } = useQuery({
    queryKey: ["fungible"],
    queryFn: async () => {
      if (!alphabill) {
        return [];
      }

      return [await getAlphaInfo(new Uint8Array()), ...(await getFungibleTokenInfo(new Uint8Array()))];
    },
  });

  if (!alphabill) {
    return <>No network selected</>;
  }

  if (isPending) {
    return <>Loading</>;
  }

  if (error) {
    return <>{error.toString()}</>;
  }

  return (
    <div>
      {data.map((token) => (
        <div key={token.id} className="units__unit">
          <div className="units__unit--icon">
            <img src={`data:${token.icon.type};base64,${token.icon.data}`} alt={token.name} />
          </div>
          <div className="units__unit--text">{token.name}</div>
          <div>
            {token.value.toString().substring(0, token.value.toString().length - token.decimalPlaces)}.
            {token.value.toString().substring(-token.decimalPlaces)}
          </div>
        </div>
      ))}
    </div>
  );
}
