// 注：同时存在DOM和jquery


window.onload = function () {
  appendTableContent();
  addTableFilterListener();
  addTableRowDeleteListener();
  fillSettingsContent();
  addSettingListener();
};

function appendTableContent() {

  Object.keys(localStorage).forEach(function (key) {
      if (key.endsWith(localStorage['whitelist_suffix'])) {
        let whiteUrl = key.replace(localStorage['whitelist_suffix'], '');
        $('#table-white').append(
          '<tr>' +
          '<td>' + whiteUrl + '</td>' +
          '<td class="whitelist-col-del">✕</td>' +
          '</tr>'
        )
      } else if (key.endsWith(localStorage['blacklist_suffix'])) {
        let blackUrl = key.replace(localStorage['blacklist_suffix'], '');
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
  document.getElementById('bookmark-checkbox').checked = localStorage['is_auto_save'] === 'true';
  document.getElementById('bookmark-threshold').value = localStorage['auto_save_thre'];
  document.getElementById('bookmark-title').value = localStorage['bookmark_title'];
  document.getElementById('diapause-checkbox').checked = localStorage['is_diapause'] === 'true';
  document.getElementById('diapause-input').value = localStorage['diapause_time'] / 1000;
  document.getElementById('notify-checkbox').checked = localStorage['is_notify'] === 'true';
}

function showAllTr() {
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
    showAllTr();

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
    localStorage.removeItem($(this).prev().text() + localStorage['whitelist_suffix'])
  });
  $('td.blacklist-col-del').on('click', function () {
    $(this).parent().remove();
    localStorage.removeItem($(this).prev().text() + localStorage['blacklist_suffix'])
  });
}

function addSettingListener() {
  let open = document.getElementById("bookmark-checkbox");
  open.onclick = function () {
    localStorage['is_auto_save'] = open.checked;
  };
  let timesInput = document.getElementById("bookmark-threshold");
  timesInput.oninput = function () {
    localStorage['auto_save_thre'] = timesInput.value;
  };
  let bookmarkTitleInput = document.getElementById("bookmark-title");
  bookmarkTitleInput.oninput = function () {
    localStorage['bookmark_title'] = bookmarkTitleInput.value;
  };

  let isDiapause = document.getElementById("diapause-checkbox");
  isDiapause.onclick = function () {
    localStorage['is_diapause'] = isDiapause.checked;
  };
  let diapauseTime = document.getElementById("diapause-input");
  diapauseTime.oninput = function () {
    localStorage['diapause_time'] = diapauseTime.value * 1000;
  };

  let isNotify = document.getElementById("notify-checkbox");
  isNotify.onclick = function () {
    localStorage['is_notify'] = isNotify.checked;
  };
}
