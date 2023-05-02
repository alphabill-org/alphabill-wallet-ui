this.isPopupOpen = undefined;
this.port = undefined;
this.alphaSite =
  // Set wallet popup state
  chrome?.runtime?.onMessage.addListener((wallet) => {
    if (Boolean(wallet?.handleOpenState)) {
      this.isPopupOpen = wallet.isPopupOpen;
    }

    const externalMessage = wallet?.externalMessage;
    if (Boolean(externalMessage)) {
      if (externalMessage?.connectionConfirmed) {
        this.port.postMessage({
          message: {
            pubKey: externalMessage?.pubKey,
            connectionConfirmed: externalMessage?.connectionConfirmed,
          },
        });
      }
    }
  });

// Lock on sleep & shutdown
chrome.windows.onRemoved.addListener(() => {
  chrome.storage.local.set({ ab_is_wallet_locked: true });
  chrome.storage.local.set({ is_connect_redirect: false });
});

// Time until idle state initiates
chrome.idle.setDetectionInterval(300);

// Lock wallet unless active
chrome.idle.onStateChanged.addListener((state) => {
  if (state !== "active") {
    this.isPopupOpen === true && chrome.runtime.sendMessage({ isLocked: true });
    chrome.storage.local.set({ ab_is_wallet_locked: "locked" });
  }
});

chrome.runtime.onConnectExternal.addListener(function (port) {
  console.log("Connected to content script: " + port.sender.tab.url);
  // Listen for messages from the content script
  this.port = port;
  port.onMessage.addListener(function (msg) {
    console.log("Received message from content script: " + msg);
    // Send a message back to the content script
    port.postMessage({ message: "Hello from the extension!" });
  });
});

chrome.runtime.onMessageExternal.addListener(function (
  message,
  sender,
  sendResponse
) {
  if (message.connectWallet) {
    chrome.storage.local.set({ is_connect_redirect: true }, function () {
      chrome.windows
        .create({
          url: chrome.runtime.getURL("index.html"),
          type: "popup",
          width: 375,
          height: 628,
        })
        .then(() => {
          sendResponse("Hello from the extension wallet opened!");
        });
    });
  }
});
