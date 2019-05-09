window.onload = function () {
  appendTableContent();
  addTableFilterListener();
  addTableRowDeleteListener();
  fillSettingsContent();
  addSettingListener();
};

function appendTableContent() {

  $.each(localStorage, function (key, value) {
      let table;
      if (value === OPERATIONS[1]) {
        table = 'table-url-white';
      } else if (value === OPERATIONS[0]) {
        table = 'table-url-black';
      } else if (value === OPERATIONS[3]) {
        table = 'table-domain-white';
      } else if (value === OPERATIONS[2]) {
        table = 'table-domain-black';
      } else {
        // 相当于continue
        return;
      }

      $('#' + table).append(
        '<tr>' +
        '<td>' + key + '</td>' +
        '<td class="delete-row">✕</td>' +
        '</tr>'
      );
    }
  );
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
    showAllTrs();

    if (!input.value) {
      return;
    }

    let trs = document.getElementsByTagName("tr");
    Array.from(trs).forEach(function (tr) {
      //查找是否含有关键字,不含有则隐藏
      if (tr.innerText.indexOf(input.value) === -1 && tr.innerText.indexOf('名单:') === -1) {
        tr.hidden = true;
      }
    });
  };
}

//列表行删除事件
function addTableRowDeleteListener() {
  $('td.delete-row').on('click', function () {
    setBrowsedTimes($(this).prev().text(), 1);
    $(this).parent().remove();
    setActiveTabBadge();
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
