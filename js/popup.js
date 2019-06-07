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
  $('input[type=checkbox]').each(function () {
    $(this)[0].checked = SETTINGS.checkParam($(this).attr('setting'), 'true');
  });

  $('input[type=text]').each(function () {
    let param = $(this).attr('setting');
    let paramValue = SETTINGS.getParam(param);
    if (param === 'diapause_time') paramValue = paramValue / 1000;
    $(this)[0].value = paramValue;
  });
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
    COUNTING.setBrowsedTimes(encodeURI($(this).prev().text()), 0);
    TABS.refreshActiveTabBadge();
    $(this).parent().remove();
  });
}

function addSettingListener() {
  $('#setting-btn, #setting-btn-icon').on('click', function () {
    $('#settings-detail').css('display', 'block');
  });

  $('input[type=checkbox]').on('click', function () {
    SETTINGS.setParam($(this).attr('setting'), $(this).prop('checked'));
  });

  $('input[type=text]').on('input', function () {
    let param = $(this).attr('setting');
    let paramValue = $(this).val();
    if (param === 'diapause_time') paramValue = paramValue * 1000;
    SETTINGS.setParam(param, paramValue);
  });
}
