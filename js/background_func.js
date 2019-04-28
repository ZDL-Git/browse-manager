function initializeSettings() {
  if (!localStorage['is_auto_save']) localStorage['is_auto_save'] = true;
  if (!localStorage['auto_save_thre']) localStorage['auto_save_thre'] = 5;
  if (!localStorage['bookmark_title']) localStorage['bookmark_title'] = '经常访问(BM)';
  if (!localStorage['is_diapause']) localStorage['is_diapause'] = true;
  if (!localStorage['diapause_time']) localStorage['diapause_time'] = 120000;
  if (!localStorage['is_page_show']) localStorage['is_page_show'] = true;
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
  if (tabsLastUrl.hasOwnProperty(tabId)) {
    cacheRecentUrl(tabsLastUrl[tabId]);
  }

  tabsLastUrl[tabId] = getCleanedUrl(tab.url);
}

function isWhitelist(url) {

  return localStorage.hasOwnProperty(url + whiteListSuffix)
    || isDefaultWhitelist(url)
    || localStorage.hasOwnProperty(getDomain(url) + whiteListSuffix);
}

function isDefaultWhitelist(url) {

  return /^chrome/.test(url)
    || /^https?:\/\/www\.baidu\.com\//.test(url)
    || /^https?:\/\/www\.google\.com\//.test(url);

}

function isBlacklist(url) {
  if (/^chrome/.test(url)) return false;

  return localStorage.hasOwnProperty(url + blackListSuffix)
    || localStorage.hasOwnProperty(getDomain(url) + blackListSuffix);
}

function updateActivatedValidUrl(url) {
  localStorage['onActivated_url'] = url;
}

function getActivatedLastValidUrl() {
  return localStorage['onActivated_url'];
}

function isEffectual(tab) {
  let result = true;
  let cleanedUrl = getCleanedUrl(tab.url);

  // 黑白名单
  if (isWhitelist(cleanedUrl) || isBlacklist(cleanedUrl)) result = false;

  // 'The Greate Suspender'类软件
  if (tab.active && /^chrome-extension/.test(getActivatedLastValidUrl())) result = false;
  updateActivatedValidUrl(cleanedUrl);

  // 忽略在diapause_time间的重复访问
  if (localStorage['is_diapause'] === 'true' && urlBrowsedWithinSettedTime.hasOwnProperty(cleanedUrl)) result = false;
  cacheRecentUrl(cleanedUrl);

  // 解决url中带有hash字段导致的页面重复计数问题。不包括刷新操作，因为刷新操作没有loading事件，不会执行到此位置。
  if (tabsLastUrl[tab.id] === cleanedUrl) result = false;

  return result;
}

function touchBookmarkDir(callback) {

  let bookmarkTitle = localStorage['bookmark_title'];
  chrome.bookmarks.search({title: bookmarkTitle}, function (results) {
    if (results.length >= 1) {
      localStorage['bookmark_id'] = results[0].id;
      callback();
    } else {
      chrome.bookmarks.create({
        parentId: '1',
        title: bookmarkTitle,
      }, function (bookmark) {
        notify_('已创建收藏夹，如想停止请在Browse Manager扩展中设置');
        localStorage['bookmark_id'] = bookmark.id;
        callback();
      });
    }
  })
}

function addBookmarkWithCheck(tab) {
  if (localStorage['is_auto_save'] === 'false') return;

  let cleanedUrl = getCleanedUrl(tab.url);

  let browseTimes = localStorage[cleanedUrl] ? parseInt(localStorage[cleanedUrl]) : 0;
  let saveThre = parseInt(localStorage['auto_save_thre']);
  if (browseTimes < saveThre || browseTimes >= saveThre + 3 || isBlacklist(cleanedUrl)) return;

  touchBookmarkDir(function () {
    chrome.bookmarks.search({url: cleanedUrl}, function (results) {
      if (results.length === 0) {
        chrome.bookmarks.create({
          parentId: localStorage['bookmark_id'],
          url: cleanedUrl,
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
    chrome.tabs.sendMessage(tab.id, {method: "displayBrowseTimes", browseTimes: localStorage[getCleanedUrl(tab.url)]});
  }, 200);
}

function setBadge(tab) {
  if (!tab) return;

  chrome.tabs.get(tab.id, function (tab) {
    if (chrome.runtime.lastError) return;

    let cleanedUrl = getCleanedUrl(tab.url);
    let browseTimes = localStorage[cleanedUrl];
    if (isWhitelist(cleanedUrl) || isBlacklist(cleanedUrl) || !browseTimes) {
      chrome.browserAction.setBadgeText({text: '', tabId: tab.id});
    } else {
      let bgColor = (parseInt(browseTimes || '0') >= parseInt(localStorage['auto_save_thre'])) ?
        [255, 0, 0, 255] : [70, 136, 241, 255];
      chrome.browserAction.setBadgeBackgroundColor({color: bgColor, tabId: tab.id});
      chrome.browserAction.setBadgeText({text: browseTimes, tabId: tab.id});
    }
  });
}

function updateBrowseTimes(tab) {

  let cleanedUrl = getCleanedUrl(tab.url);
  let browseTimes = localStorage[cleanedUrl];
  browseTimes = browseTimes ? parseInt(browseTimes) + 1 : 1;
  localStorage[cleanedUrl] = browseTimes;
}

function cacheRecentUrl(url) {
  urlBrowsedWithinSettedTime[url] = 1;
  setTimeout(function () {
    delete urlBrowsedWithinSettedTime[url];
  }, localStorage['diapause_time']);
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

function getCleanedUrl(orgUrl) {
  let url;
  try {
    url = new URL(orgUrl);
  } catch (e) {
    console.log("Error, new URL() failed, orgUrl:", orgUrl);
    return orgUrl;
  }
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
