const bgScope = this;
bgScope.isPopupOpen = undefined;
bgScope.abPort = undefined;
const walletUrl = chrome.runtime.getURL("index.html");
const walletCreateOptions = {
  url: walletUrl,
  type: "popup",
  width: 375,
  height: 628,
};

// Set wallet popup state
chrome?.runtime?.onMessage.addListener((message) => {
  if (Boolean(message?.handleOpenState)) {
    bgScope.isPopupOpen = message.isPopupOpen;
  }

  const abWalletMessage = message?.ab_wallet_extension_msg;
  if (Boolean(abWalletMessage)) {
    if (abWalletMessage?.ab_connection_is_confirmed) {
      bgScope.abPort
        .postMessage({
          ab_port_message: {
            ab_pub_key: abWalletMessage?.ab_pub_key,
            ab_connection_is_confirmed:
              abWalletMessage?.ab_connection_is_confirmed,
          },
        })
        ?.then(() => {
          chrome?.storage?.local.set({ ab_is_connect_popup: false });
        });
    }

    if (abWalletMessage?.ab_transferred_token_tx_hash) {
      bgScope.abPort
        .postMessage({
          ab_port_message: {
            ab_transferred_token: {
              tx_hash: abWalletMessage?.ab_transferred_token_tx_hash,
              id: abWalletMessage?.ab_transferred_token_id,
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
    bgScope.isPopupOpen === true &&
      chrome.runtime.sendMessage({ isLocked: true });
    chrome?.storage?.local.set({ ab_is_wallet_locked: "locked" });
  }
});

chrome.runtime.onConnectExternal.addListener(function (port) {
  // Listen for messages from the content website
  bgScope.abPort = port;
  bgScope.abPort.onMessage.addListener(function (msg) {
    // Send a message back to the content website
    const portTransferData = msg.ab_port_message.ab_connect_transfer;
    const portTransferConfirmed =
      msg.ab_port_message.ab_connect_transfer_confirmed;

    if (portTransferConfirmed === true) {
      chrome?.storage?.local.remove(["ab_last_connect_transfer"]);
    }

    if (portTransferData) {
      const portTransferData = msg.ab_port_message.ab_connect_transfer;
      chrome?.storage?.local
        .get(["ab_last_connect_transfer"])
        .then((result) => {
          const lastTxHash =
            result?.ab_last_connect_transfer?.ab_transferred_token_tx_hash;
          const lastId =
            result?.ab_last_connect_transfer?.ab_transferred_token_id;

          const handleConnectTransfer = () => {
            if (lastId && lastTxHash) {
              bgScope.abPort.postMessage({
                ab_port_message: {
                  ab_transferred_token: {
                    tx_hash: lastTxHash,
                    id: lastId,
                  },
                },
              });
            } else {
              chrome.windows.create(walletCreateOptions)?.then(() => {
                chrome?.storage?.local.set({
                  ab_connect_transfer: {
                    token_type_id: portTransferData.token_type_id,
                    receiver_pub_key: portTransferData.receiver_pub_key,
                  },
                });
              });
            }
          };

          chrome.windows.getAll({ populate: true }, function (windows) {
            for (var i = 0; i < windows.length; i++) {
              var win = windows[i];

              if (win.type === "popup" && win.tabs[0].url.includes(walletUrl.replace("index.html", ""))) {
                // Extension window is open and has the walletUrl, close it
                chrome.windows.remove(win.id, function () {
                  handleConnectTransfer();
                });
                return; // Exit the loop, since we've found the extension window
              }
            }
            // Extension window is not open, create new window
            handleConnectTransfer();
          });
        });
    }
  });
});

chrome.runtime.onMessageExternal.addListener(function (
  message
) {
  if (message.connectWallet) {
    const createWallet = () => {
      chrome?.storage?.local.set({ ab_is_connect_popup: true }, function () {
        chrome.windows.create(walletCreate);
      });
    }
    chrome.windows.getAll({ populate: true }, function (windows) {
      for (var i = 0; i < windows.length; i++) {
        var win = windows[i];
        if (win.type === "popup" && win.tabs[0].url.includes(walletUrl.replace("index.html", ""))) {
          // Extension window is open and has the walletUrl, close it
          chrome.windows.remove(win.id, function () {
            createWallet();
          });
          return; // Exit the loop, since we've found the extension window
        }
      }
      // Extension window is not open, create new window
      createWallet();
    });
  }
});
