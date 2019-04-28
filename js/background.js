let TITLES = [
  "URL加入黑名单（不再访问）",
  "URL加入白名单（不再统计）",
  "Domain加入黑名单（不再访问）",
  "Domain加入白名单（不再统计）"
];

// 对设定时间内频繁访问做过滤，不计数
// 记录上次访问url，实现在当前页打开黑名单网页时的拦截
let urlBrowsedWithinSettedTime = {};
let tabsLastUrl = {};
const blackListSuffix = "--BM_blacklist";
const whiteListSuffix = "--BM_whitelist";

TITLES.forEach(function (title) {
  chrome.contextMenus.create({
    type: 'normal',
    title: title, id: "Menu-" + title, contexts: ['all']
  });
});
registerTabs();


chrome.runtime.onInstalled.addListener(function () {

  initializeSettings();
  registerTabs();

});


// Fired when a profile that has this extension installed first starts up.
// This event is not fired when an incognito profile is started,
// even if this extension is operating in 'split' incognito mode.
chrome.runtime.onStartup.addListener(function () {

});


chrome.contextMenus.onClicked.addListener(function (info, tab) {
  let processedUrl = getCleanedUrl(tab.url);

  if (/^chrome/.test(processedUrl)) {
    notify_('chrome相关的网页默认在白名单。');
    return;
  }

  switch (info.menuItemId) {

    case "Menu-" + TITLES[0]: {
      localStorage[processedUrl + blackListSuffix] = 1;
      delBookmark(processedUrl);
      break;
    }
    case "Menu-" + TITLES[1]: {
      localStorage[processedUrl + whiteListSuffix] = 1;
      setBadge(tab);
      break;
    }
    case "Menu-" + TITLES[2]: {
      let domain = getDomain(processedUrl);
      localStorage[domain + blackListSuffix] = 1;
      break;
    }
    case "Menu-" + TITLES[3]: {
      let domain = getDomain(processedUrl);
      localStorage[domain + whiteListSuffix] = 1;
      setBadge(tab);
      break;
    }
  }

});


chrome.tabs.onCreated.addListener(function (tab) {

  // 浏览器设置为新窗口打开链接的，在此判断
  // tab.url 此时为""，需要重新get
  chrome.tabs.get(tab.id, function (tab) {
    if (isBlacklist(getCleanedUrl(tab.url))) {
      notify_('黑名单网站，自动关闭');
      chrome.tabs.remove(tab.id);
    }
  });

});


chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {

  let processedUrl = getCleanedUrl(tab.url);

  if (changeInfo['status'] === 'loading') {
    if (changeInfo.hasOwnProperty('url')) {
      if (isBlacklist(processedUrl)) {
        if (tabsLastUrl.hasOwnProperty(tabId)) {
          chrome.tabs.update(tabId, {url: tabsLastUrl[tabId]}, function (tab) {
            notify_('黑名单网站，不再访问');
          });
        } // else的情况已经在onCreated事件中处理

        return;
      }

      if (isEffectual(tab)) {
        updateBrowseTimes(tab);

        if (localStorage['is_page_show'] === 'true') {
          showBrowseTimes(tab);
        }
      }
    }

    // 直接F5刷新没有时loading事件没有url，但是需要显示badge计数
    setBadge(tab);
  }

  if (changeInfo['status'] === 'complete') {

    addBookmarkWithCheck(tab);

    // 作判断来解决无法从黑名单跳回的问题
    if (!isBlacklist(processedUrl)) {
      setTabLastUrl(tab);
    }
  }

});


chrome.tabs.onRemoved.addListener(function (tabid, removeInfo) {
  cacheRecentUrl(tabsLastUrl[tabid]);
  delete tabsLastUrl[tabid];
});


chrome.tabs.onActivated.addListener(function (activeInfo) {

  chrome.tabs.get(activeInfo.tabId, function (tab) {
    //为了解决'The Great Suspender'类软件造成的重复计次问题
    updateActivatedValidUrl(getCleanedUrl(tab.url));

    // 手动切换标签时更新badge
    // 作判断的原因：在新窗口打开网页时onActivated事件在更新访问次数之前，会导致badge的数字先显示n紧接着变为n+1
    if (tabsLastUrl[tab.id]) {
      setBadge(tab);
    }
  })

});

// TODO 修改diapause_time值后有时不会立即生效：只有已经执行的setTimeout达到了以前设置的时长才会释放。在改回设置时也有此问题
