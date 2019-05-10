let OPERATIONS = [
  "URL加入黑名单（不再访问）",
  "URL加入白名单（不再统计）",
  "Domain加入黑名单（不再访问）",
  "Domain加入白名单（不再统计）"
];

function initializeSettings() {
  touchSetting('is_auto_save', true);
  touchSetting('auto_save_thre', 5);
  touchSetting('bookmark_title', '经常访问(BM)');
  touchSetting('is_diapause', true);
  touchSetting('diapause_time', 120000);
  touchSetting('is_page_show', true);
}

function touchSetting(paramName, defaultValue) {
  if (!getParam(paramName)) {
    setParam(paramName, defaultValue);
  }
}

function setParam(paramName, value) {
  setItem('SETTINGS:' + paramName, value);
}

function getParam(paramName) {
  return getValue('SETTINGS:' + paramName);
}

function getValue(key) {
  return localStorage[key];
}

function setItem(key, value) {
  localStorage[key] = value;
}

function removeItem(key) {
  localStorage.removeItem(key);
}


function registerTabs() {
  chrome.tabs.query({}, function (tabs) {
    Array.from(tabs).forEach(function (tab) {
      setTabLastUrl(tab);

      if (tab.active) {
        setTabBadge(tab);
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

function getTabLastUrl(tabId) {
  return tabsLastUrl[tabId];
}

function deleteTabLastUrl(tabId) {
  delete tabsLastUrl[tabId];
}

function tabLastUrlExists(tabId) {
  return tabsLastUrl.hasOwnProperty(tabId);
}


function isWhitelist(url) {
  let isDefaultWhitelist = /^chrome/.test(url)
    || /^https?:\/\/www\.baidu\.com\//.test(url)
    || /^https?:\/\/www\.google\.com\//.test(url);

  return isDefaultWhitelist
    || getValue(url) === OPERATIONS[1]
    || getValue(getDomain(url)) === OPERATIONS[3];
}

function isBlacklist(url) {
  if (/^chrome/.test(url)) return false;

  return getValue(url) === OPERATIONS[0]
    || getValue(getDomain(url)) === OPERATIONS[2];
}


function isEffectual(tab) {
  let stableUrl = getStableUrl(tab.url);
  let tabId = tab.id;

  // 黑白名单
  if (isWhitelist(stableUrl) || isBlacklist(stableUrl)) {
    console.log(stableUrl, "黑白名单");
    return false;
  }

  // 'The Greate Suspender'类软件的跳转
  // 判断browseTimes，如果不在黑白名单，且以前未访问过，则为有效访问需要计数；
  if (/^chrome-extension/.test(getTabLastUrl(tabId)) && getBrowsedTimes(stableUrl)) {
    console.log(stableUrl, "跳转自chrome-extension");
    return false;
  }

  // 忽略在diapause_time间的重复访问
  if (getParam('is_diapause') === 'true' && urlBrowsedWithinSettedTime.hasOwnProperty(stableUrl)) {
    console.log(stableUrl, "在设置的忽略间隔中");
    return false;
  }

  // 不包括刷新操作，刷新时url没有变化。
  if (getTabLastUrl(tabId) === stableUrl) {
    console.log(stableUrl, "地址未发生变化");
    return false;
  }

  console.log(stableUrl, "计数有效");
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

  let browseTimes = getBrowsedTimes(stableUrl);
  if (browseTimes === null) return;

  let saveThre = parseInt(getParam('auto_save_thre'));
  if (browseTimes < saveThre || browseTimes >= saveThre + 3) return;

  touchBookmarkFolder(function (bookmarkId) {
    chrome.bookmarks.search({url: stableUrl}, function (results) {
      if (results.length === 0) {
        chrome.bookmarks.create({
          parentId: bookmarkId,
          url: stableUrl,
          title: tab.title
        }, function (bookmark) {
          notify_('经常访问此网页,自动加入收藏夹:\n' + bookmark.title, 5000);
        })
      }
    })
  })
}

function delBookmark(url) {
  chrome.bookmarks.search({url: url}, function (results) {
    results.forEach(function (result) {
      chrome.bookmarks.remove(result.id, function () {
        notify_('已同时从收藏夹中删除.');
      })
    })
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

function setActiveTabBadge() {
  chrome.tabs.query(
    {currentWindow: true, active: true},
    function (tabArray) {
      setTabBadge(tabArray[0]);
    }
  )
}

function setTabBadge(tab) {
  if (!tab) return;

  chrome.tabs.get(tab.id, function (tab) {
    if (chrome.runtime.lastError) return;

    let stableUrl = getStableUrl(tab.url);
    let browseTimes = getBrowsedTimes(stableUrl);
    if (isWhitelist(stableUrl) || isBlacklist(stableUrl) || !browseTimes) {
      chrome.browserAction.setBadgeText({text: '', tabId: tab.id});
    } else {
      let bgColor = browseTimes >= parseInt(getParam('auto_save_thre')) ?
        [255, 0, 0, 255] : [70, 136, 241, 255];
      chrome.browserAction.setBadgeBackgroundColor({color: bgColor, tabId: tab.id});
      chrome.browserAction.setBadgeText({text: '' + browseTimes, tabId: tab.id});
    }
  });
}

function increaseBrowseTimes(url) {
  let stableUrl = getStableUrl(url);
  let browseTimes = (getBrowsedTimes(stableUrl) || 0) + 1;
  setBrowsedTimes(stableUrl, browseTimes);
}

function getBrowsedTimes(url) {
  let t = parseInt(getValue(url));
  return isNaN(t) ? null : t;
}

function setBrowsedTimes(url, times) {
  setItem(url, times);
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
  let url, params;
  try {
    url = new URL(orgUrl);
  } catch (e) {
    console.error("Error, new URL() failed, orgUrl:", orgUrl);
    return orgUrl;
  }

  // 解决url中带有hash字段导致的页面重复计数问题。
  url.hash = '';

  params = url.searchParams;
  switch (url.hostname) {
    case "www.youtube.com": {
      params.delete('t');
      break;
    }
    // ...
  }

  return url.toString();
}
