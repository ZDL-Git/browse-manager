// 注：同时存在DOM和jquery


window.onload = function () {
  appendTableContent();
  addTableFilterListener();
  addTableRowDeleteListener();
  fillSettingsContent();
  addSettingListener();
};

function appendTableContent() {
  let whitelist = [];
  let blacklist = [];
  for (let i = 0; i < localStorage.length; i++) {
    if (localStorage.key(i).endsWith(localStorage['whitelist_suffix'])) {
      whitelist.push(localStorage.key(i).replace(localStorage['whitelist_suffix'], ''))
    } else if (localStorage.key(i).endsWith(localStorage['blacklist_suffix'])) {
      blacklist.push(localStorage.key(i).replace(localStorage['blacklist_suffix'], ''))
    }
  }

  whitelist.forEach(function (whiteUrl) {
    $('#table-white').append(
      '<tr>' +
      '<td>' + whiteUrl + '</td>' +
      '<td class="whitelist-col-del">✕</td>' +
      '</tr>'
    )
  });
  blacklist.forEach(function (blackUrl) {
    $('#table-black').append(
      '<tr>' +
      '<td>' + blackUrl + '</td>' +
      '<td class="blacklist-col-del">✕</td>' +
      '</tr>'
    )
  });
}

function fillSettingsContent() {
  document.getElementById('bookmark-checkbox').checked = localStorage['is_auto_save'] === 'true';
  document.getElementById('bookmark-threshold').value = localStorage['auto_save_thre'];
  document.getElementById('bookmark-title').value = localStorage['bookmark_title'];
  document.getElementById('diapause-checkbox').checked = localStorage['is_diapause'] === 'true';
  document.getElementById('diapause-input').value = localStorage['diapause_time'] / 1000;
}

function showAllTr() {
  let tr = document.getElementsByTagName("tr");
  for (let i = 1; i < tr.length; i++) {
    tr[i].hidden = false;
  }
}

//实现search时列表的实时过滤
function addTableFilterListener() {
  let input = document.getElementById("search");

  input.oninput = function () {
    if (!this.value) {
      showAllTr();
      return;
    }

    showAllTr();
    let trs = document.getElementsByTagName("tr");
    for (let i = 1; i < trs.length; i++) {
      let tr = trs[i];
      //查找是否含有关键字,不含有则隐藏
      if (tr.innerText.indexOf(this.value) === -1 && tr.innerText.indexOf('名单:') === -1) {
        tr.hidden = true;
      }
    }
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
}
