// ============================================================================
chrome.runtime.onInstalled.addListener(function () {
  handleCompatibility();

  SETTINGS.initialize();
  TABS.registerTabs();
});

// Fired when a profile that has this extension installed first starts up.
// This event is not fired when an incognito profile is started,
// even if this extension is operating in 'split' incognito mode.
chrome.runtime.onStartup.addListener(function () {
});

// ============================================================================

(function onLoading() {
  UTILS.createContextMenus();

  TABS.registerTabs();

  setTimeout(UTILS.checkForUpdates, 10000);
})();

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  consoleDebug(sender.tab ? "from a content script:" + sender.tab.url : "from the extension", request);
  // sendResponse(eval(request.function).apply(this, message.hasOwnProperty('paramsArray') ? message.paramsArray : []));
  if (request.function === 'SETTINGS.getAllParams') {
    sendResponse(SETTINGS.getAllParams());
  }
});

chrome.notifications.onClicked.addListener(function (notificationId) {
  URL_UTILS.moveToUrlObj(notificationId) && chrome.tabs.create({url: notificationId});

  chrome.notifications.clear(notificationId);
});

chrome.storage.onChanged.addListener(function (changes, area) {

});
// ============================================================================

chrome.contextMenus.onClicked.addListener(function (info, tab) {
  consoleDebug('contextMenus clicked->', info, tab);
  OPERATIONS.execOp(tab, info.srcUrl, info.menuItemId.slice(5));
});

// ============================================================================
// 浏览器启动时无此事件
chrome.tabs.onCreated.addListener(function (tab) {
  // 此处主要拦截黑名单
  // 浏览器设置为新窗口打开链接的，在此判断。速度比在onUpdated中处理快
  // 跳转过来的tab.url可能为""，需要重新get。但是人工new tab时 url一定为'chrome://newtab/'
  // 特殊情况：百度跳转时有个link的中间环节，会导致失效，在onUpdated中处理
  tab.url === 'chrome://newtab/' && HISTORY.updateTabLastUrl(tab);
  TABS.retrieveTab(tab.id, function (tab) {
    let stableUrl = URL_UTILS.getStableUrl(tab.url);
    TABS.filterBlacklistUrl(tab.id, stableUrl);
  });
});

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  let stableUrl = URL_UTILS.getStableUrl(tab.url);

  if (changeInfo['status'] === 'loading') {
    if (changeInfo.hasOwnProperty('url')) {
      // 白名单还需更新badge，判重，页面个性化等
      if (TABS.filterBlacklistUrl(tabId, stableUrl)) {
        return;
      }

      let s;
      if ((s = URL_UTILS.checkBrowsingStatus(tab)) === URL_UTILS.STATUS.INCREASE) {
        COUNTING.increaseAndShowBrowseTimes(tab);
      } else if (s === URL_UTILS.STATUS.DUPLICATE) {
        CONTENT.displayDuplicateOnPageWithCheck(tab);
        TABS.setTabBadge(tab);
      } else {
        TABS.setTabBadge(tab);
      }
      HISTORY.cacheUrlWithinSetTime(stableUrl);
      HISTORY.updateTabLastUrl(tab);
      CONTENT.individuateSite(tab);
    } else {
      // 直接F5刷新时changeInfo不含url，但是需要显示badge计数
      tab.active && TABS.setTabBadge(tab);
    }
  }
});

chrome.tabs.onRemoved.addListener(function (tabid, removeInfo) {
  HISTORY.cacheUrlWithinSetTime(HISTORY.getTabLastUrl(tabid));
  HISTORY.deleteTabLastUrl(tabid);
});

chrome.tabs.onActivated.addListener(function (activeInfo) {
  TABS.retrieveTab(activeInfo.tabId, function (tab) {
    if (HISTORY.tabLastUrlExists(tab.id)) {
      // 为了解决'The Great Suspender'类软件造成的重复计次问题。
      // 加判断剔除new tab时的activated事件。
      HISTORY.updateTabLastUrl(tab);

      // 手动切换标签时更新badge
      // 作判断的原因：在新窗口打开网页时onActivated事件在更新访问次数之前，会导致badge的数字先显示n紧接着变为n+1
      TABS.setTabBadge(tab);
    }
  })
});

// 浏览器启动时无此事件
chrome.windows.onCreated.addListener(function (a) {
  consoleDebug('window onCreated', a);
  chrome.windows.getAll(function (windows) {
    windows.length === 1 && EVENTS.onChromeUserOpening(windows[0]["id"]);
  });
});
// ============================================================================

// TODO 修改timeIgnoreDuplicate值后有时不会立即生效：只有已经执行的setTimeout达到了以前设置的时长才会释放。在改回设置时也有此问题
