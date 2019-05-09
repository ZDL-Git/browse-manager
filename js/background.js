// ============================================================================
chrome.runtime.onInstalled.addListener(function () {
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

OPERATIONS.forEach(function (title) {
  chrome.contextMenus.create({
    type: 'normal',
    title: title, id: "Menu-" + title, contexts: ['all']
  });
});

// 对设定时间内频繁访问做过滤，不计数
// 记录上次访问url，实现在当前页打开黑名单网页时的拦截
let urlBrowsedWithinSettedTime = {};
let tabsLastUrl = {};

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
    case "Menu-" + OPERATIONS[0]: {
      setValue(stableUrl, OPERATIONS[0]);
      delBookmark(stableUrl);
      break;
    }
    case "Menu-" + OPERATIONS[1]: {
      setValue(stableUrl, OPERATIONS[1]);
      break;
    }
    case "Menu-" + OPERATIONS[2]: {
      setValue(domain, OPERATIONS[2]);
      break;
    }
    case "Menu-" + OPERATIONS[3]: {
      setValue(domain, OPERATIONS[3]);
      break;
    }
  }
  setTabBadge(tab);
});

// ============================================================================

chrome.tabs.onCreated.addListener(function (tab) {
  // 浏览器设置为新窗口打开链接的，在此判断
  // tab.url 此时为""，需要重新get
  chrome.tabs.get(tab.id, function (tab) {
    if (isBlacklist(getStableUrl(tab.url))) {
      notify_('黑名单网站，自动关闭');
      chrome.tabs.remove(tab.id);
    }
  });
});

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  let stableUrl = getStableUrl(tab.url);

  if (changeInfo['status'] === 'loading') {
    if (changeInfo.hasOwnProperty('url')) {
      if (isBlacklist(stableUrl)) {
        if (tabLastUrlExists(tabId)) {
          chrome.tabs.update(tabId, {url: getTabLastUrl(tabId)}, function (tab) {
            notify_('黑名单网站，不再访问');
          });
        } // else的情况已经在onCreated事件中处理
        return;
      }

      if (isEffectual(tab)) {
        increaseBrowseTimes(tab.url);
        if (getParam('is_page_show') === 'true') {
          showBrowseTimes(tab);
        }
      }
      cacheRecentUrl(stableUrl);
    }

    // 直接F5刷新没有时loading事件没有url，但是需要显示badge计数
    setTabBadge(tab);
  }

  if (changeInfo['status'] === 'complete') {
    addBookmarkWithCheck(tab);

    // 加判断来解决无法从黑名单跳回的问题
    if (!isBlacklist(stableUrl)) {
      setTabLastUrl(tab);
    }
  }
});

chrome.tabs.onRemoved.addListener(function (tabid, removeInfo) {
  cacheRecentUrl(getTabLastUrl(tabid));
  deleteTabLastUrl(tabid);
});

chrome.tabs.onActivated.addListener(function (activeInfo) {
  chrome.tabs.get(activeInfo.tabId, function (tab) {
    // 为了解决'The Great Suspender'类软件造成的重复计次问题。
    // 加判断剔除new tab时的activated事件。
    if (tabLastUrlExists(tab.id)) {
      setTabLastUrl(tab);
    }

    // 手动切换标签时更新badge
    // 作判断的原因：在新窗口打开网页时onActivated事件在更新访问次数之前，会导致badge的数字先显示n紧接着变为n+1
    if (getTabLastUrl(tab.id)) {
      setTabBadge(tab);
    }
  })
});

// ============================================================================

// TODO 修改diapause_time值后有时不会立即生效：只有已经执行的setTimeout达到了以前设置的时长才会释放。在改回设置时也有此问题
