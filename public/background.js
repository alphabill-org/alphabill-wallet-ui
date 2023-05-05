this.isPopupOpen = undefined;
this.abPort = undefined;
const walletCreate = {
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

  const walletMessage = wallet?.walletMessage;
  if (Boolean(walletMessage)) {
    if (walletMessage?.ab_connection_is_confirmed) {
      this.abPort
        .postMessage({
          ab_port_message: {
            ab_pub_key: walletMessage?.ab_pub_key,
            ab_connection_is_confirmed:
              walletMessage?.ab_connection_is_confirmed,
          },
        })
        ?.then(() => {
          chrome?.storage?.local.set({ ab_is_connect_popup: false });
        });
    }

    if (walletMessage?.ab_transferred_token_tx_hash) {
      this.abPort
        .postMessage({
          ab_port_message: {
            ab_transferred_token: {
              tx_hash: walletMessage?.ab_transferred_token_tx_hash,
              id: walletMessage?.ab_transferred_token_id,
            },
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
    const portTransferData = msg.ab_port_message.ab_connect_transfer;

    if (portTransferData) {
      chrome.windows.create(walletCreate).then(() => {
        chrome?.storage?.local.set({
          ab_connect_transfer: {
            token_type_id: portTransferData.token_type_id,
            receiver_pub_key: portTransferData.receiver_pub_key,
          },
        });
      }, function(window) {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError);
        } else if (window === undefined) {
          console.error("Window could not be created");
        } else {
          console.log("Window created: " + window.id);
        }
      });
    }

    this.abPort.postMessage({ ab_port_message: "Hello from the extension!" });
  });
});

chrome.runtime.onMessageExternal.addListener(function (
  message,
  sender,
  sendResponse
) {
  if (message.connectWallet) {
    chrome?.storage?.local.set({ ab_is_connect_popup: true }, function () {
      chrome.windows.create(walletCreate).then(() => {
        sendResponse("Hello from the extension wallet opened!");
      });
    });
  }
});
