chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  console.debug('Received message from BrowseManager extension background:', message, sender);
  eval(message.function).apply(this, message.hasOwnProperty('paramsArray') ? message.paramsArray : []);
});

// ============================================================================

function autoExpandContent() {
  document.addEventListener('DOMContentLoaded', function (event) {
    let readmoreBtn = document.querySelectorAll("#btn-readmore,.btn-readmore")[0];
    if (!!readmoreBtn) {
      readmoreBtn.click() && readmoreBtn.remove();
    }
  })
}

// ============================================================================

let DISPLAYER = (function () {
  let div;
  let dis;

  return {
    create: function () {
      div = document.createElement("div");
      div.style.position = "fixed";
      div.style.top = "15vh";
      div.style.left = "20vw";
      div.style.zIndex = "2147483647";
      div.style.fontSize = "200px";
      div.style.textShadow = "-2px 0 2px skyblue, 0 2px 2px yellow, 2px 0 2px skyblue, 0 -2px 2px blue";
      div.style.lineHeight = "1";// 解决因从body继承line-height属性导致纵向位置错误的问题
    },

    clearDis: function () {
      try {
        document.body.removeChild(dis);
      } catch (e) {
      }
    },

    display: function (c, css) {
      DISPLAYER.clearDis();
      div || DISPLAYER.create();
      dis = div.cloneNode(true);
      if (css)
        for (let [k, v] of Object.entries(css)) {
          dis.style.setProperty(k, v);
        }
      dis.innerHTML = c;

      onBodyReady(function () {
        document.body.appendChild(dis);
        setTimeout(function () {
          DISPLAYER.clearDis();
        }, 1300);
      });
    }
  };
})();

function onBodyReady(callback) {
  waitFor(function () {
    return document.body;
  }, callback);
}

function waitFor(condition, callback) {
  if (!condition()) {
    window.setTimeout(waitFor.bind(null, condition, callback), 100);
  } else {
    callback();
  }
}
