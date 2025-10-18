---
title: Steam Web API简易使用介绍
published: 2025-10-07
description: 'Steam Web API使用方法详解，包含接口格式、参数说明及常用功能示例'
image: '/IMG/steamapi.jpg'
tags: ['Steam','API']
category: '工具'
draft: false 
lang: 'zh_CN'
---

最近想更新下关于页面的Steam展示组件，记录一下Steam Web API的使用方法
### 勋章
`https://store.steampowered.com/replay/76561198887857717/2024`

## 便捷接口

### 个人信息
`https://o.jk.sb/steam/profile/76561198887857717`

### 游戏库存
`https://o.jk.sb/steam/games/76561198887857717`

### 最近游玩
count 为可选参数如果count为空则默认为5.

`https://o.jk.sb/steam/recentlyplayed/76561198887857717`

### 最近游玩（指定数量）

count = 3

`https://o.jk.sb/steam/recentlyplayed/76561198887857717/3`

### 游戏成就
appid 为游戏或软件的ID。

`https://o.jk.sb/steam/achievements/76561198887857717/275850`

### 游戏封面

base64 编码的游戏封面图片。

`https://o.jk.sb/steam/imageurl2base64/275850`


## 接口格式

Steam Web API的统一形式如下：

`http(s)://api.steampowered.com/$interface/$method/v$version/?appid=$appid&key=$key&steamids=$userid&format=$format`

http与https都能使用。但是体感前者更快。
以下是参数用法：

### interface
Steam Web API太多，接口可以看做是API的分类。

### method
方法即具体API功能，想要的功能可以在文档里查到。下文会列举一些常用API。

### version
大部分API的版本是v1，少数存在v2。格式写v1与v0001均可。

appid
有些功能需要指定游戏ID，可以在商店页面或SteamDB查到。下文用000000代替。

### key
使用Steam Web API需要注册一个密钥。打开密钥申请页面([https://steamcommunity.com/dev/apikey](https://steamcommunity.com/dev/apikey))，登录之后按提示操作可以获取自己的密钥，下文用XXXXXX代替。


### steamids
填写自己的64位ID。不知道可以去SteamDB([https://steamdb.info/calculator/](https://steamdb.info/calculator/))查询。用Steam账号登录或输入社区昵称即可查询。下文用123456代替。


### format
获取的数据形式有3种可选：
`json`：缺省值。获取JSON格式数据。
`xml`：获取XML格式数据。
`vdf`：获取Valve的数据格式。这个是阀门公司自己的文件格式，具体介绍见官方文档。

## 常用API

使用之前要公开社区信息，否则获取的数据不正常。不同的密钥可以访问的API不同。目前我只知道有开发者与玩家之别，其他还不知道。自己可以用的API可以从以下接口查询：

`http://api.steampowered.com/ISteamWebAPIUtil/GetSupportedAPIList/v1/?key=XXXXXX&steamids=123456`

其中有该key可用的所有API信息。包括interface、method、version和描述等。

### 用户信息
`http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=XXXXXX&steamids=123456`

其实v1和v2获取的信息一样。获取昵称、头像、在线状态等基础数据。

### 游戏库存
`http://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=XXXXXX&steamid=123456`

获取库存总数与所有库存内容。* Steam曾经清理过一些低质量游戏，这些游戏不计入游戏总数，但在该接口中是计入并列出的。

### 最近游玩
`http://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v1/?key=XXXXXX&steamid=123456`

获取两周内的使用信息。包括产品名称、ID、图标、图片和游玩时间等内容。与Steam社区主页下方的最新动态一样。最后游玩的游戏会排在最前面。

### 使用时间
`http://api.steampowered.com/IPlayerService/ClientGetLastPlayedTimes/v1/?key=XXXXXX`

获取所有产品的使用时间。包括总时间，最近使用的时间（两周），在windows、linux、mac等平台分别的使用时间。

### 社区等级
`http://api.steampowered.com/IPlayerService/GetSteamLevel/v1/?key=XXXXXX&steamid=123456`

获取社区等级。没错，只能获取等级。

### 好友列表
`http://api.steampowered.com/ISteamUser/GetFriendList/v1/?key=XXXXXX&steamid=123456`

获取好友列表与成为好友的时间。

### 组列表
`http://api.steampowered.com/ISteamUser/GetUserGroupList/v1/?key=XXXXXX&steamid=123456`

获取加入的组列表。

### 徽章列表
`http://api.steampowered.com/IPlayerService/GetBadges/v1/?key=XXXXXX&steamid=123456`

获取所有获得的徽章的详细信息。

### 封禁记录
`http://api.steampowered.com/ISteamUser/GetPlayerBans/v1/?key=XXXXXX&steamids=123456`

获取VAC封禁信息。

### 成就信息
`http://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v1/?key=XXXXXX&steamid=123456&appid=000000`

获取指定游戏或软件的成就信息。必须指定产品ID才能获取信息。

### 游戏图片
`https://shared.st.dl.eccdnx.com/store_item_assets/steam/apps/{appid}/header.jpg`

获取游戏或软件的图片。{appid}为产品ID。
