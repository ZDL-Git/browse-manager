let curUrl = window.location.href;


chrome.runtime.sendMessage(
  {method: "getBrowseTimes", url: curUrl},
  function (response) {
    let browseTimes = response.browseTimes;
    if (browseTimes != null) // 非白名单
      showBrowseTimes(browseTimes);
  }
);


function showBrowseTimes(browseTimes) {

  let dstDiv = document.createElement("div");
  dstDiv.style.all = "unset";
  dstDiv.style.position = "fixed";
  dstDiv.style.top = "15vh";
  dstDiv.style.left = "20vw";
  dstDiv.style.zIndex = "999";
  dstDiv.style.fontSize = "200px";
  dstDiv.style.textShadow = "-2px 0 2px skyblue, 0 2px 2px yellow, 2px 0 2px skyblue, 0 -2px 2px blue";
  dstDiv.style.lineHeight = "1";  // 解决因从body继承line-height属性导致纵向位置错误的问题

  if (browseTimes > 3) {
    dstDiv.style.color = "#fe4a49";
  }

  dstDiv.innerHTML = browseTimes;
  document.body.appendChild(dstDiv);

  setTimeout(function () {
    document.body.removeChild(dstDiv)
  }, 1200);
}
