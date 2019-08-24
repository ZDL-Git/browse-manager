// 负责版本升级的兼容。在安装时执行

function handleCompatibility() {
  LS.forEach(function (key, value) {
    if (!key.startsWith('SETTINGS:')) {
      trimTailSlash(key, value);
    }
    if (UTILS.getStorage(key, value) === 'STORAGE') {
      moveToStorage(key, value);
    }
  });

  // 修改丑陋纠结的命名。。。
  changeParamName('is_auto_save', 'bAutoSaveBookmark');
  changeParamName('auto_save_thre', 'browseTimesTriggerAutoSaveBookmark');
  changeParamName('bookmark_title', 'bookmarkFolderName');
  changeParamName('is_diapause', 'bIgnoreDuplicate');
  changeParamName('diapause_time', 'timeIgnoreDuplicate');
  changeParamName('is_prompt_duplicate', 'bPageShowDuplicate');
  changeParamName('is_page_show', 'bPageShowBrowseTimes');
  changeParamName('csdn_auto_expand', 'bCsdnAutoExpand');
}

function trimTailSlash(key, value) {
  if (key.endsWith('/')) {
    LS.getItem(key.slice(0, -1)) || LS.setItem(key.slice(0, -1), value);
    LS.removeItem(key);
  }
}

function moveToStorage(key, value) {
  STORAGE.setItem(key, value);
  LS.removeItem(key);
}

function changeParamName(src, dst) {
  SETTINGS.getParam(dst) || SETTINGS.setParam(dst, SETTINGS.getParam(src));
  SETTINGS.delParam(src);
}
