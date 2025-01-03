export const alwaysTrueBase64 = "gwBBAfY=";
export const alwaysTrueTagAndIdentifierBytes = "83004102";
export const alwaysFalseBase64 = "gwBBAPY=";

export const tokenFeeCreditRecordUnitType = "2f";
export const moneyFeeCreditRecordUnitType = "0f";

export const TimeoutBlocks = 10n;
export const SwapTimeout = 40n;
export const FeeTimeoutBlocks = 20n;
export const DCTransfersLimit = 100;
export const AlphaDecimals = 8;
export const MaxTransactionFee = 1n;

export const AlphaSplitType = "split";
export const AlphaTransferType = "trans";
export const AlphaSwapType = "swapDC";
export const AlphaDcType = "transDC";

export const AlphaSystemId = BigInt(1);
export const TokensSystemId = BigInt(2);

export const AlphaType = "ALPHA";
export const TokenType = "UTP";
export const NonFungibleTokenKind = 4;
export const FungibleTokenKind = 2;

export const NFTListView = "NFT list view";
export const FungibleListView = "Fungible list view";
export const ProfileView = "Profile view";
export const TransferFungibleView = "Transfer fungible view";
export const TransferNFTView = "Transfer NFT view";
export const TransferFeeCreditView = "Transfer Fee Credit view";
export const NFTDetailsView = "NFT details view";

export const DownloadableTypes = [
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

export const MaxImageSize = 5 * 1024 * 1024; // 5MB in bytes (average phone image ~3MB)

export const LocalKeyNFTAsset = "ab_nft_asset";
export const LocalKeyActiveAccount = "ab_active_account";
export const LocalKeyActiveAsset = "ab_active_asset";
export const LocalKeyVault = "ab_wallet_vault";
export const LocalKeyPubKeys = "ab_wallet_pub_keys";
export const LocalKeyAccountNames = "ab_wallet_account_names";

export const localStorageKeys = [
  LocalKeyNFTAsset,
  LocalKeyActiveAccount,
  LocalKeyActiveAsset,
  LocalKeyVault,
  LocalKeyPubKeys,
  LocalKeyAccountNames,
];
