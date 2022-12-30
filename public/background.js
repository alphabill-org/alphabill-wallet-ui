chrome.windows.onRemoved.addListener(() => {
  chrome.storage.local.set({ ab_is_wallet_locked: "locked" });
});

chrome.idle.onStateChanged.addListener((state) => {
  if (state === "locked") {
    chrome.storage.local.set({ ab_is_wallet_locked: "locked" });
    chrome.runtime.sendMessage("close");
  }
});
