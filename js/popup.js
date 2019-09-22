window.onload = function () {
  TABLES.init();

  loadSettingsToPage();
  addSettingListener();
};

let TABLES = {
  input: $('input#search'),
  tables: $('table'),
  init: function () {
    TABLES.loadTables();
    TABLES.addTheadEventsListeners();
    TABLES.addContentEventsListeners();
    TABLES.addSearchFilterListener();
  },
  loadTables: function () {
    LS.forEach(function (key, value) {
        TABLES.appendToTable(key, null, value);
      }
    )
  },
  reLoadTables: function () {
    TABLES.tables.find('tbody tr').remove();
    TABLES.loadTables();
  },
  appendToTable: function (orgUrl, tableName, op) {
    if (tableName) {
    } else if (op === OPERATIONS.menu.addUrlWhitelist) {
      tableName = 'table-url-white';
    } else if (op === OPERATIONS.menu.addUrlBlacklist) {
      tableName = 'table-url-black';
    } else if (op === OPERATIONS.menu.addDomainWhitelist) {
      tableName = 'table-domain-white';
    } else if (op === OPERATIONS.menu.addDomainBlacklist) {
      tableName = 'table-domain-black';
    } else {
      return;
    }

    let url;
    try {
      url = decodeURI(orgUrl);
    } catch (e) {
      url = orgUrl;
    }

    $(`table#${tableName} tbody`).append(
      '<tr>' +
      '<td class="decode-url">' + url + '</td>' +
      '<td class="delete-row">✘</td>' +
      '<td class="hidden-org-url">' + orgUrl + '</td>' +
      '</tr>'
    );
  },
  showAllTrs: function () {
    document.querySelectorAll("tr").forEach(tr => tr.hidden = false);
  },
  addTheadEventsListeners: function () {
    $('th.add-row').on('click', function () {
      let tableName, url, op, tip = '请先在此处输入需要添加的网址';
      if (!(url = TABLES.input.val()) && TABLES.input.attr('placeholder', tip).focus() || url === tip) {
        return;
      }

      tableName = $(this).closest('table').attr('id');
      tableName === 'table-url-white' && (op = OPERATIONS.menu.addUrlWhitelist)
      || tableName === 'table-url-black' && (op = OPERATIONS.menu.addUrlBlacklist)
      || tableName === 'table-domain-white' && (op = OPERATIONS.menu.addDomainWhitelist)
      || tableName === 'table-domain-black' && (op = OPERATIONS.menu.addDomainBlacklist);
      OPERATIONS.execOp(null, url, op);
      TABLES.reLoadTables();
      TABLES.addContentEventsListeners();
      TABLES.input.trigger('input');
    });
  },
  addContentEventsListeners: function () {
    $('td.delete-row').on('click', function () {
      let url = $(this).siblings('.hidden-org-url').text();
      LS.removeItem(url);
      TABS.refreshActiveTabBadge();

      $(this).closest('tr').remove();
    });
  },
  // 实现search时列表的实时过滤
  addSearchFilterListener: function () {
    let input = document.getElementById("search");
    input.oninput = function () {
      // 先全部show再判断隐藏的模式比较稳定
      TABLES.showAllTrs();

      if (!input.value) {
        return;
      }

      let searchLC = input.value.trim().toLowerCase();
      document.querySelectorAll('table > tbody > tr').forEach(function (tr) {
        let decodeUrl = tr.querySelector('td.decode-url');
        let orgUrl = tr.querySelector('td.hidden-org-url');
        let table = tr.closest('table').id;
        if (
          ['table-domain-black', 'table-domain-white'].includes(table)
          && (decodeUrl.innerText.trim().toLowerCase() === URL_UTILS.getDomain(searchLC)
          || orgUrl.innerText.trim().toLowerCase() === URL_UTILS.getDomain(searchLC))
        ) {
          return;
        }
        if (
          decodeUrl.innerText.trim().toLowerCase().indexOf(searchLC) === -1
          && orgUrl.innerText.trim().toLowerCase().indexOf(searchLC) === -1
        ) {
          tr.hidden = true;
        }
      });
    };
  },
};

function loadSettingsToPage() {
  $('.settings—container input[type=checkbox]').each(function () {
    this.checked = SETTINGS.checkParam($(this).attr('setting'), 'true');
  });

  $('.settings—container input[type=text]').each(function () {
    let param = $(this).attr('setting');
    let paramValue = SETTINGS.getParam(param);
    if (param === SETTINGS.PARAMS.timeIgnoreDuplicate) paramValue = paramValue / 1000;
    this.value = paramValue;
  });
}

function addSettingListener() {
  $('#setting-btn, #setting-btn-icon').on('click', function () {
    $('#settings-detail').css('display', 'block');
  });

  $('.settings—container input[type=checkbox]').on('click', function () {
    SETTINGS.setParam($(this).attr('setting'), $(this).prop('checked'));
  });

  $('.settings—container input[type=text]').on('input', function () {
    let param = $(this).attr('setting');
    let paramValue = $(this).val();
    if (param === SETTINGS.PARAMS.timeIgnoreDuplicate) paramValue = paramValue * 1000;
    SETTINGS.setParam(param, paramValue);
  });

  $('#import-data').on('click', function () {
    $('#hidden-file-input').click();
  });

  $('#hidden-file-input').on("change", function () {
    importDataFromFile(this);
    // 以支持多次导入同名文件
    $(this).val('');
  });

  $('#export-data').on('click', function () {
    exportDataToFile();
  });

}

function exportDataToFile() {
  chrome.storage.local.get(null,
    function (items) {
      let data = JSON.stringify({'LS': localStorage, 'STORAGE': items}, null, 2);
      chrome.downloads.download({
        url: "data:text/json;base64," + btoa(unescape(encodeURIComponent(data))),
        filename: "BrowseManager_data.json",
        conflictAction: "prompt", // or "overwrite" / "prompt"
        saveAs: false, // true gives save-as dialogue
      }, function (downloadId) {
        console.log('localStorage导出结束');
      });
    }
  )
}

function importDataFromFile(inputFile) {
  let file, fr, data;
  if (!(file = inputFile.files[0])) return;
  fr = new FileReader();
  fr.onload = function () {
    data = JSON.parse(this.result);
    for (let [k, v] of Object.entries(data.LS)) {
      LS.setItem(k, v);
    }
    for (let [k, v] of Object.entries(data.STORAGE)) {
      STORAGE.setItem(k, v);
    }
  };
  fr.readAsText(file);
}
