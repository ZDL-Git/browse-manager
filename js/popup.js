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
      if (value === OPERATIONS.addUrlWhiteList) {
        table = 'table-url-white';
      } else if (value === OPERATIONS.addUrlBlackList) {
        table = 'table-url-black';
      } else if (value === OPERATIONS.addDomainWhiteList) {
        table = 'table-domain-white';
      } else if (value === OPERATIONS.addDomainBlackList) {
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
  $('#bookmark-checkbox')[0].checked = getParam('is_auto_save') === 'true';
  $('#bookmark-threshold')[0].value = getParam('auto_save_thre');
  $('#bookmark-title')[0].value = getParam('bookmark_title');
  $('#diapause-checkbox')[0].checked = getParam('is_diapause') === 'true';
  $('#diapause-time')[0].value = getParam('diapause_time') / 1000;
  $('#pageshow-checkbox')[0].checked = getParam('is_page_show') === 'true';
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
    setParam('is_auto_save', $(this).prop('checked'))
  });
  $('#bookmark-threshold').on('input', function () {
    setParam('auto_save_thre', $(this).val());
  });
  $('#bookmark-title').on('input', function () {
    setParam('bookmark_title', $(this).val());
  });

  $('#diapause-checkbox').on('click', function () {
    setParam('is_diapause', $(this).prop('checked'));
  });
  $('#diapause-time').on('input', function () {
    setParam('diapause_time', $(this).val() * 1000);
  });

  $('#pageshow-checkbox').on('click', function () {
    setParam('is_page_show', $(this).prop('checked'));
  });
}
