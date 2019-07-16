chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  console.debug('Front end received message:', message, sender);
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

  return {
    create: function () {
      if (div) return;
      div = document.createElement("div");
      div.style.position = "fixed";
      div.style.top = "15vh";
      div.style.left = "20vw";
      div.style.zIndex = "9999";
      div.style.fontSize = "200px";
      div.style.textShadow = "-2px 0 2px skyblue, 0 2px 2px yellow, 2px 0 2px skyblue, 0 -2px 2px blue";
      div.style.lineHeight = "1";// 解决因从body继承line-height属性导致纵向位置错误的问题
    },

    display: function (c, css) {
      DISPLAYER.create();
      let div_tmp = div.cloneNode(true);
      for (let [k, v] of Object.entries(css)) {
        div_tmp.style.setProperty(k, v);
      }
      div_tmp.innerHTML = c;

      onBodyReady(function () {
        document.body.appendChild(div_tmp);
        setTimeout(function () {
          try {
            document.body.removeChild(div_tmp)
          } catch (e) {
          }
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
