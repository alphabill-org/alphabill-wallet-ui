this.isPopupOpen = undefined;

// Set wallet popup state
chrome?.runtime?.onMessage.addListener((wallet) => {
  this.isPopupOpen = wallet.isPopupOpen;
});

// Lock on sleep & shutdown
chrome.windows.onRemoved.addListener(() => {
  chrome.storage.local.set({ ab_is_wallet_locked: "locked" });
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
