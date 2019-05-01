let OPERATIONS = [
  "URL加入黑名单（不再访问）",
  "URL加入白名单（不再统计）",
  "Domain加入黑名单（不再访问）",
  "Domain加入白名单（不再统计）"
];

function initializeSettings() {
  touchSettings('is_auto_save', true);
  touchSettings('auto_save_thre', 5);
  touchSettings('bookmark_title', '经常访问(BM)');
  touchSettings('is_diapause', true);
  touchSettings('diapause_time', 120000);
  touchSettings('is_page_show', true);
}

function touchSettings(paramName, defaultValue) {
  if (!getParam(paramName)) {
    setParam(paramName, defaultValue);
  }
}

function setParam(paramName, value) {
  localStorage['SETTINGS:' + paramName] = value;
}

function getParam(paramName) {
  return localStorage['SETTINGS:' + paramName];
}


function registerTabs() {
  chrome.tabs.query({}, function (tabs) {
    Array.from(tabs).forEach(function (tab) {
      setTabLastUrl(tab);

      if (tab.active) {
        setBadge(tab);
      }
    })
  });
}

function setTabLastUrl(tab) {
  let tabId = tab.id;
  // 在跳转到其它页面前重新激活，以关闭时间作为最后访问时间。解决临时切换到其它标签再切回导致的次数增加
  if (tabLastUrlExists(tabId)) {
    cacheRecentUrl(getTabLastUrl(tabId));
  }

  tabsLastUrl[tabId] = getStableUrl(tab.url);
}

function deleteTabLastUrl(tabId) {
  delete tabsLastUrl[tabId];
}

function getTabLastUrl(tabId) {
  return tabsLastUrl[tabId];
}

function tabLastUrlExists(tabId) {
  return tabsLastUrl.hasOwnProperty(tabId);
}


function isWhitelist(url) {
  let isDefaultWhitelist = /^chrome/.test(url)
    || /^https?:\/\/www\.baidu\.com\//.test(url)
    || /^https?:\/\/www\.google\.com\//.test(url);

  return isDefaultWhitelist
    || getBrowsedTimes(url) === OPERATIONS[1]
    || getBrowsedTimes(getDomain(url)) === OPERATIONS[3];
}

function isBlacklist(url) {
  if (/^chrome/.test(url)) return false;

  return getBrowsedTimes(url) === OPERATIONS[0]
    || getBrowsedTimes(getDomain(url)) === OPERATIONS[2];
}


function isEffectual(tab) {
  let stableUrl = getStableUrl(tab.url);
  let tabId = tab.id;

  // 黑白名单
  if (isWhitelist(stableUrl) || isBlacklist(stableUrl)) {
    console.log(stableUrl, "黑白名单");
    return false;
  }

  // 'The Greate Suspender'类软件
  if (tab.active && /^chrome-extension/.test(getTabLastUrl(tabId)) && getBrowsedTimes(stableUrl)) {
    console.log(stableUrl, "跳转自chrome-extension");
    return false;
  }

  // 忽略在diapause_time间的重复访问
  if (getParam('is_diapause') === 'true' && urlBrowsedWithinSettedTime.hasOwnProperty(stableUrl)) {
    console.log(stableUrl, "在设置的忽略间隔中");
    return false;
  }

  // 不包括刷新操作，因为刷新操作没有loading事件，不会执行到此位置。
  if (getTabLastUrl(tabId) === stableUrl) {
    console.log(stableUrl, "地址未发生变化");
    return false;
  }

  return true;
}


function touchBookmarkFolder(callback) {
  let bookmarkTitle = getParam('bookmark_title');
  chrome.bookmarks.search({title: bookmarkTitle}, function (results) {
    if (results.length >= 1) {
      callback(results[0].id);
    } else {
      chrome.bookmarks.create({
        parentId: '1',
        title: bookmarkTitle,
      }, function (bookmark) {
        notify_('已创建收藏夹，如想停止请在Browse Manager扩展中设置');
        callback(bookmark.id);
      });
    }
  })
}

function addBookmarkWithCheck(tab) {
  if (getParam('is_auto_save') === 'false') return;

  let stableUrl = getStableUrl(tab.url);

  let browseTimes = getBrowsedTimes(stableUrl) ? parseInt(getBrowsedTimes(stableUrl)) : 0;
  let saveThre = parseInt(getParam('auto_save_thre'));
  if (browseTimes < saveThre || browseTimes >= saveThre + 3 || isBlacklist(stableUrl)) return;

  touchBookmarkFolder(function (bookmarkId) {
    chrome.bookmarks.search({url: stableUrl}, function (results) {
      if (results.length === 0) {
        chrome.bookmarks.create({
          parentId: bookmarkId,
          url: stableUrl,
          title: tab.title
        }, function (bookmark) {
          notify_('经常访问此网页,自动加入收藏夹:\n' + bookmark.title);
        })
      }
    })
  })
}

function delBookmark(url) {
  chrome.bookmarks.search({url: url}, function (results) {
    for (let i = 0; i < results.length; i++) {
      chrome.bookmarks.remove(results[i.toString()].id, function (results_r) {
        notify_('收藏夹中的已同时删除.' + results_r);
      })
    }
  })
}


function showBrowseTimes(tab) {
  // 进入异步，否则前台未准备好，无法接收消息
  setTimeout(function () {
    chrome.tabs.sendMessage(tab.id, {
      method: "displayBrowseTimes",
      browseTimes: getBrowsedTimes(getStableUrl(tab.url))
    });
  }, 200);
}

function setBadge(tab) {
  if (!tab) return;

  chrome.tabs.get(tab.id, function (tab) {
    if (chrome.runtime.lastError) return;

    let stableUrl = getStableUrl(tab.url);
    let browseTimes = getBrowsedTimes(stableUrl);
    if (isWhitelist(stableUrl) || isBlacklist(stableUrl) || !browseTimes) {
      chrome.browserAction.setBadgeText({text: '', tabId: tab.id});
    } else {
      let bgColor = (parseInt(browseTimes || '0') >= parseInt(getParam('auto_save_thre'))) ?
        [255, 0, 0, 255] : [70, 136, 241, 255];
      chrome.browserAction.setBadgeBackgroundColor({color: bgColor, tabId: tab.id});
      chrome.browserAction.setBadgeText({text: browseTimes, tabId: tab.id});
    }
  });
}

function increaseBrowseTimes(url) {
  let stableUrl = getStableUrl(url);
  let browseTimes = getBrowsedTimes(stableUrl);
  browseTimes = browseTimes ? parseInt(browseTimes) + 1 : 1;
  setBrowsedTimes(stableUrl, browseTimes);
}

function getBrowsedTimes(url) {
  return localStorage[url];
}

function setBrowsedTimes(url, times) {
  localStorage[url] = times;
}

function cacheRecentUrl(url) {
  urlBrowsedWithinSettedTime[url] = 1;
  setTimeout(function () {
    delete urlBrowsedWithinSettedTime[url];
  }, getParam('diapause_time'));
}

function notify_(content, timeout = 3000) {
  let opt = {
    type: 'basic',
    title: chrome.i18n.getMessage('extension_name'),
    message: content,
    iconUrl: 'images/icon_notify_48.png',
  };
  chrome.notifications.create('', opt, function (id) {
    setTimeout(function () {
      chrome.notifications.clear(id, function () {
      });
    }, timeout);
  });
}

function getDomain(url) {
  let arr = url.split("/");
  return arr[0] + "//" + arr[2];
}

function getStableUrl(orgUrl) {
  let url;
  try {
    url = new URL(orgUrl);
  } catch (e) {
    console.log("Error, new URL() failed, orgUrl:", orgUrl);
    return orgUrl;
  }
  // 解决url中带有hash字段导致的页面重复计数问题。
  url.hash = '';
  let params = url.searchParams;
  switch (url.hostname) {
    case "www.youtube.com": {
      params.delete('t');
      break;
    }
    // ...
  }

  return url.toString();
}
