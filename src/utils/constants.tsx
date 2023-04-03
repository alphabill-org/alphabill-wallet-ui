export const pushBool = "51";
export const startByte = "53";
export const opPushSig = "54";
export const opPushPubKey = "55";
export const opDup = "76";
export const opHash = "a8";
export const opPushHash = "4f";
export const opCheckSig = "ac";
export const opEqual = "87";
export const opVerify = "69";
export const boolTrue = "01";
export const boolFalse = "00";
export const sigScheme = "01";
export const pushBoolTrue = startByte + pushBool + boolTrue;
export const pushBoolFalse = startByte + pushBool + boolFalse;

export const timeoutBlocks = 10n;
export const swapTimeout = 40n;
export const DCTransfersLimit = 100;
export const AlphaDecimalPlaces = 8;
export const AlphaDecimalFactor = Number("1e" + AlphaDecimalPlaces);

export const moneyTypeURLPrefix = "type.googleapis.com/rpc.";
export const tokensTypeURLPrefix = "type.googleapis.com/alphabill.tokens.v1.";

export const AlphaSplitType = moneyTypeURLPrefix + "SplitOrder";
export const AlphaTransferType = moneyTypeURLPrefix + "TransferOrder";
export const AlphaSwapType = moneyTypeURLPrefix + "SwapOrder";
export const AlphaDcType = moneyTypeURLPrefix + "TransferDCOrder";

export const TokensSplitType =
  tokensTypeURLPrefix + "SplitFungibleTokenAttributes";
export const TokensTransferType =
  tokensTypeURLPrefix + "TransferFungibleTokenAttributes";
export const NFTTokensTransferType =
  tokensTypeURLPrefix + "TransferNonFungibleTokenAttributes";

export const AlphaSystemId = "AAAAAA==";
export const TokensSystemId = "AAAAAg==";

export const AlphaType = "ALPHA";
export const NonFungibleTokenKind = 4;
export const FungibleTokenKind = 2;
