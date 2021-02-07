chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  console.debug('BM::received message from BrowseManager extension background:', message, sender);
  eval(message.function).apply(this, message.hasOwnProperty('params') ? message.params : {});
  sendResponse('finished');
});

let sendMessageToBackground = function (msg,
                                        responseCallback = (response) =>
                                          console.log('BM::get response from background: ', response)
) {
  chrome.runtime.sendMessage(msg, responseCallback);
};

function onLoading() {
  console.log('BM::content_script.js onLoading...');
  sendMessageToBackground({function: "SETTINGS.getAllParams"}, function (response) {
    console.log('BM::response from extension:', response);

    // TODO: 此处进行网站个性化
    // csdn 网站目前已经取消了默认折叠内容的设置，所以此功能不再使用，只作为demo供参考。
    response.bCsdnAutoExpand === 'true'
    && window.location.href.match(/((^)(https:\/\/blog.csdn.net|https:\/\/.*.iteye.com))/g)
    && csdnExpandContent();

  })
}

// onLoading();

// ============================================================================

class DISPLAYER {
  static tip_template = function () {
    let d = document.createElement('div');
    d.innerHTML = '<div style="position: fixed;' +
      'top: 15vh; left: 20vw;' +
      'z-index: 2147483647;' +
      'font-size: 200px;' +
      'text-shadow: -2px 0 2px skyblue, 0 2px 2px yellow, 2px 0 2px skyblue, 0 -2px 2px blue;' +
      'line-height: 1;"></div>';
    return d.firstChild;
  };
  static bookmark_template = function () {
    let d = document.createElement('div');
    d.innerHTML = '<div style="position: fixed;' +
      'top: 15vh; bottom: 15vh; left: 20vw; right: 20vw;' +
      'z-index: 2147483647;' +
      'font-size: 200px;' +
      'background-color: white;' +
      'text-shadow: -2px 0 2px skyblue, 0 2px 2px yellow, 2px 0 2px skyblue, 0 -2px 2px blue;' +
      'line-height: 1;"></div>';
    return d.firstChild;
  };
  // 用来多次删除，防止重叠
  static tip_div;
  static bookmark_div;

  static displayText(params) {
    let content = params['content'] || '';
    let css = params['css'] || {};
    let keep_time = params['keep_time'] || 1300;

    typeof DISPLAYER.tip_div === 'object' && DISPLAYER._remove(DISPLAYER.tip_div);

    DISPLAYER.tip_div = DISPLAYER.tip_template();
    DISPLAYER.tip_div.innerHTML = content;
    DISPLAYER._apply_css(DISPLAYER.tip_div, css);
    DISPLAYER.tip_div.onmousedown = function (e) {
      DISPLAYER._remove(e.target);
      console.debug('BM::onmousedown, div deleted manually!');
    };

    CONDITION.onBodyReady(function () {
      document.body.appendChild(DISPLAYER.tip_div);
      setTimeout(function () {
        DISPLAYER._remove(DISPLAYER.tip_div);
      }, keep_time);
    });
  }

  static _apply_css(div, css) {
    if (typeof css !== 'object') {
      console.warn('BM::css type error:', typeof css, css);
      return;
    }
    for (let [p, v] of Object.entries(css)) {
      div.style.setProperty(p, v);
    }
  }

  static _remove(div) {
    div.remove();
  }
}


class CONDITION {
  static onBodyReady(callback) {
    this.waitFor(function () {
      return document.body;
    }, callback);
  }

  static waitFor(condition, callback) {
    if (!condition()) {
      window.setTimeout(CONDITION.waitFor.bind(null, condition, callback), 100);
    } else {
      callback();
    }
  }
}


// ============================================================================

function csdnExpandContent() {
  // csdn 网站目前已经取消了默认折叠内容的设置，所以此功能不再使用，只作为demo供参考。
  function rbc_() {
    console.debug('BM::csdnExpandContent exec');
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
