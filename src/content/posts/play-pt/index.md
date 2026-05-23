---
title: Seedbox：一键安装与 PT 刷流指南
published: 2025-09-06
description: '使用 jerry048 一键脚本搭建 qBittorrent Seedbox，含 autobrr、Vertex 刷流工具配置与网络优化说明'
image: ''
tags: ['PT', '工具']
category: '工具'
draft: false
lang: 'zh-CN'
---

Seedbox 是专用于 PT（私有 Tracker）下载和做种的服务器环境。本文介绍如何使用 jerry048 的一键脚本快速搭建，并说明各组件的用途与进阶优化方法。

::github{repo="jerry048/Dedicated-Seedbox"}

---

## 一键安装

```bash
bash <(wget -qO- https://raw.githubusercontent.com/jerry048/Dedicated-Seedbox/main/Install.sh) \
  -u <用户名> \
  -p <密码> \
  -c <缓存大小(MiB)> \
  -q <qBittorrent 版本> \
  -l <libtorrent 版本> \
  [选项...]
```

### 参数说明

| 参数 | 说明 |
|------|------|
| `-u` | 系统用户名 |
| `-p` | 用户密码 |
| `-c` | qBittorrent 缓存大小（单位 MiB，建议为内存的 1/4） |
| `-q` | qBittorrent 版本号，如 `4.3.9` |
| `-l` | libtorrent 版本号，如 `v1.2.19` |
| `-b` | 安装 autobrr（国际 PT 自动抢种） |
| `-v` | 安装 Vertex（综合刷流管理工具） |
| `-r` | 安装 autoremove-torrents（自动删种） |
| `-3` | 启用 BBR V3 网络加速 |
| `-x` | 启用 BBRx 网络加速 |
| `-o` | 自定义端口 |

### 安装示例

```bash
bash <(wget -qO- https://raw.githubusercontent.com/jerry048/Dedicated-Seedbox/main/Install.sh) \
  -u jerry048 \
  -p 1LDw39VOgors \
  -c 3072 \
  -q 4.3.9 \
  -l v1.2.19 \
  -v -x
```

此命令安装 qBittorrent 4.3.9（libtorrent v1.2.19），缓存 3 GB，安装 Vertex，启用 BBRx 加速。

### 支持的系统与架构

| 类别 | 支持范围 |
|------|---------|
| 操作系统 | Debian 10+、Ubuntu 20.04+ |
| CPU 架构 | x86_64、ARM64 |

---

## 工具介绍

### qBittorrent

主力下载/做种客户端，支持 Web UI 远程管理，是 PT 刷流的核心程序。

### autobrr — 国际 PT 自动抢种

::github{repo="autobrr/autobrr"}

autobrr 通过监听 PT 站的 IRC `#announce` 频道，在种子发布的第一时间自动推送到下载客户端，适合国际 PT 站（如 BTN、PTP、RED 等）的抢首发场景。

### Vertex — 综合刷流管理工具

::github{repo="vertex-app/vertex"}

Vertex 是面向 PT 玩家的一体化管理工具，支持：

- RSS 自动订阅与推送下载
- 按规则自动删除低效种子
- 多下载器负载均衡
- 追剧与刷流一体化流程

:::tip
Vertex 官方文档：[wiki.vertex.icu](https://wiki.vertex.icu/zh/home)
:::

### autoremove-torrents — 自动删种

::github{repo="jerrym19881225/autoremove-torrents"}

根据自定义规则（分享率、做种时间、种子大小等）自动清理低效种子，释放磁盘和带宽资源，支持 qBittorrent、Transmission、Deluge 等客户端。

---

## 网络加速：BBR V3 与 BBRx

BBR（Bottleneck Bandwidth and Round-trip propagation time）是 Google 开发的 TCP 拥塞控制算法，相比传统 CUBIC 算法在高带宽、长延迟或轻微丢包网络环境下有明显优势。

| 选项 | 说明 |
|------|------|
| BBR V3（`-3`） | Google 官方最新版，已提交 Linux 内核主线，稳定性好 |
| BBRx（`-x`） | 社区魔改版，激进调优，适合带宽充裕的 Seedbox 场景 |

:::tip
一般 Seedbox 推荐 BBRx；对稳定性有要求的生产环境选 BBR V3。两者互斥，只能选一个。
:::

---

## 进阶优化备注

### 缓存大小

缓存建议设为机器内存的 **1/4**。如使用 qBittorrent 4.3.x，受内存溢出问题影响，应保守设置在 **1/8**。

### 异步 I/O 线程数

默认值为 4，对 HDD 友好。若使用 SSD 或 NVMe，可调整为 8～16：

- **qBittorrent 4.3.x**：高级选项中直接修改
- **qBittorrent 4.1.x**：在 `/home/$username/.config/qBittorrent/qBittorrent.conf` 的 `[BitTorrent]` 段添加：
  ```ini
  Session\AsyncIOThreadsCount=8
  ```
  修改前请先关闭 qBittorrent。
- **Deluge**：通过 [ltconfig 插件](https://github.com/ratanakvlun/deluge-ltconfig/releases/tag/v0.3.1) 设置 `aio_threads=8`

### 发送缓冲区（I/O 较差的机器）

对于磁盘 I/O 较弱的机器，适当降低以下参数：

- **qBittorrent 4.3.x**：高级选项中修改
- **qBittorrent 4.1.x**：在配置文件 `[BitTorrent]` 段添加：
  ```ini
  Session\SendBufferWatermark=5120
  Session\SendBufferLowWatermark=1024
  Session\SendBufferWatermarkFactor=150
  ```
- **Deluge（ltconfig）**：
  ```
  send_buffer_low_watermark=1048576
  send_buffer_watermark=5242880
  send_buffer_watermark_factor=150
  ```

### tick_interval（CPU 较差的机器）

调高 `tick_interval` 可节省 CPU 资源（qBittorrent 暂不支持此项）：

- **Deluge（ltconfig）**：`tick_interval=250`

### TCP 缓存大小

`/etc/sysctl.conf` 中配置的 TCP 缓存对低端机器可能偏大，请根据实际情况酌情调低。

### 文件系统

强烈推荐使用 **XFS** 文件系统，在多并发做种场景下 I/O 性能优于 ext4。
