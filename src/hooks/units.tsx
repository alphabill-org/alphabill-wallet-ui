import { MoneyPartitionJsonRpcClient } from "@alphabill/alphabill-js-sdk/lib/json-rpc/MoneyPartitionJsonRpcClient";
import { TokenPartitionJsonRpcClient } from "@alphabill/alphabill-js-sdk/lib/json-rpc/TokenPartitionJsonRpcClient";
import { Bill } from "@alphabill/alphabill-js-sdk/lib/money/Bill";
import { FungibleToken } from "@alphabill/alphabill-js-sdk/lib/tokens/FungibleToken";
import { FungibleTokenType } from "@alphabill/alphabill-js-sdk/lib/tokens/FungibleTokenType";
import { Base16Converter } from "@alphabill/alphabill-js-sdk/lib/util/Base16Converter";
import { useQuery, useQueryClient, UseQueryResult } from "@tanstack/react-query";
import { createContext, PropsWithChildren, ReactElement, useContext, useEffect } from "react";
import { QUERY_KEY_UNITS } from "../routes/UnitList/UnitList";
import { useAlphabill } from "./alphabill";
import { useVault } from "./vault";

const ALPHA_LOGO =
  "PHN2ZyBmaWxsPSIjMEMwQTNFIiBoZWlnaHQ9IjI0IiB2aWV3Qm94PSIwIDAgNDAgMjQiIHdpZHRoPSI0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICAgIDxnPgogICAgICAgIDxwYXRoIGQ9Im0zMC4xODI0LjI5NDg0MmgtOC4xODk4Yy0uMTQyMiAxLjEwOTM0OC0uMzQ3NCAyLjIwOTY5OC0uNjE0NiAzLjI5NTcwOC0xLjE5NTItMS4xODQ4Ni0yLjYxOTItMi4xMTM3NS00LjE4NTEtMi43MzAwMzctMS41NjU5LS42MTYyODUtMy4yNDEtLjkwNzAxNTgtNC45MjMtLjg1NDQ3MzI4LTYuOTY3OTggMC0xMi4yNjk5IDQuNTQ3MzEwMjgtMTIuMjY5OSAxMS45NzU1NjAyOCAwIDcuNDI4MyA1LjI1NzQ5IDEyLjAxMjYgMTIuMjI1NSAxMi4wMTI2IDEuNjkwNC4wNTE0IDMuMzczNi0uMjQxOCA0Ljk0NzEtLjg2MTlzMy4wMDQzLTEuNTU0IDQuMjA1NC0yLjc0NDhjLjI2NzEgMS4wOTM1LjQ3MjMgMi4yMDEzLjYxNDYgMy4zMTc5aDguMTg5OGMtLjgyOTctNC4wODIxLTIuMjQzOC04LjAyMzItNC4xOTg2LTExLjcwMTYgMS45NTQzLTMuNjgxMTIgMy4zNjg0LTcuNjI0NiA0LjE5ODYtMTEuNzA4OTU4em0tMTcuNjgyOSAxNi42MTE4NThjLS45NzA1IDAtMS45MTkxLS4yODgxLTIuNzI1NzQtLjgyNzktLjgwNjYxLS41Mzk3LTEuNDM0OS0xLjMwNjctMS44MDUyNi0yLjIwMzktLjM3MDM3LS44OTcyLS40NjYxMS0xLjg4NDEtLjI3NTE2LTIuODM1OC4xOTA5Ni0uOTUxNi42NjAwNS0xLjgyNTE2IDEuMzQ3ODQtMi41MDk5NC42ODc3OC0uNjg0NzggMS41NjMzMi0xLjE0OTk1IDIuNTE1NjItMS4zMzY2MS45NTI0LS4xODY2NiAxLjkzODctLjA4NjQxIDIuODM0MS4yODgwOC44OTUzLjM3NDQ5IDEuNjU5NCAxLjAwNjM2IDIuMTk1MyAxLjgxNTU0LjUzNi44MDkxMy44MTk3IDEuNzU5MjMuODE1MyAyLjcyOTkzLS4wMDU5IDEuMjk2NC0uNTI0OSAyLjUzNzgtMS40NDM2IDMuNDUyNC0uOTE4Ny45MTQ3LTIuMTYyMiAxLjQyODItMy40NTg0IDEuNDI4MnoiLz4KICAgICAgICA8cGF0aCBkPSJtMzUuMDk4MSAxNi44MTQ5YzIuNzA3MyAwIDQuOTAyLTIuMTk1MSA0LjkwMi00LjkwMjggMC0yLjcwNzc2LTIuMTk0Ny00LjkwMjgyLTQuOTAyLTQuOTAyODJzLTQuOTAyMSAyLjE5NTA2LTQuOTAyMSA0LjkwMjgyYzAgMi43MDc3IDIuMTk0OCA0LjkwMjggNC45MDIxIDQuOTAyOHoiLz4KICAgIDwvZz4KPC9zdmc+";

export interface ITokenIcon {
  readonly type: string;
  readonly data: string;
}

interface ITokenUnit {
  readonly id: string;
  readonly value: bigint;
}

export interface ITokenInfo {
  readonly id: string;
  readonly name: string;
  readonly decimalPlaces: number;
  readonly icon: ITokenIcon;
  readonly units: ITokenUnit[];
  readonly total: bigint;
}

interface IUnitsContext {
  readonly fungible: UseQueryResult<Map<string, ITokenInfo>>;
}

const textDecoder = new TextDecoder();

const UnitsContext = createContext<IUnitsContext | null>(null);

function createAlphaInfo(units: ITokenUnit[]): ITokenInfo {
  return {
    id: "ALPHA",
    name: "ALPHA",
    decimalPlaces: 0,
    icon: {
      data: ALPHA_LOGO,
      type: "image/svg+xml",
    },
    units,
    total: units.reduce((previous, current) => previous + current.value, 0n),
  };
}

async function getAlphaInfo(ownerId: Uint8Array, moneyClient: MoneyPartitionJsonRpcClient): Promise<ITokenInfo> {
  const { bills } = await moneyClient.getUnitsByOwnerId(ownerId);
  const units: ITokenUnit[] = [];
  for (const unitId of bills) {
    const bill = await moneyClient.getUnit(unitId, false, Bill);
    if (!bill) {
      continue;
    }

    units.push({
      id: Base16Converter.encode(bill.unitId.bytes),
      value: bill.value,
    });
  }

  return createAlphaInfo(units);
}

async function getFungibleTokenInfo(
  ownerId: Uint8Array,
  moneyClient: MoneyPartitionJsonRpcClient,
  tokenClient: TokenPartitionJsonRpcClient,
): Promise<Map<string, ITokenInfo>> {
  const tokens = new Map<string, FungibleToken[]>();
  const { fungibleTokens } = await tokenClient.getUnitsByOwnerId(ownerId);
  for (const unitId of fungibleTokens) {
    const token = await tokenClient.getUnit(unitId, false, FungibleToken);
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

  const result = new Map<string, ITokenInfo>();
  result.set("ALPHA", await getAlphaInfo(ownerId, moneyClient));
  for (const [typeId, units] of tokens) {
    const type = await tokenClient.getUnit(units[0].typeId, false, FungibleTokenType);
    // TODO: Return error cause this cannot happen if token exists
    if (!type) {
      continue;
    }

    result.set(typeId, {
      id: typeId,
      name: type.name,
      decimalPlaces: type.decimalPlaces,
      icon: {
        data: btoa(textDecoder.decode(type.icon.data)),
        type: type.icon.type,
      },
      units: units.map((unit) => {
        return {
          id: Base16Converter.encode(unit.unitId.bytes),
          value: unit.value,
        };
      }),
      total: units.reduce((previous, current) => previous + current.value, 0n),
    });
  }

  return result;
}

export function useUnits(): IUnitsContext {
  const context = useContext(UnitsContext);
  if (!context) {
    throw new Error("Invalid units context");
  }

  return context;
}

export function UnitsProvider({ children }: PropsWithChildren): ReactElement {
  const queryClient = useQueryClient();
  const alphabill = useAlphabill();
  const vault = useVault();

  const key = Base16Converter.decode(vault.selectedKey?.publicKey ?? "");

  const fungible = useQuery({
    queryKey: [QUERY_KEY_UNITS, "FUNGIBLE"],
    queryFn: (): Promise<Map<string, ITokenInfo>> => {
      if (!alphabill) {
        return Promise.resolve(new Map());
      }

      return getFungibleTokenInfo(key, alphabill.moneyClient, alphabill.tokenClient);
    },
  });

  useEffect(() => {
    queryClient.resetQueries({ queryKey: [QUERY_KEY_UNITS, "FUNGIBLE"], exact: true });
  }, [vault.selectedKey, alphabill]);

  return <UnitsContext.Provider value={{ fungible }}>{children}</UnitsContext.Provider>;
}
