// localStorage.clear();
let TITLES = [
  "URL不再访问(黑名单)",
  "URL不再统计(白名单)",
  "Domain不再访问(黑名单)",
  "Domain不再统计(白名单)"
];

chrome.runtime.onInstalled.addListener(function () {
  TITLES.forEach(function (title) {
    chrome.contextMenus.create({
      type: 'normal',
      title: title, id: "Menu-" + title, contexts: ['all']
    });
  });

  if (!localStorage['whitelist_suffix']) localStorage['whitelist_suffix'] = '--whitelist';
  if (!localStorage['blacklist_suffix']) localStorage['blacklist_suffix'] = '--blacklist';
  // if (!localStorage['tab_id_suffix']) localStorage['tab_id_suffix'] = '--tab_id';
  //配置项，待提供配置入口。open_in_new_tab：1表示在当前标签打开新网页，2表示在新标签中打开
  if (!localStorage['open_in_new_tab']) localStorage['open_in_new_tab'] = 2;
  if (!localStorage['is_auto_save']) localStorage['is_auto_save'] = true;
  if (!localStorage['auto_save_thre']) localStorage['auto_save_thre'] = 5;
  if (!localStorage['bookmark_title']) localStorage['bookmark_title'] = '经常访问(BM)';
  if (!localStorage['is_diapause']) localStorage['is_diapause'] = true;
  if (!localStorage['diapause_time']) localStorage['diapause_time'] = 120000;
  notify_('Browse Manager安装成功', 2000);
});

chrome.runtime.onStartup.addListener(function () {

  localStorage['startup_within_5s'] = 1;
  setTimeout(function () {
    localStorage.removeItem('startup_within_5s');
  }, 5000);

  chrome.tabs.query({}, function(tabs){
    for (let i = 0; i < tabs.length; i++) {
      tabsLastUrl[tabs[i].id] = tabs[i].url;

      if (tabs[i].active) {
        setBadge(tabs[i]);
      }
    }
  });
});


chrome.contextMenus.onClicked.addListener(function (info, tab) {
  let tab_url = tab.url;

  if (/^chrome/.test(tab_url)) {
    notify_('chrome相关的网页默认在白名单。');
    return;
  }

  switch (info.menuItemId) {

    case "Menu-" + TITLES[0]: {
      localStorage[tab_url + localStorage['blacklist_suffix']] = 1;
      delBookmark(tab_url);
      break;
    }
    case "Menu-" + TITLES[1]: {
      localStorage[tab_url + localStorage['whitelist_suffix']] = 1;
      setBadge(tab);
      break;
    }
    case "Menu-" + TITLES[2]: {
      let domain = getUrlDomain(tab_url);
      localStorage[domain + localStorage['blacklist_suffix']] = 1;
      break;
    }
    case "Menu-" + TITLES[3]: {
      let domain = getUrlDomain(tab_url);
      localStorage[domain + localStorage['whitelist_suffix']] = 1;
      setBadge(tab);
      break;
    }
  }

});

// 临时信息存储在变量中，关闭浏览器时自动释放
// 对设定时间内频繁访问做过滤，不计数
// 记录上次访问url，实现在当前页打开黑名单网页时的拦截
let urlBrowsedWithinSettedTime = {};
let tabsLastUrl = {};

chrome.tabs.onCreated.addListener(function (tab) {

  localStorage['tabcreated_within_5s'] = 1;
  setTimeout(function () {
    localStorage.removeItem('tabcreated_within_5s');
  }, 5000);

  // 浏览器设置为新窗口打开链接的，在此判断
  chrome.tabs.get(tab.id, function (tab_g) {
    if (isBlacklist(tab_g.url)) {
      notify_('黑名单网站，自动关闭');
      chrome.tabs.remove(tab_g.id);
    }
  });

});

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {

  let tab_url = tab.url;

  if (changeInfo['status'] === 'loading') {

    if (changeInfo.hasOwnProperty('url')) {
      if (isBlacklist(tab_url)) {
        if (localStorage['tabcreated_within_5s']) {
          notify_('黑名单网站，自动关闭');
          chrome.tabs.remove(tabId);
        } else {
          if (tabsLastUrl.hasOwnProperty(tabId) && tab_url !== tabsLastUrl[tabId]) {
            chrome.tabs.update(tabId, {url: tabsLastUrl[tabId]}, function (tab) {
              notify_('黑名单网站，不再访问');
            });
          }
        }
        return;
      }
      if (!isWhitelist(tab_url)) {
        if (isEffectual(tab)) {
          updateBrowseTimes(tab);
        }
        setBadge(tab);
      }
    } else if (!isWhitelist(tab_url)) {
      // 直接F5刷新没有时loading事件没有url，但是需要显示计数
      setBadge(tab);
    }
  }


  if (changeInfo['status'] === 'complete') {
    addBookmarkWithCheck(tab);
    tabsLastUrl[tabId] = tab_url;
  }

});

chrome.tabs.onActivated.addListener(function (activeInfo) {

  chrome.tabs.get(activeInfo.tabId, function (tab) {
    //为了解决'The Great Suspender'类软件造成的重复计次bug
    updateActivatedValidUrl(tab.url);

    // 在新窗口打开网页，并激活的情况（未按ctrl键）由create事件负责更新图标badge
    if (!localStorage.hasOwnProperty('tabcreated_within_5s')) {
      setBadge(tab);
    }
  })

});

// TODO 前后切换不能加一
