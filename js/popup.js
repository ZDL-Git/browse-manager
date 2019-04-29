const blackListSuffix = "--BM_blacklist";
const whiteListSuffix = "--BM_whitelist";

window.onload = function () {
  appendTableContent();
  addTableFilterListener();
  addTableRowDeleteListener();
  fillSettingsContent();
  addSettingListener();
};

function appendTableContent() {

  Object.keys(localStorage).forEach(function (key) {
      if (key.endsWith(whiteListSuffix)) {
        let whiteUrl = key.replace(whiteListSuffix, '');
        $('#table-white').append(
          '<tr>' +
          '<td>' + whiteUrl + '</td>' +
          '<td class="whitelist-col-del">✕</td>' +
          '</tr>'
        )
      } else if (key.endsWith(blackListSuffix)) {
        let blackUrl = key.replace(blackListSuffix, '');
        $('#table-black').append(
          '<tr>' +
          '<td>' + blackUrl + '</td>' +
          '<td class="blacklist-col-del">✕</td>' +
          '</tr>'
        );
      }
    }
  );
}

function fillSettingsContent() {
  $('#bookmark-checkbox')[0].checked = localStorage['is_auto_save'] === 'true';
  $('#bookmark-threshold')[0].value = localStorage['auto_save_thre'];
  $('#bookmark-title')[0].value = localStorage['bookmark_title'];
  $('#diapause-checkbox')[0].checked = localStorage['is_diapause'] === 'true';
  $('#diapause-time')[0].value = localStorage['diapause_time'] / 1000;
  $('#pageshow-checkbox')[0].checked = localStorage['is_page_show'] === 'true';
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
  $('td.whitelist-col-del').on('click', function () {
    $(this).parent().remove();
    localStorage.removeItem($(this).prev().text() + whiteListSuffix)
  });
  $('td.blacklist-col-del').on('click', function () {
    $(this).parent().remove();
    localStorage.removeItem($(this).prev().text() + blackListSuffix)
  });
}

function addSettingListener() {
  $('#bookmark-checkbox').on('click', function () {
    localStorage['is_auto_save'] = $(this).prop('checked');
  });
  $('#bookmark-threshold').on('input', function () {
    localStorage['auto_save_thre'] = $(this).val();
  });
  $('#bookmark-title').on('input', function () {
    localStorage['bookmark_title'] = $(this).val();
  });

  $('#diapause-checkbox').on('click', function () {
    localStorage['is_diapause'] = $(this).prop('checked');
  });
  $('#diapause-time').on('input', function () {
    localStorage['diapause_time'] = $(this).val() * 1000;
  });

  $('#pageshow-checkbox').on('click', function () {
    localStorage['is_page_show'] = $(this).prop('checked');
  });
}
