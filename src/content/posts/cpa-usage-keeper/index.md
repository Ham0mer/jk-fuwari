---
title: CPA Usage Keeper 完全指南：CLIProxyAPI 用量追踪与可视化面板
published: 2026-05-23T02:04:04
description: '详细介绍 CPA Usage Keeper 的安装部署、配置、Dashboard 功能、Nginx 反代等全流程，为 CLIProxyAPI 补充用量持久化与统计分析能力'
image: ''
pinned: false
tags: ['CPA', '监控', 'Docker']
category: '工具'
draft: false
lang: 'zh-CN'
---

CPA Usage Keeper 是一个独立的 CPA（CLIProxyAPI）用量持久化与可视化服务。它在 CPA 之上补充了 SQLite 持久化存储与统计分析能力，提供内置 Web Dashboard 用于查看 usage、pricing、request health 以及 model/API 维度的统计信息。

::github{repo="Willxup/cpa-usage-keeper"}

## 核心概念

CPA Usage Keeper 本质上是一个用量数据的中转 + 持久化 + 可视化层：

```
CLIProxyAPI (CPA)
    ↓  Redis usage 队列推送事件
CPA Usage Keeper
    ├── 消费队列 → 写入 SQLite
    ├── 定时拉取 CPA metadata
    ├── 暴露聚合 API
    └── 内置 Web Dashboard (8080 端口)
```

**它与 CPA 的关系：**

- **依赖 CPA**：Keeper 从 CPA 的 Redis usage 队列消费事件，通过 CPA 管理接口拉取 metadata
- **补充 CPA**：CPA 本身不做持久化存储，重启后用量数据丢失；Keeper 用 SQLite 持久保存，提供历史和趋势分析
- **独立部署**：Keeper 是独立进程/容器，不修改 CPA 的任何配置或代码

:::tip[核心价值]
让 CPA 的用量数据"落地"——持久化存储、历史回溯、趋势分析、成本估算，一个面板全部搞定。
:::

---

## 功能特性

- **用量持久化**：从 CPA Redis usage 队列消费事件并写入 SQLite，重启不丢数据
- **Dashboard 总览**：请求量、Token、成本、缓存命中率、成功率和延迟一目了然
- **多维度筛选**：按时间范围、模型、API Key 和来源筛选用量明细
- **分析页面**：Token 趋势图、模型/API Key/AI Provider 构成、时段热力图
- **API Key 独立查询**：可按 CPA API Key 查看专属用量
- **凭证页面**：展示 Auth File 与 AI Provider 使用情况，支持凭证限额查询与刷新
- **模型价格管理**：可维护模型价格，用于成本估算和统计展示
- **安全保护**：可选密码登录保护、SQLite 备份、Docker/Docker Compose 和 systemd 部署

---

## 前置条件

使用 CPA Usage Keeper 之前，请确认 CPA 已开启 usage 统计：

```yaml title="config.yaml"
# CPA 配置中必须启用
usage-statistics-enabled: true
```

---

## 安装部署

### 方式一：Docker Compose（推荐）

同时部署 CPA 和 Keeper 的最佳选择。仓库提供了 `docker-compose.example.yml` 作为模板：

```yaml title="docker-compose.yml"
services:
  cli-proxy-api:
    image: eceasy/cli-proxy-api:latest
    container_name: cli-proxy-api
    restart: unless-stopped
    ports:
      - "8317:8317"
      - "1455:1455"
    volumes:
      - ./cpa/config.yaml:/CLIProxyAPI/config.yaml
      - ./cpa/auths:/root/.cli-proxy-api
      - ./cpa/logs:/CLIProxyAPI/logs
    networks:
      - cpa-network

  cpa-usage-keeper:
    image: ghcr.io/willxup/cpa-usage-keeper:latest
    container_name: cpa-usage-keeper
    restart: unless-stopped
    depends_on:
      - cli-proxy-api
    ports:
      - "8080:8080"
    environment:
      TZ: Asia/Shanghai
      CPA_BASE_URL: http://cli-proxy-api:8317
      CPA_MANAGEMENT_KEY: replace-with-your-management-key
      REDIS_QUEUE_ADDR: cli-proxy-api:8317
      AUTH_ENABLED: true
      LOGIN_PASSWORD: replace-with-your-login-password
    volumes:
      - ./keeper:/data
    networks:
      - cpa-network

networks:
  cpa-network:
    driver: bridge
```

```bash
# 启动
docker compose up -d

# 停止
docker compose down
```

CPA 相关文件放在 `./cpa` 目录，Keeper 数据（SQLite 数据库、日志、备份）放在 `./keeper` 目录。

### 方式二：Docker（CPA 已在宿主机运行）

如果 CPA 已经在宿主机运行，只需单独部署 Keeper：

```bash
# 复制配置模板
cp .env.example .env
vim .env
```

```env title=".env"
CPA_BASE_URL=http://host.docker.internal:8317
CPA_MANAGEMENT_KEY=replace-with-your-management-key
REDIS_QUEUE_ADDR=host.docker.internal:8317
AUTH_ENABLED=true
LOGIN_PASSWORD=replace-with-your-login-password
```

```bash
docker run -d \
  --name cpa-usage-keeper \
  --add-host=host.docker.internal:host-gateway \
  -p 8080:8080 \
  -v "$(pwd)/keeper:/data" \
  --env-file .env \
  ghcr.io/willxup/cpa-usage-keeper:latest
```

:::note
`--add-host=host.docker.internal:host-gateway` 让容器能通过 `host.docker.internal` 访问宿主机上的 CPA 服务。
:::

### 方式三：Linux 二进制

前往 [Releases 页面](https://github.com/Willxup/cpa-usage-keeper/releases/latest) 下载对应架构的二进制包：

```bash
# 下载（请替换为实际下载地址）
curl -L -o cpa-usage-keeper.tar.gz "https://github.com/Willxup/cpa-usage-keeper/releases/latest/download/cpa-usage-keeper_linux_amd64.tar.gz"
mkdir -p cpa-usage-keeper
tar -xzf cpa-usage-keeper.tar.gz -C cpa-usage-keeper --strip-components=1
cd cpa-usage-keeper

# 配置并启动
cp .env.example .env
vim .env
./cpa-usage-keeper
```

#### systemd 常驻运行

二进制包内置了 `cpa-usage-keeper.service` 文件，可直接注册为 systemd 服务：

```bash
sudo cp cpa-usage-keeper.service /etc/systemd/system/cpa-usage-keeper.service
sudo sed -i "s|__CPA_USAGE_KEEPER_DIR__|$(pwd)|g" /etc/systemd/system/cpa-usage-keeper.service
sudo systemctl daemon-reload
sudo systemctl enable --now cpa-usage-keeper
```

常用管理命令：

```bash
sudo systemctl status cpa-usage-keeper   # 查看服务状态
sudo journalctl -u cpa-usage-keeper -f   # 实时查看日志
sudo systemctl restart cpa-usage-keeper  # 重启服务
```

---

## 配置详解

所有配置通过环境变量（`.env` 文件）管理。复制模板后按需修改：

```bash
cp .env.example .env
```

### 最小必填

| 变量 | 必填 | 默认值 | 说明 |
|------|------|--------|------|
| `CPA_BASE_URL` | 是 | - | Keeper 服务端访问 CPA 的地址。Docker Compose 内通常是 `http://cli-proxy-api:8317` |
| `CPA_MANAGEMENT_KEY` | 是 | - | CPA management key（即 CPA `config.yaml` 中的 `secret-key`），用于读取 CPA 管理接口数据 |

### Web 访问与反代

| 变量 | 必填 | 默认值 | 说明 |
|------|------|--------|------|
| `APP_PORT` | 否 | `8080` | Keeper HTTP 监听端口 |
| `APP_BASE_PATH` | 否 | 根路径 | 子路径部署前缀，例如 `/keeper` |
| `CPA_PUBLIC_URL` | 否 | 浏览器同源根路径 | 浏览器访问 CPA 的公开地址，用于"返回 CPA"跳转 |

:::tip[APP_BASE_PATH 说明]
`APP_BASE_PATH` 必须为空或以 `/` 开头。例如 `/cpa` 是正确的，`/cpa/` 会自动规范为 `/cpa`。如果你通过 Nginx 的 `/keeper/` 路径反代，需设置 `APP_BASE_PATH=/keeper`。
:::

### 登录保护

| 变量 | 必填 | 默认值 | 说明 |
|------|------|--------|------|
| `AUTH_ENABLED` | 否 | `false` | 是否启用登录保护 |
| `LOGIN_PASSWORD` | 鉴权启用时必填 | - | 登录密码 |
| `AUTH_SESSION_TTL` | 否 | `168h` | 登录 session 有效时长 |

:::warning[安全提示]
公网部署务必设置 `AUTH_ENABLED=true` 并配置强密码，防止用量数据被未授权访问。
:::

### 时区与请求

| 变量 | 必填 | 默认值 | 说明 |
|------|------|--------|------|
| `TZ` | 否 | `Asia/Shanghai` | 统计和展示使用的时区 |
| `REQUEST_TIMEOUT` | 否 | `30s` | 请求 CPA HTTP 接口的超时时间 |
| `TLS_SKIP_VERIFY` | 否 | `false` | 跳过 CPA HTTPS 证书验证（仅自签名证书时启用） |

### Redis 队列高级配置

| 变量 | 必填 | 默认值 | 说明 |
|------|------|--------|------|
| `REDIS_QUEUE_ADDR` | 否 | CPA 主机 + 8317 | CPA Redis/RESP TCP 地址 |
| `REDIS_QUEUE_TLS` | 否 | `false` | 是否使用 TLS 连接 Redis 队列 |
| `REDIS_QUEUE_BATCH_SIZE` | 否 | `10000` | 每次最多拉取的队列记录数 |
| `REDIS_QUEUE_IDLE_INTERVAL` | 否 | `1s` | 队列为空时的检查间隔 |

一般保持默认值即可，只有 CPA 的 Redis 端口不是默认 `8317` 时才需要显式设置。

### 存储、日志与备份

| 变量 | 必填 | 默认值 | 说明 |
|------|------|--------|------|
| `WORK_DIR` | 否 | `./data` | 工作目录（数据库、日志、备份） |
| `LOG_LEVEL` | 否 | `info` | 日志级别：`debug` / `info` / `warn` / `error` |
| `LOG_FILE_ENABLED` | 否 | `true` | 是否写入持久化日志文件 |
| `LOG_RETENTION_DAYS` | 否 | `7` | 日志保留天数，`0` 不自动清理 |
| `BACKUP_ENABLED` | 否 | `true` | 是否启用 SQLite 数据库备份 |
| `BACKUP_INTERVAL` | 否 | `24h` | 数据库备份间隔 |
| `BACKUP_RETENTION_DAYS` | 否 | `7` | 备份保留天数 |

### 内置 HTTPS

| 变量 | 必填 | 默认值 | 说明 |
|------|------|--------|------|
| `TLS_ENABLED` | 否 | `false` | 是否让 Keeper 自己启用 HTTPS |
| `TLS_CERT_FILE` | 启用时必填 | - | HTTPS 证书文件路径 |
| `TLS_KEY_FILE` | 启用时必填 | - | HTTPS 私钥文件路径 |

通常建议在 Nginx 或 Caddy 等反向代理层处理 HTTPS，而不是让 Keeper 自己处理。

---

## Dashboard 功能导览

启动服务后，访问 `http://服务器IP:8080` 进入 Dashboard。

### 总览页面

首页展示核心指标卡片：请求总量、Token 消耗、估算成本、缓存命中率、成功率、平均延迟。下方有请求趋势图和模型分布图，帮助你快速了解整体使用情况。

### 用量明细

支持按时间范围（Today / 7天 / 30天 / 自定义）、模型、API Key 和来源多维度筛选。每条记录包含请求时间、模型名称、Token 数、延迟、是否缓存命中、是否成功等字段。

### 分析页面

提供三个维度的深度分析：

- **Token 趋势**：按天/按小时查看 Token 消耗变化
- **构成分析**：模型占比、API Key 用量分布、AI Provider 占比
- **时段热力图**：一周内各时段的请求密度分布，直观发现使用高峰

### API Key 独立查询

如果你在 CPA 中配置了多个 `api-keys`（多用户场景），Keeper 支持按 Key 独立查询用量。每个 Key 对应一个专属页面，方便团队场景下的用量核算。

### 凭证页面

展示 CPA 中各 Auth File 的认证状态、对应的 AI Provider、剩余配额等信息。支持一键刷新凭证状态。

### 模型价格管理

Keeper 内置了主流模型的默认价格，但你可以在 Dashboard 中自定义价格，用于更准确的成本估算。

---

## Nginx 反向代理

在生产环境中，建议通过 Nginx 反代访问 Keeper，统一处理 HTTPS 和路径：

```nginx title="/etc/nginx/conf.d/keeper.conf"
server {
    listen 443 ssl;
    server_name your-domain.com;

    ssl_certificate     /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # 如果部署在子路径 /keeper/
    location /keeper/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}

server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$host$request_uri;
}
```

子路径部署时记得在 `.env` 中设置 `APP_BASE_PATH=/keeper`。

如果 CPA 管理页和 Keeper 使用同一域名，"返回 CPA"按钮会自动跳转到同源 `/management.html`，无需额外配置 `CPA_PUBLIC_URL`。如果 CPA 在其他域名或端口，请设置：

```env
# 示例：CPA 部署在独立域名
CPA_PUBLIC_URL=https://cpa.example.com
```

---

## 数据说明

了解数据流转有助于排查问题：

- **数据来源**：Keeper 从 CPA 的 Redis usage 队列消费每一条请求事件
- **存储方式**：SQLite 数据库，文件位于 `WORK_DIR/app.db`
- **Metadata 同步**：Keeper 定时从 CPA 管理接口拉取模型列表、Auth File 状态、配额信息等
- **数据清理**：Redis inbox 原始消息会自动清理——成功数据保留到当天结束后清理，失败数据保留 7 天
- **脱敏处理**：面向浏览器的 API 会对 key-like 的 source/lookup 字段做脱敏或稳定公开标识映射，但不会修改数据库原始值

---

## 常见问题

### 启动后 Dashboard 没有数据？

1. 确认 CPA 的 `config.yaml` 中 `usage-statistics-enabled: true` 已设置
2. 确认 `CPA_MANAGEMENT_KEY` 的值与 CPA 的 `secret-key` 一致
3. 确认 `REDIS_QUEUE_ADDR` 能连通 CPA 的 8317 端口
4. 发起几个 API 请求后再查看，数据从 Redis 队列消费有一定延迟（默认空闲时 1s 检查一次）

### CPA 和 Keeper 的网络不通？

Docker Compose 部署时两者在同一 `cpa-network` 下，服务名 `cli-proxy-api` 即可互通。Docker 单独部署时使用 `host.docker.internal` 访问宿主机。检查防火墙是否放行对应端口。

### 如何备份数据？

Keeper 内置自动备份功能（默认每 24 小时备份一次），备份文件在 `WORK_DIR/backups/`。你也可以手动备份 `WORK_DIR/app.db` 文件——SQLite 单文件数据库，直接复制即可。

### 数据库文件越来越大？

SQLite 数据库会随着用量数据积累而增长。目前 Keeper 暂不支持自动清理历史数据，如需清理可考虑定期重建。日志文件默认保留 7 天自动清理。

### 登录密码忘了？

登录 session 存在服务进程内存中，修改 `.env` 中的 `LOGIN_PASSWORD` 后重启服务即可用新密码登录（所有旧 session 会失效）。

### 子路径部署后页面白屏？

检查 `APP_BASE_PATH` 是否正确设置，以及 Nginx 的 `proxy_pass` 是否正确传递了路径前缀。确保静态资源的路径也正确映射。

---

## 安全建议

:::warning[生产环境清单]
- [ ] `AUTH_ENABLED=true` 并设置强密码（16 位以上随机字符）
- [ ] 在反向代理层配置 HTTPS（Nginx / Caddy），不直接暴露 8080 端口
- [ ] 数据库备份文件不做加密，妥善保管 `WORK_DIR/backups/` 目录
- [ ] 登录 session 存于内存，服务重启后失效——这是设计如此，不必疑惑
- [ ] 定期检查 `LOG_RETENTION_DAYS` 和 `BACKUP_RETENTION_DAYS`，避免磁盘占满
:::

---

## 相关项目

::github{repo="router-for-me/CLIProxyAPI"}

::github{repo="router-for-me/Cli-Proxy-API-Management-Center"}

---

CPA Usage Keeper 让 CPA 的用量数据从"用完即丢"变成"可追溯、可分析、可优化"的资产。配合 Dashboard 的多维度分析能力，你可以清楚地了解各个模型的实际使用成本和效率，从而做出更合理的配额分配决策。
