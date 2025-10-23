---
title: "[进阶]Remna节点管理面板-落地篇"
published: 2025-10-23T18:57:09
description: '落地篇是指在Remna节点管理面板中配置落地节点，用于转发流量。'
image: '/IMG/remna-install-2/01.webp'
pinned: false
tags: ['Remna', '节点管理面板', '落地篇']
category: '教程'
draft: false 
lang: 'zh-CN'
---

:::info
落地篇是指在Remna节点管理面板中配置落地节点，用于转发流量。
:::

## 搭建落地节点

本人习惯使用[3xui](https://github.com/MHSanaei/3x-ui/blob/main/README.zh_CN.md)搭建落地节点

### 新建socks5入站
 - 入站协议：socks
 - 监听端口：9999  ***#随机即可***
 - 密码：开启
 - 用户名：testuser
 - 密码：testpwd

![新建socks5入站](/IMG/remna-install-3/1.png)

### 快捷获取出站配置

左侧导航栏 `Xray设置`->`出站规则`->`添加出站` ，这里就有老铁问了，我落地鸡添加什么出站？
其实是利用3xui的工具来获取配置参数，不用快捷工具徒手搓这简直唐的没边了！
![快捷获取出站配置](/IMG/remna-install-3/2.png)
填入刚刚新建的socks5入站配置参数
![填入刚刚新建的socks5入站配置参数](/IMG/remna-install-3/3.png)
点击 `JSON`选项卡，复制出配置参数
![复制出配置参数](/IMG/remna-install-3/4.png)

```json title="落地鸡出站配置"
{
  "tag": "落地鸡",
  "protocol": "socks",
  "settings": {
    "servers": [
      {
        "address": "落地鸡IP",
        "port": 9999,
        "users": [
          {
            "user": "testuser",
            "pass": "testpwd"
          }
        ]
      }
    ]
  }
}
```

这里算是完成落地鸡的配置，后面就可以在Remna节点管理面板中配置中转节点了。

## 修改Remna节点配置

先进入Xray设置
![Xray设置](/IMG/remna-install-3/5.png)

```json title="Profile" ins={50-67,79-85} collapse={8-46,88-104}
{
  "log": {
    "loglevel": "info"
  },
  "inbounds": [
    {
      "tag": "test1",
      "port": 30004,
      "protocol": "vless",
      "settings": {
        "clients": [],
        "decryption": "none"
      },
      "sniffing": {
        "enabled": true,
        "destOverride": [
          "http",
          "tls",
          "quic"
        ]
      },
      "streamSettings": {
        "network": "tcp",
        "security": "reality",
        "realitySettings": {
          "dest": "www.amd.com:443",
          "show": false,
          "xver": 0,
          "spiderX": "",
          "shortIds": [
            "42aeec",
            "66c8bd6b1002427d",
            "5a1f",
            "6c",
            "adfb6126",
            "ce557a621e",
            "5fc062b8b4c2b9",
            "e4cfaf01e274"
          ],
          "publicKey": "3FB5YuwJgxCbQurerSwjhXDIHAB_SRdyecd5XLhtwE0",
          "privateKey": "m5mIb4EXjqkcfDDHRW_pU7Vz-hehwNgR5Hi2HFCO4S0",
          "serverNames": [
            "www.amd.com"
          ]
        }
      }
    }
  ],
  "outbounds": [
    {
      "tag": "落地鸡",
      "protocol": "socks",
      "settings": {
        "servers": [
          {
            "address": "落地鸡IP",
            "port": 9999,
            "users": [
              {
                "user": "testuser",
                "pass": "testpwd"
              }
            ]
          }
        ]
      }
    },
    {
      "tag": "DIRECT",
      "protocol": "freedom"
    },
    {
      "tag": "BLOCK",
      "protocol": "blackhole"
    }
  ],
  "routing": {
    "rules": [
      {
        "type": "field",
        "inboundTag": [
          "test1",
        ],
        "outboundTag": "落地鸡"
      },
      {
        "ip": [
          "geoip:private"
        ],
        "type": "field",
        "outboundTag": "BLOCK"
      },
      {
        "type": "field",
        "domain": [
          "geosite:private"
        ],
        "outboundTag": "BLOCK"
      },
      {
        "type": "field",
        "protocol": [
          "bittorrent"
        ],
        "outboundTag": "BLOCK"
      }
    ]
  }
}
```
点击下方`保存`，开始奔放吧！