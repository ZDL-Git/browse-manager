function isWhitelist(url) {

  return localStorage.hasOwnProperty(url + localStorage['whitelist_suffix'])
    || isDefaultWhitelist(url)
    || localStorage.hasOwnProperty(getUrlDomain(url) + localStorage['whitelist_suffix']);
}

function isDefaultWhitelist(url) {

  return /^chrome/.test(url)
    || /^https?:\/\/www\.baidu\.com\//.test(url)
    || /^https?:\/\/www\.google\.com\//.test(url);

}

function updateActivatedValidUrl(url) {
  localStorage['onActivated_url'] = url;
}

function getActivatedLastValidUrl() {
  return localStorage['onActivated_url'];
}

function isEffectual(tab) {
  let result = true;

  // 'The Greate Suspender'类软件
  if (tab.active && /^chrome-extension/.test(getActivatedLastValidUrl())) result = false;
  updateActivatedValidUrl(tab.url);

  // 2分钟重复访问
  if (localStorage['is_diapause'] === 'true' && urlBrowsedWithinSettedTime.hasOwnProperty(tab.url)) result = false;
  urlBrowsedWithinSettedTime[tab.url] = 1;
  setTimeout(function () {
    delete urlBrowsedWithinSettedTime[tab.url];
  }, localStorage['diapause_time']);

  // 启动后5s
  if (localStorage.hasOwnProperty('startup_within_5s')) result = false;

  return result;
}

function isBlacklist(url) {
  if (/^chrome/.test(url)) return false;

  return localStorage.hasOwnProperty(url + localStorage['blacklist_suffix'])
    || localStorage.hasOwnProperty(getUrlDomain(url) + localStorage['blacklist_suffix']);
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
  if (localStorage['is_auto_save'] === 'false') {
    return;
  }
  let browseTimes = localStorage[tab.url] ? parseInt(localStorage[tab.url]) : 0;
  let saveThre = parseInt(localStorage['auto_save_thre']);
  if (browseTimes < saveThre || browseTimes >= saveThre + 3 || isBlacklist(tab.url)) {
    return;
  }

  touchBookmarkDir(function () {
    chrome.bookmarks.search({url: tab.url}, function (results) {
      if (results.length === 0) {
        chrome.bookmarks.create({
          parentId: localStorage['bookmark_id'],
          url: tab.url,
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

function setBadge(tab) {

  if (!tab) return;

  let browseTimes = localStorage[tab.url];
  if (isWhitelist(tab.url) || !browseTimes) {
    chrome.tabs.get(tab.id, function (tab) {
      if (chrome.runtime.lastError) {
        return;
      }

      chrome.browserAction.setBadgeText({text: '', tabId: tab.id});
    });
  } else {
    chrome.tabs.get(tab.id, function (tab) {
      if (chrome.runtime.lastError) {
        return;
      }
      let bgColor = (parseInt(browseTimes ? browseTimes : '0') >= parseInt(localStorage['auto_save_thre'])) ?
        [255, 0, 0, 255] : [70, 136, 241, 255];
      chrome.browserAction.setBadgeBackgroundColor({color: bgColor, tabId: tab.id});
      chrome.browserAction.setBadgeText({text: browseTimes, tabId: tab.id});
    })
  }

}

function updateBrowseTimes(tab) {

  let url = tab.url;
  let browseTimes = localStorage[url];
  browseTimes = browseTimes ? parseInt(browseTimes) + 1 : 1;
  localStorage[url] = browseTimes;
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

function getUrlDomain(url) {
  // 可用正则
  return url.replace('//', '`.@^').split('/')[0].replace('`.@^', '//');
}
