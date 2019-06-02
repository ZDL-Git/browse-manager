window.onload = function () {
  appendTableContent();
  addTableFilterListener();
  addTableRowDeleteListener();
  fillSettingsContent();
  addSettingListener();
};

function appendTableContent() {

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

      $('#' + table).append(
        '<tr>' +
        '<td>' + url + '</td>' +
        '<td class="delete-row">✕</td>' +
        '</tr>'
      );
    }
  )
}

function fillSettingsContent() {
  $('#bookmark-checkbox')[0].checked = SETTINGS.checkParam('is_auto_save', 'true');
  $('#bookmark-doorsill')[0].value = SETTINGS.getParam('auto_save_thre');
  $('#bookmark-title')[0].value = SETTINGS.getParam('bookmark_title');
  $('#diapause-checkbox')[0].checked = SETTINGS.checkParam('is_diapause', 'true');
  $('#diapause-time')[0].value = SETTINGS.getParam('diapause_time') / 1000;
  $('#pageshow-checkbox')[0].checked = SETTINGS.checkParam('is_page_show', 'true');
  $('#csdn-checkbox')[0].checked = SETTINGS.checkParam('csdn_auto_expand', 'true');
}

function showAllTrs() {
  let trs = document.getElementsByTagName("tr");
  Array.from(trs).forEach(function (tr) {
      tr.hidden = false;
    }
  );
}

//实现search时列表的实时过滤
function addTableFilterListener() {
  let input = document.getElementById("search");

  input.oninput = function () {
    // 先全部show再判断隐藏的模式比较稳定
    showAllTrs();

    if (!input.value) {
      return;
    }

    let trs = document.getElementsByTagName("tr");
    Array.from(trs).forEach(function (tr) {
      let td = tr.getElementsByTagName("td")[0];
      if (td) {
        tr.hidden = encodeURI((td.textContent || td.innerText).trim()).toUpperCase()
          .indexOf(encodeURI(input.value.trim()).toUpperCase()) === -1;
      }
    });
  };
}

//列表行删除事件
function addTableRowDeleteListener() {
  $('td.delete-row').on('click', function () {
    setBrowsedTimes(encodeURI($(this).prev().text()), 1);
    setActiveTabBadge();
    $(this).parent().remove();
  });
}

function addSettingListener() {
  $('#bookmark-checkbox').on('click', function () {
    SETTINGS.setParam('is_auto_save', $(this).prop('checked'))
  });
  $('#bookmark-doorsill').on('input', function () {
    SETTINGS.setParam('auto_save_thre', $(this).val());
  });
  $('#bookmark-title').on('input', function () {
    SETTINGS.setParam('bookmark_title', $(this).val());
  });

  $('#diapause-checkbox').on('click', function () {
    SETTINGS.setParam('is_diapause', $(this).prop('checked'));
  });
  $('#diapause-time').on('input', function () {
    SETTINGS.setParam('diapause_time', $(this).val() * 1000);
  });

  $('#pageshow-checkbox').on('click', function () {
    SETTINGS.setParam('is_page_show', $(this).prop('checked'));
  });

  $('.settings-detail-btn').on('click', function () {
    $('#settings-detail').css('display', 'block');
  });
  $('#csdn-checkbox').on('click', function () {
    SETTINGS.setParam('csdn_auto_expand', $(this).prop('checked'));
  });
}
