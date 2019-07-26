// ============================================================================
chrome.runtime.onInstalled.addListener(function () {
  handleCompatibility();

  SETTINGS.initialize();
  TABS.registerTabs();
});

// ============================================================================

// Fired when a profile that has this extension installed first starts up.
// This event is not fired when an incognito profile is started,
// even if this extension is operating in 'split' incognito mode.
chrome.runtime.onStartup.addListener(function () {
});

// ============================================================================

(function onLoading() {
  createContextMenus();

  TABS.registerTabs();

  setTimeout(checkForUpdates, 10000);
})();

chrome.notifications.onClicked.addListener(function (notificationId) {
  URL_UTILS.moveToUrlObj(notificationId) && chrome.tabs.create({url: notificationId});

  chrome.notifications.clear(notificationId);
});
// ============================================================================

chrome.contextMenus.onClicked.addListener(function (info, tab) {
  let stableUrl = URL_UTILS.getStableUrl(tab.url);
  let domain = URL_UTILS.getDomain(stableUrl);

  if (/^chrome/.test(stableUrl)) {
    notify_('chrome相关的网页默认在白名单。');
    return;
  }

  switch (info.menuItemId) {
    case "Menu-" + OPERATIONS.addUrlBlacklist: {
      LS.setItem(stableUrl, OPERATIONS.addUrlBlacklist);
      BOOKMARK.delBookmark(stableUrl);
      break;
    }
    case "Menu-" + OPERATIONS.addUrlWhitelist: {
      LS.setItem(stableUrl, OPERATIONS.addUrlWhitelist);
      break;
    }
    case "Menu-" + OPERATIONS.addDomainBlacklist: {
      LS.setItem(domain, OPERATIONS.addDomainBlacklist);
      break;
    }
    case "Menu-" + OPERATIONS.addDomainWhitelist: {
      LS.setItem(domain, OPERATIONS.addDomainWhitelist);
      break;
    }
  }
  TABS.setTabBadge(tab);
});

// ============================================================================

chrome.tabs.onCreated.addListener(function (tab) {
  // 此处主要拦截黑名单
  // 浏览器设置为新窗口打开链接的，在此判断。速度比在onUpdated中处理快
  // 跳转过来的tab.url可能为""，需要重新get。但是人工new tab时 url一定为'chrome://newtab/'
  // 特殊情况：百度跳转时有个link的中间环节，会导致失效，在onUpdated中处理
  tab.url === 'chrome://newtab/' && HISTORY.setTabLastUrlWithCheck(tab);
  chrome.tabs.get(tab.id, function (tab) {
    let stableUrl = URL_UTILS.getStableUrl(tab.url);
    URL_UTILS.filterBlacklistUrl(tab.id, stableUrl);
  });
});

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  let stableUrl = URL_UTILS.getStableUrl(tab.url);

  if (changeInfo['status'] === 'loading') {
    if (changeInfo.hasOwnProperty('url')) {
      if (URL_UTILS.filterBlacklistUrl(tabId, stableUrl)) {
        return;
      }

      if (URL_UTILS.isEffectual(tab)) {
        COUNTING.increaseBrowseTimes(tab.url);
        CONTENT.displayBrowseTimesOnPageWithCheck(tab);
        BOOKMARK.addBookmarkWithCheck(tab);
      }
      HISTORY.cacheUrlWithinSetTime(stableUrl);
      HISTORY.setTabLastUrlWithCheck(tab);
      CONTENT.individuateSite(tab);
    }

    // 直接F5刷新时changeInfo不含url，但是需要显示badge计数
    TABS.setTabBadge(tab);
  }

});

chrome.tabs.onRemoved.addListener(function (tabid, removeInfo) {
  HISTORY.cacheUrlWithinSetTime(HISTORY.getTabLastUrl(tabid));
  HISTORY.deleteTabLastUrl(tabid);
});

chrome.tabs.onActivated.addListener(function (activeInfo) {
  chrome.tabs.get(activeInfo.tabId, function (tab) {
    // 为了解决'The Great Suspender'类软件造成的重复计次问题。
    // 加判断剔除new tab时的activated事件。
    if (HISTORY.tabLastUrlExists(tab.id)) {
      HISTORY.setTabLastUrlWithCheck(tab);
    }

    // 手动切换标签时更新badge
    // 作判断的原因：在新窗口打开网页时onActivated事件在更新访问次数之前，会导致badge的数字先显示n紧接着变为n+1
    if (HISTORY.getTabLastUrl(tab.id)) {
      TABS.setTabBadge(tab);
    }
  })
});

// ============================================================================

// TODO 修改diapause_time值后有时不会立即生效：只有已经执行的setTimeout达到了以前设置的时长才会释放。在改回设置时也有此问题
