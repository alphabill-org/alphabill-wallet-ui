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
export const feeTimeoutBlocks = 20n;
export const DCTransfersLimit = 100;
export const AlphaDecimals = 8;
export const AlphaDecimalFactor = Number("1e" + AlphaDecimals);
export const maxTransactionFee = 1n;

export const AlphaSplitType = "split";
export const AlphaTransferType = "trans";
export const AlphaSwapType = "swapDC";
export const AlphaDcType = "transDC";

export const TokensSplitType = "splitFToken";
export const TokensTransferType = "transFToken";
export const NFTTokensTransferType = "transNToken";

export const FeeCreditAddType = "addFC";
export const FeeCreditTransferType = "transFC";
export const FeeCreditCloseType = "closeFC";
export const FeeCreditReclaimType = "reclFC";

export const AlphaSystemId = Buffer.from("AAAAAA==", "base64");
export const TokensSystemId = Buffer.from("AAAAAg==", "base64");
export const FeeSystemId = Buffer.from("AAAAAw==", "base64");

export const AlphaType = "ALPHA";
export const TokenType = "UTP";
export const NonFungibleTokenKind = 4;
export const FungibleTokenKind = 2;

export const NFTListView = "NFT list view";
export const FungibleListView = "Fungible list view";
export const ProfileView = "Profile view";
export const TransferFungibleView = "Transfer fungible view";
export const TransferNFTView = "Transfer NFT view";
export const TransferFeeCreditView = "Add Fee Credit view";
export const NFTDetailsView = "NFT details view";

export const downloadableTypes = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "audio/mpeg",
  "audio/wav",
  "video/mp4",
  "video/quicktime",
  "video/x-msvideo",
  "application/json",
  "application/xml",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/zip",
  "application/x-gtar",
  "text/plain",
  "text/html",
  "model/gltf+json",
  "model/obj",
  "model/fbx",
  "image/svg+xml",
  "application/vnd.ms-excel",
  "application/vnd.ms-powerpoint",
  "application/vnd.google-earth.kml+xml",
  "application/vnd.google-earth.kmz",
  "application/x-font-ttf",
  "application/x-font-opentype",
  "application/font-woff",
  "application/font-woff2",
  "application/octet-stream",
  "text/css",
  "text/javascript",
  "application/javascript",
  "application/x-sh",
  "application/java-archive",
  "application/x-rar-compressed",
  "application/x-tar",
  "application/x-bzip2",
  "application/x-gzip",
  "application/x-7z-compressed",
  "text/csv",
  "application/vnd.oasis.opendocument.spreadsheet",
  "application/vnd.oasis.opendocument.text",
  "application/vnd.ms-excel.sheet.macroEnabled.12",
  "application/vnd.ms-word.document.macroEnabled.12",
  "application/vnd.ms-powerpoint.presentation.macroEnabled.12",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export const maxImageSize = 5 * 1024 * 1024; // 5MB in bytes (average phone image ~3MB)
