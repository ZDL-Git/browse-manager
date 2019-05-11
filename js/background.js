// ============================================================================
chrome.runtime.onInstalled.addListener(function () {
  handleCompatibility();

  initializeSettings();
  registerTabs();
});

// ============================================================================

// Fired when a profile that has this extension installed first starts up.
// This event is not fired when an incognito profile is started,
// even if this extension is operating in 'split' incognito mode.
chrome.runtime.onStartup.addListener(function () {
});

// ============================================================================

Object.values(OPERATIONS).forEach(function (title) {
  chrome.contextMenus.create({
    type: 'normal',
    title: title, id: "Menu-" + title, contexts: ['all']
  });
});

registerTabs();

// ============================================================================

chrome.contextMenus.onClicked.addListener(function (info, tab) {
  let stableUrl = getStableUrl(tab.url);
  let domain = getDomain(stableUrl);

  if (/^chrome/.test(stableUrl)) {
    notify_('chrome相关的网页默认在白名单。');
    return;
  }

  switch (info.menuItemId) {
    case "Menu-" + OPERATIONS.addUrlBlackList: {
      LS.setItem(stableUrl, OPERATIONS.addUrlBlackList);
      delBookmark(stableUrl);
      break;
    }
    case "Menu-" + OPERATIONS.addUrlWhiteList: {
      LS.setItem(stableUrl, OPERATIONS.addUrlWhiteList);
      break;
    }
    case "Menu-" + OPERATIONS.addDomainBlackList: {
      LS.setItem(domain, OPERATIONS.addDomainBlackList);
      break;
    }
    case "Menu-" + OPERATIONS.addDomainWhiteList: {
      LS.setItem(domain, OPERATIONS.addDomainWhiteList);
      break;
    }
  }
  setTabBadge(tab);
});

// ============================================================================

chrome.tabs.onCreated.addListener(function (tab) {
  // 浏览器设置为新窗口打开链接的，在此判断。速度比在onUpdated中处理快
  // tab.url 此时为""，需要重新get
  // 特殊情况：百度跳转时有个link的中间环节，会导致失效，在onUpdated中处理
  chrome.tabs.get(tab.id, function (tab) {
    let stableUrl = getStableUrl(tab.url);
    if (isBlacklist(stableUrl)) {
      chrome.tabs.remove(tab.id);
      notify_('黑名单网站，不再访问');
      console.log(stableUrl, "黑名单网站，标签关闭");
    }
  });
});

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  let stableUrl = getStableUrl(tab.url);

  if (changeInfo['status'] === 'loading') {
    if (changeInfo.hasOwnProperty('url')) {
      if (isBlacklist(stableUrl)) {
        if (HISTORY.tabLastUrlExists(tabId)) {
          chrome.tabs.update(tabId, {url: HISTORY.getTabLastUrl(tabId)}, function (tab) {
            notify_('黑名单网站，不再访问');
            console.log(stableUrl, "黑名单网站，页面返回");
          });
        } else {
          chrome.tabs.remove(tabId);
          notify_('黑名单网站，不再访问');
          console.log(stableUrl, "黑名单网站，标签关闭");
        }
        return;
      }

      if (isEffectual(tab)) {
        increaseBrowseTimes(tab.url);
        if (getParam('is_page_show') === 'true') {
          showBrowseTimes(tab);
        }
      }
      HISTORY.cacheUrlWithinSetTime(stableUrl);
      stableUrl === 'chrome://newtab/' && HISTORY.setTabLastUrl(tab);
    }

    // 直接F5刷新没有时loading事件没有url，但是需要显示badge计数
    setTabBadge(tab);
  }

  // 在complete阶段处理可以过滤掉一些中间url，如百度跳转的link，
  // 但是部分页面从loading到complete需要很长时间，或者一直在loading，所以可能会存在一些问题
  if (changeInfo['status'] === 'complete') {
    addBookmarkWithCheck(tab);

    // 加判断来解决无法从黑名单跳回的问题
    if (!isBlacklist(stableUrl)) {
      HISTORY.setTabLastUrl(tab);
    }
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
      HISTORY.setTabLastUrl(tab);
    }

    // 手动切换标签时更新badge
    // 作判断的原因：在新窗口打开网页时onActivated事件在更新访问次数之前，会导致badge的数字先显示n紧接着变为n+1
    if (HISTORY.getTabLastUrl(tab.id)) {
      setTabBadge(tab);
    }
  })
});

// ============================================================================

// TODO 修改diapause_time值后有时不会立即生效：只有已经执行的setTimeout达到了以前设置的时长才会释放。在改回设置时也有此问题
