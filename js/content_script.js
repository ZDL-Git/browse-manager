chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  console.debug('Received message from BrowseManager extension background:', message, sender);
  eval(message.function).apply(this, message.hasOwnProperty('paramsArray') ? message.paramsArray : []);
});

let sendMessageToBackground = function (msg,
                                        responseCallback = (response) =>
                                          console.log('get response from background: ', response)
) {
  chrome.runtime.sendMessage(msg, responseCallback);
};

// ============================================================================
// 1.页面执行的方式一
(function onLoading() {
  console.log('content_script.js onLoading...');
  sendMessageToBackground({function: "SETTINGS.getAllParams"}, function (response) {
    console.log('response from extension:', response);

    // TODO: 此处进行网站个性化
    // csdn 网站目前已经取消了默认折叠内容的设置，所以此功能不再使用，只作为demo供参考。
    response.bCsdnAutoExpand === 'true'
    && window.location.href.match(/((^)(https:\/\/blog.csdn.net|https:\/\/.*.iteye.com))/g)
    && csdnExpandContent();

  })
})();

// ============================================================================

function csdnExpandContent() {
  // csdn 网站目前已经取消了默认折叠内容的设置，所以此功能不再使用，只作为demo供参考。
  function rbc_() {
    console.debug('csdnExpandContent exec');
    let readmoreBtn = document.querySelector("#btn-readmore,.btn-readmore");
    readmoreBtn && readmoreBtn.click() && readmoreBtn.remove();
  }

  if (['loaded', 'interactive', 'complete'].includes(document.readyState)) {
    rbc_();
  } else {
    document.addEventListener('DOMContentLoaded', function (event) {
      rbc_();
    });
  }
}

// ============================================================================

let DISPLAYER = (function () {
  let tip_template = (function () {
    let d = document.createElement("div");
    d.style.position = "fixed";
    d.style.top = "15vh";
    d.style.left = "20vw";
    d.style.zIndex = "2147483647";
    d.style.fontSize = "200px";
    d.style.textShadow = "-2px 0 2px skyblue, 0 2px 2px yellow, 2px 0 2px skyblue, 0 -2px 2px blue";
    d.style.lineHeight = "1";// 解决因从body继承line-height属性导致纵向位置错误的问题
    return d;
  })();
  let bookmark_template = (function () {
    let d = document.createElement("div");
    d.style.position = "fixed";
    d.style.top = "15vh";
    d.style.bottom = "15vh";
    d.style.left = "20vw";
    d.style.right = "20vw";
    d.style.zIndex = "2147483647";
    d.style.fontSize = "200px";
    d.style.backgroundColor = 'white';
    d.style.textShadow = "-2px 0 2px skyblue, 0 2px 2px yellow, 2px 0 2px skyblue, 0 -2px 2px blue";
    d.style.lineHeight = "1";// 解决因从body继承line-height属性导致纵向位置错误的问题
    return d;
  })();
  let dis;

  return {
    display: function (content, css, template_) {
      let template = eval(template_);
      DISPLAYER._remove(dis);
      dis = template.cloneNode(true);
      if (css) {
        for (let [k, v] of Object.entries(css)) {
          dis.style.setProperty(k, v);
        }
      }
      dis.innerHTML = content;
      onBodyReady(function () {
        let local = dis;
        document.body.appendChild(local);
        setTimeout(function () {
          DISPLAYER._remove(local);
        }, 1300);
      });
    },
    _remove: function (d) {
      try {
        document.body.removeChild(d);
      } catch (e) {
      }
    },
  }
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
