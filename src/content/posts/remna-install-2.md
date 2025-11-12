---
title: Remnawave节点管理面板-节点篇
published: 2025-10-18T17:16:41
description: 'Remnawave节点管理面板Docker部署及节点配置教程'
image: '/IMG/remna-install-2/01.webp'
pinned: true
tags: ['Remnawave','节点管理面板','Docker','节点配置']
category: '教程'
draft: false 
lang: 'zh-CN'
---
:::warning
Remnawave Panel 不包括 Xray-core，因此您需要在单独的服务器上安装 Remnawave Node 才能使用 Remnawave 的所有功能。
节点端也需要安装Docker
:::

## 创建项目目录

```js
mkdir /opt/remnanode && cd /opt/remnanode
```

## 配置 .env 文件


```js
nano .env
```

.env 文件内容
```sh title=".env"
APP_PORT=2222

SSL_CERT=CERT_FROM_MAIN_PANEL
```
:::tip
`SSL_CERT` 值可以从 节点 → 管理 下的 面板 → 创建新节点 （按钮）中获取。复制按钮将添加到剪贴板。
:::

![rem-02.png](/IMG/remna-install-2/02.png)
```sh title=".env"
APP_PORT=2222

SSL_CERT="eyJub2RlQ2xxxxxxx......."
```

## 创建docker-compose.yml文件

```bash
nano docker-compose.yml
```
```sh title="docker-compose.yml"
services:
    remnanode:
        container_name: remnanode
        hostname: remnanode
        image: remnawave/node:latest
        restart: always
        network_mode: host
        env_file:
            - .env
```

## 启动节点容器

```bash
docker compose up -d && docker compose logs -f -t
```

## 编辑xray配置文件

![rem-03.png](/IMG/remna-install-2/03.png)

### vless+tcp+reality配置

想图方便可以直接复制粘贴进配置文件，入站标签是唯一的可以自定义

```json
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

`publicKey`和`privateKey`,可以在下方工具栏生成

![rem-04.png](/IMG/remna-install-2/04.png)

## 将配置文件与节点关联

将配置文件与节点关联起来，需要在 节点 → 管理 下的 选中刚刚添加的节点，点击`更改配置文件`，选中改成创建的`xray配置文件`和入站标签,点击应用更改，再点击保存。
当然进行到这一步依然无法使用节点。往下看
![rem-05.png](/IMG/remna-install-2/05.png)

## 创建主机
在这就是将入站真正的开启并监听端口
选择主机 → 创建主机
备注自定义，选择入站配置文件为刚刚创建的`test1`，点击应用更改
![rem-06.png](/IMG/remna-install-2/06.png)
可以看到端口自动填入了`30004`，地址要填绑定了节点的IP的域名，将右上角按钮到开启状态，
![rem-07.png](/IMG/remna-install-2/07.png)
至此可以看到入站为如下状态
![rem-08.png](/IMG/remna-install-2/08.png)

## 最后一步
完成以上的步骤是99%，剩下1%是将配置文件赋予给用户。
进入内部分组，编辑默认分组文件，将配置文件赋予给分组，点击应用更改，再点击保存。
![rem-10.png](/IMG/remna-install-2/10.png)

现在可以再用户列表选中用户，看到订阅链接。
![rem-09.png](/IMG/remna-install-2/09.png)

此面板玩法极其丰富，适合几个人合租使用。
