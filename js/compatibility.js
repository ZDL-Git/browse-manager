// 负责版本升级的兼容。在安装时执行

function handleCompatibility() {

  LS.forEach(function (key, value) {
    if (key.startsWith('SETTINGS:')) {
      return;
    }
    trimTailSlash(key, value);
  })
}

function trimTailSlash(key, value) {
  if (key.endsWith('/')) {
    if (!LS.getItem(key.slice(0, -1))) {
      LS.setItem(key.slice(0, -1), value);
    }
    LS.removeItem(key);
  }
}
