export const startByte = "53";
export const opPushSig = "54";
export const opPushPubKey = "55";
export const opDup = "76";
export const opHash = "a8";
export const opPushHash = "4f";
export const opCheckSig = "ac";
export const opEqual = "87";
export const opVerify = "69";
export const sigScheme = "01";

export const timeoutBlocks = 10n;
export const swapTimeout = 40n;
export const DCTransfersLimit = 100;
export const AlphaDecimalPlaces = 8;
export const AlphaDecimalFactor = Number("1e" + AlphaDecimalPlaces);

export const moneyTypeURL = "type.googleapis.com/rpc.";
export const tokensTypeURL = "type.googleapis.com/alphabill.tokens.v1.";

export const AlphaSplitType = "type.googleapis.com/rpc.SplitOrder";
export const AlphaTransferType = "type.googleapis.com/rpc.TransferOrder";
export const AlphaSwapType = "type.googleapis.com/rpc.SwapOrder";
export const AlphaDcType = "type.googleapis.com/rpc.TransferDCOrder";

export const TokensSplitType = "type.googleapis.com/alphabill.tokens.v1.SplitFungibleTokenAttributes";
export const TokensTransferType = "type.googleapis.com/alphabill.tokens.v1.TransferFungibleTokenAttributes";
export const TokensSwapType = "type.googleapis.com/alphabill.tokens.v1.JoinFungibleTokenAttributes";
export const TokensDcType = "type.googleapis.com/alphabill.tokens.v1.BurnFungibleTokenAttributes";

export const AlphaSystemId = "AAAAAA==";
export const TokensSystemId = "AAAAAg==";