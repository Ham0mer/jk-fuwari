---
title: Docker安装ASF和TGbot
published: 2025-10-05
description: 'ASF 是一个帮助您轻松获得卡牌掉落的程序'
image: '/IMG/asf-install.jpg'
tags: ['ASF','TGbot']
category: '教程'
draft: false 
lang: 'zh_CN'
---

## 安装ASF

1. 一键安装

`docker run -p 1242:1242 -v /opt/ASF/config:/app/config -v /opt/ASF/plugins:/app/plugins --name asf --pull always justarchi/archisteamfarm`

2. 配置文件 ASF.json
```json
{
  "IPCPassword": "", #使用webUI需要设置密码
  "SteamOwnerID": 723457432 # 您的 Steam ID 可填可不填
}
```
3. 配置文件 IPC.config
```json
{
  "Kestrel": {
    "Endpoints": {
      "HTTP" : {
        "Url" : "http://*:1242"
      }
    }
  }
}
```
4. 重启ASF 访问 http://localhost:1242

## 安装TGbot

1. 一键安装
```bash
docker run -d \
  --name asfbot \
  --restart unless-stopped \
  --network host \
  -e ASF_IPC_HOST=127.0.0.1 \
  -e ASF_IPC_PORT=1242 \
  -e ASF_IPC_PASSWORD="" \
  -e TELEGRAM_BOT_TOKEN="你的Bot Token" \
  -e TELEGRAM_USER_ALIAS="@你的Telegram用户名" \
  ghcr.io/dmcallejo/asfbot`
```

国内可选代理`TELEGRAM_PROXY="http://你的代理IP:你的代理端口"`
