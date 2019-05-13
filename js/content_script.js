chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  switch (message.method) {
    case "displayBrowseTimes": {
      displayBrowseTimes(message.browseTimes);
      break;
    }
    // ...
  }
});


function displayBrowseTimes(browseTimes) {
  if (!browseTimes) {
    return;
  }

  onBodyReady(function () {
    let dstDiv = document.getElementById("BrowseManager-TemporaryDisplayBrowseTimesDiv")
      || document.createElement("div");

    dstDiv.id = "BrowseManager-TemporaryDisplayBrowseTimesDiv";
    // dstDiv.style.all = "unset";
    dstDiv.style.position = "fixed";
    dstDiv.style.top = "15vh";
    dstDiv.style.left = "20vw";
    dstDiv.style.zIndex = "9999";
    dstDiv.style.fontSize = "200px";
    dstDiv.style.textShadow = "-2px 0 2px skyblue, 0 2px 2px yellow, 2px 0 2px skyblue, 0 -2px 2px blue";
    // 解决因从body继承line-height属性导致纵向位置错误的问题
    dstDiv.style.lineHeight = "1";
    if (browseTimes > 3) {
      dstDiv.style.color = "#fe4a49";
    }
    dstDiv.innerHTML = browseTimes;
    document.body.appendChild(dstDiv);

    setTimeout(function () {
      try {
        document.body.removeChild(dstDiv)
      } catch (e) {
      }
    }, 1200);
  });
}


function onBodyReady(callback) {
  waitFor(function () {
    return document.body;
  }, function () {
    callback();
  });
}

function waitFor(condition, callback) {
  if (!condition()) {
    window.setTimeout(waitFor.bind(null, condition, callback), 100);
  } else {
    callback();
  }
}
