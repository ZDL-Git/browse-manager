let OPERATIONS = {
  menu: {
    addUrlBlacklist: "URL加入黑名单（不再访问）",
    addUrlWhitelist: "URL加入白名单（不再统计）",
    addDomainBlacklist: "Domain加入黑名单（不再访问）",
    addDomainWhitelist: "Domain加入白名单（不再统计）"
  },

  execOp: function (tab, url, op) {
    let stableUrl = URL_UTILS.getStableUrl(url || tab && tab.url);
    let domain = URL_UTILS.getDomain(stableUrl);

    if (/^chrome/.test(stableUrl)) {
      UTILS.notify_('chrome相关的网页默认在白名单->' + stableUrl);
      return;
    }

    switch (op) {
      case OPERATIONS.menu.addUrlBlacklist: {
        LS.setItem(stableUrl, OPERATIONS.menu.addUrlBlacklist);
        BOOKMARK.delBookmark(stableUrl);
        break;
      }
      case OPERATIONS.menu.addUrlWhitelist: {
        LS.setItem(stableUrl, OPERATIONS.menu.addUrlWhitelist);
        break;
      }
      case OPERATIONS.menu.addDomainBlacklist: {
        LS.setItem(domain, OPERATIONS.menu.addDomainBlacklist);
        break;
      }
      case OPERATIONS.menu.addDomainWhitelist: {
        LS.setItem(domain, OPERATIONS.menu.addDomainWhitelist);
        break;
      }
    }
    tab && TABS.setTabBadge(tab);
  }
};

let LS = {
  getItem: function (key) {
    return localStorage[key];
  },

  setItem: function (key, value) {
    localStorage[key] = value;
  },

  removeItem: function (key) {
    localStorage.removeItem(key);
  },

  forEach: function (callback) {
    Object.keys(localStorage).forEach(function (k) {
      callback(k, localStorage[k]);
    })
  }
};

let STORAGE = {
  getItem: function (key, callback) {
    chrome.storage.local.get(key, callback);
  },

  setItem: function (key, value) {
    chrome.storage.local.set({[key]: value}, function () {
      consoleDebug(`chrome.storage.local.set\n key: ${key}\n value: ${value}`);
    });
  },

  removeItem: function (key) {
    chrome.storage.local.remove(key, function () {
      consoleDebug(`chrome.storage.local.remove:\n key: ${key}`);
    });
  }
};

let RUNLOG = {
  write: function (c, v) {
    LS.setItem('RUNLOG:' + c, v);
  },
  read: function (c) {
    return LS.getItem('RUNLOG:' + c);
  }
};

let HISTORY = (function () {
  // 对设定时间内频繁访问做过滤，不计数
  let urlsBrowsedWithinSetTime = {};
  // 记录tab最近一次访问的url
  // 新url先判断是否黑名单，是则指向tabsLastUrl中的值（为空则关闭标签），非黑名单则更新
  let tabsLastUrl = {};
  // 解决浏览器多用户环境切换导致的计数增加问题
  let tabsOnChromeUserOpening = {};

  return {
    getTabLastUrl: function (tabId) {
      return tabsLastUrl[tabId];
    },

    updateTabLastUrl: function (tab) {
      let tabId = tab.id;
      let stableUrl = URL_UTILS.getStableUrl(tab.url);
      if (/^https?:\/\/www\.baidu\.com\/link\?/.test(stableUrl)) return;
      // 在跳转到其它页面前重新激活，以关闭时间作为最后访问时间。解决临时切换到其它标签再切回导致的次数增加
      if (HISTORY.tabLastUrlExists(tabId)) {
        HISTORY.cacheUrlWithinSetTime(HISTORY.getTabLastUrl(tabId));
      }
      tabsLastUrl[tabId] = stableUrl;
      consoleDebug(`Tab ${tabId} lastUrl update:\n` + stableUrl);
    },

    deleteTabLastUrl: function (tabId) {
      delete tabsLastUrl[tabId];
    },

    tabLastUrlExists: function (tabId) {
      return tabsLastUrl.hasOwnProperty(tabId);
    },

    cacheUrlWithinSetTime: function (url) {
      if (SETTINGS.checkParam(SETTINGS.PARAMS.bIgnoreDuplicate, 'false')
        || SETTINGS.checkParam(SETTINGS.PARAMS.timeIgnoreDuplicate, '0'))
        return;

      let sequence = Date.now();
      urlsBrowsedWithinSetTime[url] = sequence;
      setTimeout(function () {
        if (urlsBrowsedWithinSetTime[url] === sequence)
          delete urlsBrowsedWithinSetTime[url];
      }, SETTINGS.getParam(SETTINGS.PARAMS.timeIgnoreDuplicate));
    },

    browsedWithinSetTime: function (url) {
      return urlsBrowsedWithinSetTime.hasOwnProperty(url);
    },

    setTabsOnChromeUserOpening: function (tabs) {
      tabsOnChromeUserOpening = tabs;
    },

    inTabsOnChromeUserOpening: function (tab) {
      for (const [key, value] of Object.entries(tabsOnChromeUserOpening)) {
        if (value.id === tab.id && value.url === tab.url) {
          delete tabsOnChromeUserOpening[key];
          return true;
        }
      }
      return false;
    },
  };
})();

let EVENTS = {
  onChromeUserOpening: function (windowId) {
    chrome.tabs.query({windowId: windowId}, function (tabs) {
      HISTORY.setTabsOnChromeUserOpening(tabs);
    })
  },
};

let SETTINGS = {
  PARAMS: Object.freeze({
    bAutoSaveBookmark: 'bAutoSaveBookmark',
    browseTimesTriggerAutoSaveBookmark: 'browseTimesTriggerAutoSaveBookmark',
    bookmarkFolderName: 'bookmarkFolderName',
    bIgnoreDuplicate: 'bIgnoreDuplicate',
    timeIgnoreDuplicate: 'timeIgnoreDuplicate',
    bPageShowDuplicate: 'bPageShowDuplicate',
    bPageShowBrowseTimes: 'bPageShowBrowseTimes',
    bCsdnAutoExpand: 'bCsdnAutoExpand',
  }),
  initialize: function () {
    this.touchParam(this.PARAMS.bAutoSaveBookmark, true);
    this.touchParam(this.PARAMS.browseTimesTriggerAutoSaveBookmark, 5);
    this.touchParam(this.PARAMS.bookmarkFolderName, '经常访问(BM)');
    this.touchParam(this.PARAMS.bIgnoreDuplicate, true);
    this.touchParam(this.PARAMS.timeIgnoreDuplicate, 120000);
    this.touchParam(this.PARAMS.bPageShowDuplicate, true);
    this.touchParam(this.PARAMS.bPageShowBrowseTimes, true);
    this.touchParam(this.PARAMS.bCsdnAutoExpand, false);
  },
  touchParam: function (paramName, defaultValue) {
    if (!SETTINGS.getParam(paramName)) {
      SETTINGS.setParam(paramName, defaultValue);
    }
  },
  setParam: function (paramName, value) {
    LS.setItem('SETTINGS:' + paramName, value);
  },
  getParam: function (paramName) {
    return LS.getItem('SETTINGS:' + paramName);
  },
  getAllParams: function () {
    let obj = {};
    for (let [k, v] of Object.entries(SETTINGS.PARAMS)) {
      obj[v] = SETTINGS.getParam(v);
    }
    return obj;
  },
  checkParam: function (paramName, expect) {
    return SETTINGS.getParam(paramName) === expect;
  },
  delParam: function (paramName) {
    LS.removeItem('SETTINGS:' + paramName);
  },
};


let BOOKMARK = {
  touchBookmarkFolder: function (callback) {
    let bookmarkTitle = SETTINGS.getParam(SETTINGS.PARAMS.bookmarkFolderName);
    chrome.bookmarks.search({title: bookmarkTitle}, function (results) {
      if (results.length >= 1) {
        callback(results[0].id);
      } else {
        chrome.bookmarks.create({
          parentId: '1',
          title: bookmarkTitle,
        }, function (bookmark) {
          UTILS.notify_('已自动创建收藏夹 ' + bookmarkTitle);
          callback(bookmark.id);
        });
      }
    })
  },

  addBookmark: function (tab) {
    let stableUrl = URL_UTILS.getStableUrl(tab.url);

    BOOKMARK.touchBookmarkFolder(function (bookmarkId) {
      chrome.bookmarks.search({url: tab.url}, function (results) {
        if (results.length > 0) return;
        chrome.bookmarks.search({url: stableUrl}, function (results) {
          if (results.length > 0) return;
          chrome.bookmarks.create({
            parentId: bookmarkId,
            url: stableUrl,
            title: tab.title
          }, function (bookmark) {
            UTILS.notify_('经常访问此网页,自动加入收藏夹:\n' + bookmark.title, 5000);
          })
        })
      })
    })
  },

  delBookmark: function (url) {
    chrome.bookmarks.search({url: url}, function (results) {
      results.forEach(function (result) {
        chrome.bookmarks.remove(result.id, function () {
          UTILS.notify_('已同时从收藏夹中删除.');
        })
      })
    })
  }
};


let TABS = {
  retrieveTab: function (tabId, callback) {
    chrome.tabs.get(tabId, callback);
  },
  queryActiveTab: function (callback) {
    chrome.tabs.query(
      {currentWindow: true, active: true},
      function (tabs) {
        callback(tabs[0]);
      }
    )
  },
  registerTabs: function () {
    chrome.tabs.query({}, function (tabs) {
      Array.from(tabs).forEach(function (tab) {
        HISTORY.updateTabLastUrl(tab);

        tab.active && TABS.setTabBadge(tab);
      })
    });
  },
  sendMessageToTab: function (tabId, message) {
    // 解决阻塞问题
    setTimeout(function () {
      try {
        chrome.tabs.sendMessage(tabId, message);
      } catch (e) {
      }
    }, 200);
  },
  refreshActiveTabBadge: function () {
    TABS.queryActiveTab(function (tab) {
      TABS.setTabBadge(tab);
    })
  },
  setTabBadge: function (tab) {
    try {
      let stableUrl = URL_UTILS.getStableUrl(tab.url);
      COUNTING.getBrowsedTimes(stableUrl, function (browseTimes) {
        if (URL_UTILS.isWhitelist(stableUrl) || URL_UTILS.isBlacklist(stableUrl) || !browseTimes) {
          chrome.browserAction.setBadgeText({text: '', tabId: tab.id});
        } else {
          let bgColor = browseTimes >= parseInt(SETTINGS.getParam(SETTINGS.PARAMS.browseTimesTriggerAutoSaveBookmark)) ?
            [255, 0, 0, 255] : [70, 136, 241, 255];
          chrome.browserAction.setBadgeBackgroundColor({color: bgColor, tabId: tab.id});
          chrome.browserAction.setBadgeText({text: '' + browseTimes, tabId: tab.id});
        }
      });
    } catch (e) {
    }
  },
  filterBlacklistUrl: function (tabId, url) {
    if (!URL_UTILS.isBlacklist(url)) return false;
    let noticeContent = '黑名单网站，不再访问';
    if (HISTORY.tabLastUrlExists(tabId)) {
      chrome.tabs.update(tabId, {url: HISTORY.getTabLastUrl(tabId)}, function (tab) {
        UTILS.notify_(noticeContent);
        console.log(url, "黑名单网站，页面返回");
      });
    } else {
      chrome.tabs.query({}, function (tabs) {
        if (tabs.length > 1) {
          chrome.tabs.remove(tabId);
          UTILS.notify_(noticeContent);
          console.log(url, "黑名单网站，标签关闭");
        } else {
          chrome.tabs.update(tabId, {url: 'chrome-search://local-ntp/local-ntp.html'}, function () {
            UTILS.notify_(noticeContent);
            console.log(url, "黑名单网站，页面返回");
          });
        }
      });
    }
    return true;
  }
};

let COUNTING = {
  increaseAndShowBrowseTimes: function (tab) { // 含异步接口，妥协单一职责
    consoleDebug('COUNTING.increaseAndShowBrowseTimes()');
    let stableUrl = URL_UTILS.getStableUrl(tab.url);
    COUNTING.getBrowsedTimes(stableUrl, function (times) {
      times = (times || 0) + 1;
      COUNTING.setBrowsedTimes(stableUrl, times);

      TABS.setTabBadge(tab);
      CONTENT.displayBrowseTimesOnPageWithCheck(tab, times);

      SETTINGS.checkParam(SETTINGS.PARAMS.bAutoSaveBookmark, 'true')
      && times === parseInt(SETTINGS.getParam(SETTINGS.PARAMS.browseTimesTriggerAutoSaveBookmark))
      && BOOKMARK.addBookmark(tab);
    })
  },

  getBrowsedTimes: function (url, callback) {
    STORAGE.getItem(url, function (item) {
      let t = parseInt(item[url]);
      callback(isNaN(t) ? null : t);
    });
  },

  setBrowsedTimes: function (url, times) {
    STORAGE.setItem(url, times);
  }
};


let URL_UTILS = {
  moveToUrlObj: function (url) {
    try {
      return new URL(url);
    } catch (e) {
      consoleDebug("Warning, new URL() failed, orgUrl:", url);
      return null;
    }
  },

  isValidUrl: function (url) {
    try {
      new URL(url);
      return true;
    } catch (e) {
    }
    // TODO: 需优化
    // 部分百度等网站url无法转URL对象，但是能正常访问，在此兼容
    let arr = url.split("/");
    return arr[0] && arr[1] === '' && arr[2];
  },

  getStableUrl: (function () {
    let stableUrlCache = {};
    return function (url) {
      let h = stableUrlCache[url];
      if (h) return h;

      let stableUrl, urlObj, params;
      urlObj = URL_UTILS.moveToUrlObj(url);
      if (urlObj) {
        url.match('#.*/') || (urlObj.hash = '');  // 解决url中带有hash字段导致的页面重复计数问题。match剔除导航到其它页面的hash格式
        params = urlObj.searchParams;
        switch (urlObj.hostname) {
          case "www.youtube.com": {
            params.forEach(function (v, k, parent) {
              if (k !== 'v') params.delete(k);
            });
            break;
          }
          case "www.bilibili.com": {
            params.forEach(function (v, k, parent) {
              if (k !== 'p') params.delete(k);
            });
            break;
          }
          // ...
        }
      }

      stableUrl = (urlObj || URL_UTILS.isValidUrl(url) && url || url + '(网址格式错误)').toString().replace(/\/$/, "");
      url === stableUrl || consoleDebug(url + '  ==>stableUrl: ' + stableUrl);

      Object.keys(stableUrlCache).length > 20 && (stableUrlCache = {});
      stableUrlCache[url] = stableUrl;

      return stableUrl;
    }
  })(),

  getDomain: function (url) {
    let arr, urlObj;
    return (urlObj = URL_UTILS.moveToUrlObj(url)) && urlObj.origin !== 'null' && urlObj.origin
      || URL_UTILS.isValidUrl(url) && (arr = url.split("/")) && arr[0] + "//" + arr[2]
      || url + "(域名格式错误)";
  },

  isWhitelist: function (url) {
    let isDefaultWhitelist = /^chrome/.test(url)
      || /^https?:\/\/www\.baidu\.com/.test(url)
      || /^https?:\/\/www\.google\.com/.test(url);

    return isDefaultWhitelist
      || LS.getItem(url) === OPERATIONS.menu.addUrlWhitelist
      || LS.getItem(this.getDomain(url)) === OPERATIONS.menu.addDomainWhitelist;
  },

  isBlacklist: function (url) {
    if (/^chrome/.test(url)) return false;

    return LS.getItem(url) === OPERATIONS.menu.addUrlBlacklist
      || LS.getItem(this.getDomain(url)) === OPERATIONS.menu.addDomainBlacklist;
  },

  checkBrowsingStatus: function (tab) {
    let stableUrl = this.getStableUrl(tab.url);
    let tabId = tab.id;

    // 黑白名单
    if (URL_UTILS.isWhitelist(stableUrl) || URL_UTILS.isBlacklist(stableUrl)) {
      consoleDebug(stableUrl, "黑白名单");
      return URL_UTILS.STATUS.INVALID;
    }

    // 'The Greate Suspender'类软件的跳转
    // 且以前未访问过，则为有效访问需要计数
    if (/^chrome-extension/.test(HISTORY.getTabLastUrl(tabId))) {
      consoleDebug(stableUrl, "跳转自chrome-extension");
      return URL_UTILS.STATUS.INVALID;
    }

    // 不包括刷新操作，刷新时url没有变化。
    if (HISTORY.getTabLastUrl(tabId) === stableUrl) {
      consoleDebug(stableUrl, "地址未发生变化");
      return URL_UTILS.STATUS.INVALID;
    }

    // 忽略在timeIgnoreDuplicate间的重复访问
    if (SETTINGS.checkParam(SETTINGS.PARAMS.bIgnoreDuplicate, 'true') && HISTORY.browsedWithinSetTime(stableUrl)) {
      consoleDebug(stableUrl, "在设置的忽略间隔中");
      return URL_UTILS.STATUS.DUPLICATE;
    }

    // 避免浏览器启动后打开另一用户导致其所有默认启动页面计数加一
    if (HISTORY.inTabsOnChromeUserOpening(tab)) {
      consoleDebug(stableUrl, "浏览器用户启动恢复页面");
      return URL_UTILS.STATUS.INVALID;
    }

    consoleDebug(stableUrl, "计数有效");
    return URL_UTILS.STATUS.INCREASE;
  },

  STATUS: Object.freeze({
    INCREASE: 'increase',
    DUPLICATE: 'duplicate',
    INVALID: 'invalid'
  })
};

let CONTENT = {
  displayBrowseTimesOnPageWithCheck: function (tab, times) {
    if (!tab.active || SETTINGS.checkParam(SETTINGS.PARAMS.bPageShowBrowseTimes, 'false')) return;

    let css = times > 3 ? {color: '#fe4a49'} : {};
    TABS.sendMessageToTab(tab.id, {
      function: "DISPLAYER.display",
      paramsArray: [times, css, 'tip_template']
    });
  },

  displayDuplicateOnPageWithCheck: function (tab) {
    if (!tab.active || SETTINGS.checkParam(SETTINGS.PARAMS.bPageShowDuplicate, 'false')) return;

    TABS.sendMessageToTab(tab.id, {
      function: "DISPLAYER.display",
      paramsArray: ['DUPLICATE', {'font-size': '50px'}, 'tip_template']
    });
  },

  // 2.页面执行的方式二
  individuateSite: function (tab) {
    let stableUrl = URL_UTILS.getStableUrl(tab.url);
    // csdn 网站目前已经取消了默认折叠内容的设置，所以此功能不再使用，只作为demo供参考。
    if (SETTINGS.checkParam(SETTINGS.PARAMS.bCsdnAutoExpand, 'true')
      && (stableUrl.match("^https://blog.csdn.net") || stableUrl.match("^https://.*.iteye.com"))) {
      TABS.sendMessageToTab(tab.id, {
        function: "csdnExpandContent"
      });
    }
  },
};


let UTILS = {
  notify_: function (content, timeout = 3000, notificationId = '') {
    let opt = {
      type: 'basic',
      title: chrome.i18n.getMessage('extension_name'),
      message: content,
      iconUrl: 'images/icon48.png',
      requireInteraction: true,
    };
    chrome.notifications.create(notificationId, opt, function (id) {
      consoleDebug('chrome notification:', opt);
      timeout !== 0
      && setTimeout(function () {
        chrome.notifications.clear(id);
      }, timeout);
    });
  },

  createContextMenus: function () {
    Object.values(OPERATIONS.menu).forEach(function (title) {
      chrome.contextMenus.create({
        type: 'normal',
        title: title, id: "Menu-" + title, contexts: ['all']
      });
    });
  },

  checkForUpdates: function () {
    let installFromWBS = chrome.runtime.getManifest().update_url;
    installFromWBS || fetch('https://raw.githubusercontent.com/ZDL-Git/browse-manager/master/manifest.json')
      .then(function (response) {
        return response.json();
      })
      .then(function (json) {
        let localVersion = chrome.runtime.getManifest().version;
        let githubNewest = json.version;
        if (localVersion !== githubNewest && RUNLOG.read(githubNewest) !== 'notified') {
          let content = `检测到新版本 ${githubNewest}，本地版本 ${localVersion}，点此更新。`;
          let link = 'https://github.com/ZDL-Git/browse-manager/tree/master/distribution/crx';
          UTILS.notify_(content, 0, link);
        }
        RUNLOG.write(githubNewest, 'notified');
      });
  },

  getStorage: function (key, value) {
    return (key.startsWith('SETTINGS:') || key.startsWith('RUNLOG:') || Object.values(OPERATIONS.menu).includes(value))
      ? 'LS' : 'STORAGE';
  },
};

let consoleDebug = (function () {
  return (SETTINGS.checkParam('debug', 'true'))
    ? console.debug : () => {
    };
})();
