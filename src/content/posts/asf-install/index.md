---
title: ASF + TGbot：Docker 部署指南
published: 2025-10-05
description: 'ASF 是一个帮助您轻松获得 Steam 卡牌掉落的程序，支持多账号和 Web UI 管理'
image: './images/asf-install.jpg'
tags: ['ASF','TGbot','Docker']
category: '教程'
draft: false
lang: 'zh-CN'
---

ArchiSteamFarm（ASF）是一个开源的 Steam 挂卡程序，支持多账号管理、Web UI 以及 Telegram Bot 控制。本文介绍如何用 Docker 快速部署 ASF 及其 Telegram 控制 Bot。

::github{repo="JustArchiNET/ArchiSteamFarm"}

## 安装 ASF

### 1. 启动容器

```bash
docker run -d \
  -p 127.0.0.1:1242:1242 \
  -v /opt/ASF/config:/app/config \
  -v /opt/ASF/plugins:/app/plugins \
  --name asf \
  --restart unless-stopped \
  --pull always \
  justarchi/archisteamfarm
```

:::tip
端口绑定到 `127.0.0.1` 而非 `0.0.0.0`，可防止 IPC 接口暴露到公网。
:::

### 2. 配置 ASF.json

在 `/opt/ASF/config/` 下创建全局配置文件：

```json title="ASF.json"
{
  "IPCPassword": "yourpassword",
  "SteamOwnerID": 76561198000000000
}
```

- `IPCPassword`：访问 Web UI 所需的密码，建议设置
- `SteamOwnerID`：您的 Steam 64位 ID，可在 [steamid.io](https://steamid.io/) 查询

### 3. 配置 IPC.config

此文件让 ASF Web UI 可以在容器外访问：

```json title="IPC.config"
{
  "Kestrel": {
    "Endpoints": {
      "HTTP": {
        "Url": "http://*:1242"
      }
    }
  }
}
```

### 4. 添加 Steam 账号

为每个 Steam 账号在 `/opt/ASF/config/` 下创建一个以账号命名的 JSON 文件：

```json title="MyBot.json"
{
  "SteamLogin": "你的Steam用户名",
  "SteamPassword": "你的Steam密码",
  "Enabled": true
}
```

:::warning
Bot 配置文件名（如 `MyBot.json`）即为机器人名称，请避免使用特殊字符或空格。
:::

### 5. 重启并访问 Web UI

```bash
docker restart asf
```

浏览器打开 `http://localhost:1242`，使用 `IPCPassword` 登录即可管理所有账号。

---

## 配置 2FA（可选但推荐）

若您的 Steam 账号已开启手机令牌，ASF 支持托管 2FA，登录后无需手动输入验证码，并可自动确认交易。

在 ASF Web UI 的 **2FA 管理** 页面，按提示导入手机令牌的 `shared_secret` 完成绑定。

:::caution
导入 2FA 后，请妥善保存原始密钥备份。ASF 2FA 与手机令牌并行存在，两者均可生成有效验证码。
:::

---

## 安装 TGbot

ASFBot 让您可以通过 Telegram 远程控制 ASF。

::github{repo="dmcallejo/ASFBot"}

### 1. 创建 Telegram Bot

前往 [@BotFather](https://t.me/BotFather)，发送 `/newbot` 创建一个 Bot，保存返回的 **Token**。

### 2. 使用 docker-compose（推荐）

使用 docker-compose 同时管理 ASF 和 ASFBot，两个服务通过内部网络通信，无需将 IPC 端口暴露给外部：

```yaml title="docker-compose.yml"
services:
  asf:
    image: justarchi/archisteamfarm
    container_name: asf
    restart: unless-stopped
    ports:
      - "127.0.0.1:1242:1242"
    volumes:
      - ./config:/app/config
      - ./plugins:/app/plugins

  asfbot:
    image: ghcr.io/dmcallejo/asfbot
    container_name: asfbot
    restart: unless-stopped
    depends_on:
      - asf
    environment:
      - ASF_IPC_HOST=asf
      - ASF_IPC_PORT=1242
      - ASF_IPC_PASSWORD=yourpassword
      - TELEGRAM_BOT_TOKEN=你的Bot_Token
      - TELEGRAM_USER_ALIAS=@你的Telegram用户名
      # 国内服务器可取消注释以下代理配置
      # - TELEGRAM_PROXY=http://代理IP:代理端口
```

```bash
docker compose up -d
```

:::tip
使用 docker-compose 时，`ASF_IPC_HOST` 填写 `asf`（服务名），两个容器在同一网络内直接通信，无需 `--network host`。
:::

### 3. 单独运行 ASFBot

如果 ASF 已单独运行，可用以下命令单独启动 ASFBot：

```bash
docker run -d \
  --name asfbot \
  --restart unless-stopped \
  --network host \
  -e ASF_IPC_HOST=127.0.0.1 \
  -e ASF_IPC_PORT=1242 \
  -e ASF_IPC_PASSWORD=yourpassword \
  -e TELEGRAM_BOT_TOKEN=你的Bot_Token \
  -e TELEGRAM_USER_ALIAS=@你的Telegram用户名 \
  ghcr.io/dmcallejo/asfbot
```

国内服务器可添加 `-e TELEGRAM_PROXY=http://代理IP:代理端口` 通过代理连接 Telegram。

### 4. 常用 Bot 命令

向您的 Bot 发送以下命令来控制 ASF：

| 命令 | 说明 |
|------|------|
| `/status` | 查看所有 Bot 运行状态 |
| `/start BotName` | 启动指定 Bot |
| `/stop BotName` | 停止指定 Bot |
| `/pause BotName` | 暂停挂卡 |
| `/resume BotName` | 恢复挂卡 |
| `/farm BotName` | 手动触发挂卡 |
| `/2fa BotName` | 获取当前 2FA 令牌 |
| `/help` | 查看全部可用命令 |
