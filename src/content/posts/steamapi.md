---
title: Steam Web API简易使用介绍
published: 2025-10-07
description: 'Steam Web API使用方法详解，包含接口格式、参数说明及常用功能示例'
image: '/IMG/steamapi.jpg'
tags: ['Steam', 'API']
category: '工具'
draft: false
lang: 'zh-CN'
---

最近想更新关于页面的 Steam 展示组件，记录一下 Steam Web API 的使用方法。官方文档地址：[steamcommunity.com/dev](https://steamcommunity.com/dev)，第三方可视化文档：[steamapi.xpaw.me](https://steamapi.xpaw.me/)

---

## 准备工作

### 1. 申请 API Key

打开 [Steam API Key 申请页面](https://steamcommunity.com/dev/apikey)，登录后填写域名（随意填写，如 `localhost`），即可获得密钥。下文用 `XXXXXX` 代替。

:::warning
API Key 是私密凭证，请勿公开或提交到代码仓库。
:::

### 2. 查询 SteamID64

Steam 使用 64 位 ID 唯一标识用户，有以下几种方式查询：

- [SteamDB 计算器](https://steamdb.info/calculator/)：用 Steam 账号登录或输入社区昵称查询
- [steamid.io](https://steamid.io/)：输入任意格式 Steam ID 互转
- `ResolveVanityURL` 接口：通过自定义 URL 解析（见下文）

下文用 `123456` 代替 SteamID64，用 `000000` 代替游戏 AppID。

---

## 接口格式

Steam Web API 的统一请求格式：

```
https://api.steampowered.com/{interface}/{method}/v{version}/?key=XXXXXX&{params}
```

| 参数 | 说明 |
|------|------|
| `interface` | API 分类，如 `ISteamUser`、`IPlayerService` |
| `method` | 具体功能，如 `GetPlayerSummaries` |
| `version` | 版本号，通常为 `v1` 或 `v2`，写 `v1` 与 `v0001` 均可 |
| `key` | 您的 API Key |
| `format` | 可选，返回格式：`json`（默认）、`xml`、`vdf` |

:::tip
http 和 https 均可使用。`key` 参数必须传递，否则大多数接口会返回错误。
:::

查询当前 Key 可用的所有 API：

```
https://api.steampowered.com/ISteamWebAPIUtil/GetSupportedAPIList/v1/?key=XXXXXX
```

---

## 用户相关 API

### 用户基本信息

获取昵称、头像、在线状态、国家、创建时间等。`steamids` 支持逗号分隔传入多个 ID。

```
https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=XXXXXX&steamids=123456
```

### 自定义 URL 解析 SteamID

通过用户设置的自定义社区 URL 解析出 SteamID64：

```
https://api.steampowered.com/ISteamUser/ResolveVanityURL/v1/?key=XXXXXX&vanityurl=gaben
```

### 好友列表

获取好友列表及成为好友的时间（UNIX 时间戳）：

```
https://api.steampowered.com/ISteamUser/GetFriendList/v1/?key=XXXXXX&steamid=123456
```

### 组列表

获取用户加入的 Steam 组：

```
https://api.steampowered.com/ISteamUser/GetUserGroupList/v1/?key=XXXXXX&steamid=123456
```

### 封禁记录

查询 VAC 封禁、游戏封禁信息，`steamids` 支持多个 ID：

```
https://api.steampowered.com/ISteamUser/GetPlayerBans/v1/?key=XXXXXX&steamids=123456
```

---

## 游戏库与游玩相关 API

### 游戏库存

获取用户拥有的所有游戏及游玩时间。添加 `include_appinfo=1` 可在响应中包含游戏名称和图标：

```
https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=XXXXXX&steamid=123456&include_appinfo=1
```

:::tip
Steam 曾清理过部分低质量游戏，这些游戏不计入用户主页的游戏总数，但此接口仍会列出。
:::

### 最近游玩

获取两周内游玩过的游戏，包含游戏名、AppID、图标和游玩时间。可选参数 `count` 限制返回数量：

```
https://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v1/?key=XXXXXX&steamid=123456&count=5
```

### 所有游戏使用时长

获取所有产品的总游玩时间，以及在 Windows/Linux/Mac 各平台的分别时长：

```
https://api.steampowered.com/IPlayerService/ClientGetLastPlayedTimes/v1/?key=XXXXXX
```

---

## 等级与徽章 API

### 社区等级

```
https://api.steampowered.com/IPlayerService/GetSteamLevel/v1/?key=XXXXXX&steamid=123456
```

### 徽章列表

获取所有已获得徽章的详情，包括徽章 ID、等级、经验值、解锁时间等：

```
https://api.steampowered.com/IPlayerService/GetBadges/v1/?key=XXXXXX&steamid=123456
```

---

## 成就相关 API

### 玩家成就

获取指定游戏中玩家的成就完成情况（必须指定 AppID）：

```
https://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v1/?key=XXXXXX&steamid=123456&appid=000000
```

### 全球成就完成率

无需 Key，获取某款游戏所有成就在全球玩家中的完成百分比：

```
https://api.steampowered.com/ISteamUserStats/GetGlobalAchievementPercentagesForApp/v2/?gameid=000000
```

### 游戏统计数据定义

获取游戏开发者定义的成就和统计数据结构：

```
https://api.steampowered.com/ISteamUserStats/GetSchemaForGame/v2/?key=XXXXXX&appid=000000
```

---

## 游戏信息 API

### 游戏新闻

获取指定游戏的最新公告，可控制数量和内容长度：

```
https://api.steampowered.com/ISteamNews/GetNewsForApp/v2/?appid=000000&count=5&maxlength=500
```

### 商店详情（非官方 Store API）

获取游戏详细信息，包括简介、价格、类型、标签、系统需求、截图等（中文内容加 `l=schinese`）：

```
https://store.steampowered.com/api/appdetails?appids=000000&l=schinese
```

### 所有游戏列表

获取 Steam 商店上的所有游戏列表（AppID + 名称），数据量较大：

```
https://api.steampowered.com/ISteamApps/GetAppList/v2/
```

---

## 游戏资源

### 游戏头图

```
https://cdn.cloudflare.steamstatic.com/steam/apps/{appid}/header.jpg
```

### 游戏胶囊图（纵向）

```
https://cdn.cloudflare.steamstatic.com/steam/apps/{appid}/library_600x900.jpg
```

### 游戏截图

游戏截图 URL 可从 `appdetails` 接口的 `screenshots` 字段中获取。

---

## 便捷代理接口

如果不想自己管理 API Key，可使用封装好的代理接口（以下为示例站点，数据仅供参考）：

| 功能 | 接口示例 |
|------|---------|
| 个人信息 | `https://o.jk.sb/steam/profile/76561198887857717` |
| 游戏库存 | `https://o.jk.sb/steam/games/76561198887857717` |
| 最近游玩 | `https://o.jk.sb/steam/recentlyplayed/76561198887857717` |
| 最近游玩（指定数量） | `https://o.jk.sb/steam/recentlyplayed/76561198887857717/3` |
| 游戏成就 | `https://o.jk.sb/steam/achievements/76561198887857717/275850` |
| 游戏封面（Base64） | `https://o.jk.sb/steam/imageurl2base64/275850` |

---

## 注意事项

- 大部分用户相关接口需要**账号社区信息设为公开**，否则返回数据异常或为空
- 不同类型的 Key（开发者 / 普通玩家）可访问的接口范围不同
- API 存在速率限制，请勿频繁大量请求，否则 IP 可能被临时封禁
- Steam 周年庆游玩回顾（Replay）页面：`https://store.steampowered.com/replay/{steamid}/{year}`
