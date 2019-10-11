# Browse Manager

[![Software License](https://img.shields.io/badge/license-MIT-brightgreen.svg)](LICENSE) [![GitHub stars](https://img.shields.io/github/stars/ZDL-Git/browse-manager.svg)](https://github.com/ZDL-Git/browse-manager/stargazers)

### 项目说明

Chrome扩展：实现网址/域名拉黑，访问次数统计，自动收藏。适合网络查询学习、资源搜集等浏览器重度使用者。

项目主页：https://github.com/ZDL-Git/browse-manager

### Idea来源

在搜索资源，或者查找解决棘手bug的方法的时候，会经历很长时间来回不断地翻阅一些网站，有的问题甚至半年后还需要重新来过。那些曾经访问过且证明没有任何意义的网页，会因为一个“优秀的”标题而导致再次浪费我们的时间。所以为什么我们不能统计它们，拉黑它们呢？

### 当前功能

<img src="https://github.com/ZDL-Git/resources-store/blob/master/browse-manager/image/popup-bird.gif?raw=true" width="45%"/>

✑ 拉黑地址或域名：黑名单，在页面右键-Browse Manager-URL不再访问(黑名单)/Domain不再访问(黑名单)；

✑ 统计访问次数：统计除白名单外每个网页已经访问过的次数，在图标上显示；

✑ 白名单：为了避免无用的统计，提供了白名单。页面右键将地址或域名加入白名单，不再统计、不再显示访问次数。"chrome:"、"www.baidu.com"、"www.google.com"开头的网页默认在白名单；

✑ 自动收藏：在管理界面（单击图标）设置自动收藏次数及收藏夹名称，当达到访问次数后网页会被自动收藏到指定收藏夹中，图标上的数字会变为红色。前期手动收藏过的网页不会处理。收藏夹会自动创建，如果已存在会直接使用，不会导致覆盖。此功能主要基于：如果一个网页需要频繁访问且未被拉入黑名单及证明其重要性，可配合Alfred等软件使用。

✑ CSDN自动展开全文：帮你自动点击csdn的"展开阅读全文"。（有类似想法的话可以fork后自己添加）

### 安装

#### 方法一：[从Chrome应用商店安装](https://chrome.google.com/webstore/detail/browse-manager/fibpimjmadkibpjkhlngcapnkkhhikpf?hl=zh-CN)

推荐，需要科学上网。

注：前期使用crx文件或clone方式安装的，可以导出数据后切换到商店安装方式（建议先用原先方式升级到Github中发布的最新版本，然后导出数据）。

#### 方法二：安装crx文件，[下载地址](https://github.com/ZDL-Git/browse-manager/tree/master/distribution/crx)

只适用Mac/Linux，不需要科学上网：

    安装：浏览器打开地址 chrome://extensions/ 然后将下载的crx文件拖入页面，确认安装即可。
    升级：与安装一样不用删除旧版本，直接拖入新版本crx即可。

### 注意事项

✁ 由于是在后台js中listen事件，黑名单功能当前模式：在新tab打开黑名单网页时，会自动将这个tab关闭掉；在当前tab打开黑名单网页时，会自动后退到上一个非黑名单网页。如果环境对tab的管理要求严格，请谨慎使用。

✁ 打开“在页面显示访问次数”功能后，程序会在访问的页面临时嵌入一个fixed定位的div，使用完后会接着自动remove掉。

✁ 将网页加入黑名单时，如果其在收藏夹中，则会自动删除收藏。

✁ url中的查询参数会导致同一网页在不同情况下url不一致，如当页面上下翻至不同section时url中的hash出现变化，导致黑白名单、访问次数统计不准确，所以扩展内部对url进行了稳定性处理。

✁ 安装后默认开启了"120s内重复访问不计数"，即如果你刚打开或者刚关闭网页A未超过120s，则再次访问网页A次数不会+1。

✁ 部分网页本身禁止了右键功能，可在工具栏中的扩展图标上右键操作。

### 大家如果用了请点个星星，让我知道如果不兼容升级会被多少个人揍，好吧！如果觉得不好用可以回来再把星星撤走😄

### 联系方式

如遇到安装或者使用问题，可选以下方式联系

Email: zdl_daily@163.com

留言：

[<img src="https://github.com/ZDL-Git/resources-store/blob/master/browse-manager/image/msg-board.png" width="90%">](https://github.com/ZDL-Git/browse-manager/issues/3)
