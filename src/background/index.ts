chrome.runtime.onInstalled.addListener(async (opt) => {
  if (opt.reason === 'install') {
    await chrome.storage.local.clear()

    chrome.tabs.create({
      active: true,
      url: chrome.runtime.getURL('src/setup/index.html?type=install'),
    })
  }

  if (opt.reason === 'update') {
    chrome.tabs.create({
      active: true,
      url: chrome.runtime.getURL('src/setup/index.html?type=update'),
    })
  }
})

console.log('hello world from background')

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "takeScreenshot") {
    console.log("takeScreenshot in action");
    chrome.tabs.captureVisibleTab(undefined, { format: "png" }, (dataUrl) => {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError.message);
        sendResponse({ error: chrome.runtime.lastError.message });
      } else {
        sendResponse({ screenshotUrl: dataUrl });
      }
    });
    return true;  // Will respond asynchronously
  }
});

self.onerror = function (message, source, lineno, colno, error) {
  console.info(
    `Error: ${message}\nSource: ${source}\nLine: ${lineno}\nColumn: ${colno}\nError object: ${error}`
  )
}

export {}
