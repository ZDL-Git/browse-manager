window.onload = function () {
  loadTableContent();
  addTableFilterListener();
  addTableRowDeleteListener();
  loadSettingsToPage();
  addSettingListener();
};

function loadTableContent() {

  LS.forEach(function (key, value) {
      let table, url;
      if (value === OPERATIONS.addUrlWhitelist) {
        table = 'table-url-white';
      } else if (value === OPERATIONS.addUrlBlacklist) {
        table = 'table-url-black';
      } else if (value === OPERATIONS.addDomainWhitelist) {
        table = 'table-domain-white';
      } else if (value === OPERATIONS.addDomainBlacklist) {
        table = 'table-domain-black';
      } else {
        // 相当于continue
        return;
      }

      try {
        url = decodeURI(key);
      } catch (e) {
        url = key;
      }

    $(`#${table} tbody`).append(
        '<tr>' +
      '<td class="decode-url">' + url + '</td>' +
        '<td class="delete-row">✕</td>' +
      '<td class="hidden-org-url">' + key + '</td>' +
        '</tr>'
      );
    }
  )
}

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

function showAllTrs() {
  document.querySelectorAll("tr").forEach(tr => tr.hidden = false);
}

// 实现search时列表的实时过滤
function addTableFilterListener() {
  let input = document.getElementById("search");

  input.oninput = function () {
    // 先全部show再判断隐藏的模式比较稳定
    showAllTrs();

    if (!input.value) {
      return;
    }

    let search = input.value.trim().toUpperCase();
    document.querySelectorAll('table > tbody > tr').forEach(function (tr) {
      let decode_url = tr.querySelector('td.decode-url');
      let org_url = tr.querySelector('td.hidden-org-url');
      tr.hidden = (decode_url.textContent || decode_url.innerText).trim().toUpperCase().indexOf(search) === -1
        && (org_url.textContent || org_url.innerText).trim().toUpperCase().indexOf(search) === -1;
    });
  };
}

// 列表行删除事件
function addTableRowDeleteListener() {
  $('td.delete-row').on('click', function () {
    let url = $(this).siblings('.hidden-org-url').text();
    LS.removeItem(url);
    TABS.refreshActiveTabBadge();

    $(this).parent().remove();
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
