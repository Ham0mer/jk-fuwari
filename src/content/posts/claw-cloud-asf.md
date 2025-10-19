---
title: ClawCloud Run免费容器部署ASF云挂卡和TG机器人控制端
published: 2025-10-19T11:40:19
description: '白嫖挂卡工具，随时随地控制ASF挂卡'
image: '/IMG/claw-02.png'
tags: ['ClawCloud', 'ASF', 'TG机器人']
category: 'ClawCloud'
draft: false 
lang: 'zh-CN'
---

## ClawCloud Run 介绍
ClawCloud 是一家新加坡的主机服务商，最近推出了 ClawCloud Run 服务，这是一个集成在线开发、测试和生产环境的云开发平台。对于注册时长大于 180 天的 GitHub 用户，每个月提供免费的 5 美元余额。不限速的4刀HK VDS永远的神落幕了~~~

## 部署教程

### 官网

[ClawCloud Run 官网](https://run.claw.cloud/)

### 创建应用
 - Application Name: 任意填写

 - Image: justarchi/archisteamfarm

 - Usage: CPU 选择 0.1，内存推荐 256M

 - Network: Container Port 输入 1242，并勾选 Enable Internet Access

 - Local Storage: 点击 Add，Mount Path 输入 /app/config。如果后期需要安装插件，也要同时挂载 /app/plugins。

进入控制台，依次点击 App Launchpad -> Create App，按以下说明填写：

填写完成后点击 Deploy Application。

![clawcloud-run-create-app.png](/IMG/claw-01.png)

### 上传配置文件
在电脑新建一个文件，命名为 ASF.json。

```json title="ASF.json"
{
  "Headless": true,
  "IPCPassword": "xxxxx",
}
```

新建一个文件，命名为 IPC.config。

```json title="IPC.config"
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

将两个文件上传到`/app/config`目录下。重启容器，浏览器访问Public Address 可以看到控制页面。

![clawcloud-run-ipc.png](/IMG/claw-02.png)

填入上方的IPCPassword，即可登录页面。

新建机器人，参考官方文档[创建机器人](https://github.com/JustArchiNET/ArchiSteamFarm/wiki)

## TG 机器人

### 修改Public Address
将https修改为tcp，价格会达到每天0.09刀，每月2.7刀
![clawcloud-run-tcp.png](/IMG/claw-03.png)

### 配置TG机器人
机器需要的配置文件
```
ASF_IPC_HOST=修改后的TCP Public Address
ASF_IPC_PORT=修改后的TCP端口号
ASF_IPC_PASSWORD=xxxx
TELEGRAM_BOT_TOKEN=机器人token
TELEGRAM_USER_ALIAS=@你的TG用户名
```
### 创建应用
 - Application Name: 任意填写

 - Image: ghcr.io/dmcallejo/asfbot:latest

 - Usage: CPU 选择 0.1，内存推荐 256M

 - Network: 默认

 - Environment Variables: 点击 Add，分别填写上方的配置项

点击部署应用，等待应用启动。

### 完美使用
此时就可以在TG控制ASF机器人了，关于命令，需要去ASF官方文档查看。
