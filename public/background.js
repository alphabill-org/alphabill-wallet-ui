this.isPopupOpen = undefined;
this.abPort = undefined;
const wallet = {
  url: chrome.runtime.getURL("index.html"),
  type: "popup",
  width: 375,
  height: 628,
};
// Set wallet popup state
chrome?.runtime?.onMessage.addListener((wallet) => {
  if (Boolean(wallet?.handleOpenState)) {
    this.isPopupOpen = wallet.isPopupOpen;
  }

  const externalMessage = wallet?.externalMessage;
  if (Boolean(externalMessage)) {
    if (externalMessage?.ab_connection_is_confirmed) {
      this.abPort
        .postMessage({
          message: {
            ab_pub_key: externalMessage?.ab_pub_key,
            ab_connection_is_confirmed:
              externalMessage?.ab_connection_is_confirmed,
          },
        })
        ?.then(() => {
          chrome?.storage?.local.set({ ab_is_connect_popup: false });
        });
    }

    if (externalMessage?.ab_transferred_token_tx_hash) {
      this.abPort
        .postMessage({
          message: {
            ab_transferred_token_tx_hash:
              externalMessage?.ab_transferred_token_tx_hash,
          },
        })
        ?.then(() => {
          chrome?.storage?.local.remove("ab_connect_transfer");
        });
    }
  }
});

// Lock on sleep & shutdown
chrome.windows.onRemoved.addListener(() => {
  chrome?.storage?.local.set({ ab_is_connect_popup: false });
});

// Time until idle state initiates
chrome.idle.setDetectionInterval(300);

// Lock wallet unless active
chrome.idle.onStateChanged.addListener((state) => {
  if (state !== "active") {
    this.isPopupOpen === true && chrome.runtime.sendMessage({ isLocked: true });
    chrome?.storage?.local.set({ ab_is_wallet_locked: "locked" });
  }
});

chrome.runtime.onConnectExternal.addListener(function (port) {
  // Listen for messages from the content website
  this.abPort = port;

  this.abPort.onMessage.addListener(function (msg) {
    // Send a message back to the content website

    if (msg.ab_connect_transfer) {
      chrome.windows.create(wallet).then(() => {
        chrome?.storage?.local.set({
          ab_connect_transfer: {
            transfer_key_type_id: msg.ab_connect_transfer.transfer_key_type_id,
            transfer_pub_key: msg.ab_connect_transfer.transfer_pub_key,
          },
        });
      });
    }

    this.abPort.postMessage({ message: "Hello from the extension!" });
  });
});

chrome.runtime.onMessageExternal.addListener(function (
  message,
  sender,
  sendResponse
) {
  if (message.connectWallet) {
    chrome?.storage?.local.set({ ab_is_connect_popup: true }, function () {
      chrome.windows.create(wallet).then(() => {
        sendResponse("Hello from the extension wallet opened!");
      });
    });
  }
});
