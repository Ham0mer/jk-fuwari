---
title: CLIProxyAPI 完全指南：将 AI CLI 工具统一转换为标准 API 服务
published: 2026-04-22T02:04:04
description: '详细介绍 CLIProxyAPI 的安装、配置、多账号管理、API 调用、客户端接入等全流程，一个代理统一所有 AI 编程工具'
image: ''
pinned: false
tags: ['AI', 'API', 'Docker']
category: '工具'
draft: false
lang: 'zh-CN'
---

CLIProxyAPI 是一个将 Gemini CLI、Claude Code、ChatGPT Codex、Grok Build、Antigravity 等 AI CLI 工具包装成 OpenAI / Gemini / Claude / Codex 兼容 API 服务的代理层，让你通过统一的标准 API 接口免费调用这些模型。

::github{repo="router-for-me/CLIProxyAPI"}

## 核心概念

CLIProxyAPI 本质上是一个中间层代理：

```
你的客户端 (Cursor / NextChat / Python SDK / curl)
        ↓  标准 API 请求 (OpenAI / Claude / Gemini 格式)
   CLIProxyAPI  (8317 端口)
        ↓  调用本地/远程 CLI 工具
Gemini CLI / Claude Code / Codex / Grok Build
        ↓  OAuth 免费额度
     云端 AI 模型
```

**支持的 CLI 后端：**

| CLI 工具 | 对应模型 | 免费额度 |
|----------|---------|---------|
| Gemini CLI | Gemini 2.5 Pro / Flash | 每日大量免费请求 |
| Claude Code | Claude Sonnet / Opus | 按月计费账户 |
| ChatGPT Codex | GPT-4o / o3 | Plus 会员额度 |
| Grok Build | Grok 3 / 4 | xAI 免费额度 |
| Antigravity | 多模型 | 自定义 |

**支持的 API 协议：**
- OpenAI Chat Completions (`/v1/chat/completions`)
- OpenAI Responses API (`/v1/responses`)
- Anthropic Messages (`/v1/messages`)
- Google Gemini (`/v1beta/models/:model/generateContent`)

:::tip[核心价值]
通过一个本地/服务器服务，用标准 API 接口调用多个免费 AI 额度，Cursor、NextChat、OpenClaw 等工具无缝接入。
:::

---

## 安装

### 方式一：二进制文件（推荐新手）

前往 [Releases 页面](https://github.com/router-for-me/CLIProxyAPI/releases) 下载对应系统的压缩包，解压后直接运行。

**Linux / macOS：**

```bash
# 下载（以 Linux amd64 为例，请替换为最新版本号）
wget https://github.com/router-for-me/CLIProxyAPI/releases/latest/download/CLIProxyAPI-linux-amd64.tar.gz
tar -xzf CLIProxyAPI-linux-amd64.tar.gz
chmod +x cliproxyapi

# 初始化默认配置
./cliproxyapi init

# 启动服务
./cliproxyapi start
```

**macOS（Homebrew）：**

```bash
brew tap router-for-me/tap
brew install cliproxyapi
cliproxyapi init && cliproxyapi start
```

**Windows（PowerShell）：**

```powershell
# 下载 windows-amd64.zip 后解压，在目录内执行
.\cliproxyapi.exe init
.\cliproxyapi.exe start
```

### 方式二：Docker（推荐服务器部署）

```bash
# 创建工作目录
mkdir -p ~/cliproxyapi/{auths,logs}
cd ~/cliproxyapi

# 下载示例配置
curl -O https://raw.githubusercontent.com/router-for-me/CLIProxyAPI/main/config.example.yaml
cp config.example.yaml config.yaml

# 拉取并启动
docker run -d \
  --name cliproxyapi \
  --restart unless-stopped \
  -p 8317:8317 \
  -v $(pwd)/config.yaml:/app/config.yaml \
  -v $(pwd)/auths:/app/auths \
  -v $(pwd)/logs:/app/logs \
  ghcr.io/router-for-me/cliproxyapi:latest
```

### 方式三：Docker Compose（推荐生产环境）

```yaml title="docker-compose.yml"
services:
  cliproxyapi:
    image: ghcr.io/router-for-me/cliproxyapi:latest
    container_name: cliproxyapi
    restart: unless-stopped
    ports:
      - "8317:8317"
    volumes:
      - ./config.yaml:/app/config.yaml
      - ./auths:/app/auths
      - ./logs:/app/logs
    environment:
      - TZ=Asia/Shanghai
```

```bash
docker compose up -d
```

---

## 配置文件详解

CLIProxyAPI 通过 `config.yaml` 管理所有配置，**支持热重载**，修改后即时生效无需重启。

```yaml title="config.yaml"
# ── 服务器基础配置 ──────────────────────────────
server:
  host: ""          # 留空表示监听所有网卡（0.0.0.0）
  port: 8317        # 服务端口，默认 8317
  # tls:            # 可选：开启 HTTPS
  #   cert: /path/to/cert.pem
  #   key: /path/to/key.pem

# ── 远程管理 / WebUI ──────────────────────────────
remote-management:
  allow-remote: true      # 是否允许远程访问管理接口
  secret-key: "your-strong-password"  # WebUI 登录密码，务必修改！

# ── 认证文件目录 ──────────────────────────────────
auth-dir: "./auths"       # 存放 OAuth 认证文件的目录

# ── 各 CLI 后端配置 ───────────────────────────────
providers:

  # Gemini CLI
  gemini:
    enabled: true
    api-keys:             # 客户端调用时使用的 API Key（自定义，随意填写）
      - "sk-gemini-your-key-1"
      - "sk-gemini-your-key-2"
    load-balance: round-robin   # round-robin | fill-first

  # Claude Code
  claude:
    enabled: true
    api-keys:
      - "sk-claude-your-key-1"
    load-balance: round-robin

  # ChatGPT Codex
  codex:
    enabled: false
    api-keys:
      - "sk-codex-your-key-1"

  # Grok Build
  grok:
    enabled: false
    api-keys:
      - "sk-grok-your-key-1"

# ── 全局 API Key（可同时访问所有后端）────────────
global-api-keys:
  - "sk-global-master-key"

# ── 日志配置 ──────────────────────────────────────
log:
  level: info             # debug | info | warn | error
  dir: "./logs"
```

:::warning[安全提示]
`secret-key` 是 WebUI 的登录密码，生产环境务必设置强密码。`api-keys` 是自定义的认证凭据，客户端连接时填写这里配置的值。
:::

### 负载均衡策略

| 策略 | 说明 | 适用场景 |
|------|------|---------|
| `round-robin` | 轮询均匀分配到所有账号 | 多号薅配额，最大化吞吐 |
| `fill-first` | 优先压满第一个账号，满了才切换 | 主力号 + 备用号组合 |

---

## CLI 认证授权

### Gemini CLI 授权

```bash
# 本地安装 Gemini CLI（需要 Node.js 18+）
npm install -g @google/gemini-cli

# 触发 OAuth 授权（会打开浏览器）
gemini auth login

# 授权成功后，将认证文件复制到 auths 目录
# CLIProxyAPI 会自动读取该目录下的认证信息
```

:::note
Gemini 个人 Google 账号每天有大量免费请求额度（Gemini 2.5 Pro 约 1000 次/天），特别适合轻量使用场景。
:::

### Claude Code 授权

```bash
# 安装 Claude Code（需要 Node.js 18+）
npm install -g @anthropic-ai/claude-code

# 触发 OAuth 授权
claude auth login

# 会在浏览器中完成 Anthropic 账号授权
# 授权后认证文件默认在 ~/.claude/ 目录
```

:::tip
Claude Code 使用 Claude Max 订阅的额度，适合需要更高质量代码生成的场景。
:::

### ChatGPT Codex 授权

```bash
# 安装 Codex CLI
npm install -g @openai/codex

# 登录 OpenAI 账号
codex auth login
```

### Grok Build 授权

```bash
# 安装 Grok Build
npm install -g @xai/grok-build

# 使用 xAI 账号授权
grok auth login
```

### 多账号管理

CLIProxyAPI 支持同一个后端绑定多个账号（认证文件），实现轮询负载均衡：

```
auths/
├── gemini-account1.json
├── gemini-account2.json
├── gemini-account3.json
├── claude-account1.json
└── codex-account1.json
```

每个认证文件对应一个账号，CLIProxyAPI 按配置的策略自动分配请求。

---

## WebUI 管理界面

启动服务后，访问 `http://服务器IP:8317/management.html` 进入后台管理：

- **账号状态**：实时查看各 CLI 账号的认证状态和剩余配额
- **配置管理**：在线修改 `config.yaml`，热重载即时生效
- **日志查看**：实时查看请求日志和错误信息
- **上传认证**：直接上传 OAuth 认证文件，无需手动拷贝

```
管理页面地址: http://YOUR_SERVER:8317/management.html
密码: config.yaml 中的 secret-key
```

---

## API 调用示例

CLIProxyAPI 服务默认在 `http://localhost:8317` 监听。

### cURL 调用

**OpenAI 格式（Chat Completions）：**

```bash
curl http://localhost:8317/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-gemini-your-key-1" \
  -d '{
    "model": "gemini-2.5-pro",
    "messages": [
      {"role": "user", "content": "你好，介绍一下你自己"}
    ]
  }'
```

**Anthropic 格式（Messages）：**

```bash
curl http://localhost:8317/v1/messages \
  -H "Content-Type: application/json" \
  -H "x-api-key: sk-claude-your-key-1" \
  -H "anthropic-version: 2023-06-01" \
  -d '{
    "model": "claude-sonnet-4-5",
    "max_tokens": 1024,
    "messages": [
      {"role": "user", "content": "写一个快速排序算法"}
    ]
  }'
```

**流式输出（Streaming）：**

```bash
curl http://localhost:8317/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-gemini-your-key-1" \
  -d '{
    "model": "gemini-2.5-pro",
    "stream": true,
    "messages": [
      {"role": "user", "content": "写一篇关于量子计算的科普文章"}
    ]
  }'
```

### Python SDK 调用

```python title="example.py" showLineNumbers
from openai import OpenAI

# 指向本地 CLIProxyAPI 服务
client = OpenAI(
    base_url="http://localhost:8317/v1",
    api_key="sk-gemini-your-key-1"
)

# 普通调用
response = client.chat.completions.create(
    model="gemini-2.5-pro",
    messages=[
        {"role": "user", "content": "解释一下什么是 RAG 技术"}
    ]
)
print(response.choices[0].message.content)

# 流式调用
stream = client.chat.completions.create(
    model="gemini-2.5-pro",
    messages=[{"role": "user", "content": "写一个 Python 爬虫示例"}],
    stream=True
)
for chunk in stream:
    if chunk.choices[0].delta.content:
        print(chunk.choices[0].delta.content, end="", flush=True)
```

```python title="anthropic_example.py" showLineNumbers
import anthropic

# 使用 Anthropic SDK 调用 Claude 后端
client = anthropic.Anthropic(
    base_url="http://localhost:8317",
    api_key="sk-claude-your-key-1"
)

message = client.messages.create(
    model="claude-sonnet-4-5",
    max_tokens=1024,
    messages=[
        {"role": "user", "content": "用 Go 语言实现一个并发安全的缓存"}
    ]
)
print(message.content[0].text)
```

### 查询可用模型

```bash
# 列出所有可用模型
curl http://localhost:8317/v1/models \
  -H "Authorization: Bearer sk-gemini-your-key-1"
```

---

## 接入主流客户端

### Cursor

1. 打开 Cursor → Settings → Models
2. **Base URL**: `http://localhost:8317/v1`
3. **API Key**: 填入 `config.yaml` 中配置的任意 `api-keys` 值
4. 选择模型（如 `gemini-2.5-pro`）后保存

:::tip
如果 Cursor 和 CLIProxyAPI 在同一台机器，使用 `http://localhost:8317/v1`；如果是远程服务器，替换为服务器 IP。
:::

### NextChat / ChatGPT-Next-Web

1. 打开 NextChat 设置
2. **自定义接口**: 勾选
3. **接口地址**: `http://localhost:8317`
4. **API Key**: 填入对应的 `api-keys`
5. **自定义模型名称**: `gemini-2.5-pro,claude-sonnet-4-5`

### OpenClaw

```
设置 → Provider → 自定义
Base URL: http://localhost:8317
API Type: openai-compatible
API Key: sk-global-master-key
```

:::caution[注意路径]
OpenClaw 接入时 Base URL **不要带** `/v1` 后缀，因为 OpenClaw 会自动追加路径，否则会出现 `/v1/v1/messages` 404 错误。
:::

### Open WebUI

```bash
# 在 Open WebUI 的环境变量中设置
OPENAI_API_BASE_URL=http://localhost:8317/v1
OPENAI_API_KEY=sk-gemini-your-key-1
```

### Continue（VSCode 插件）

```json title="~/.continue/config.json"
{
  "models": [
    {
      "title": "Gemini 2.5 Pro (Free)",
      "provider": "openai",
      "model": "gemini-2.5-pro",
      "apiBase": "http://localhost:8317/v1",
      "apiKey": "sk-gemini-your-key-1"
    },
    {
      "title": "Claude Sonnet",
      "provider": "anthropic",
      "model": "claude-sonnet-4-5",
      "apiBase": "http://localhost:8317",
      "apiKey": "sk-claude-your-key-1"
    }
  ]
}
```

---

## Nginx 反向代理（生产环境）

在服务器部署时，建议套一层 Nginx + HTTPS：

```nginx title="/etc/nginx/conf.d/cliproxyapi.conf"
server {
    listen 443 ssl;
    server_name your-domain.com;

    ssl_certificate     /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    location / {
        proxy_pass         http://127.0.0.1:8317;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection "upgrade";
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_read_timeout 300s;   # 流式响应需要较长超时
        proxy_buffering    off;    # 关闭缓冲，确保流式传输即时转发
    }
}

server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$host$request_uri;
}
```

```bash
# 申请证书（Certbot）
certbot --nginx -d your-domain.com

# 重载 Nginx
nginx -s reload
```

---

## 常见问题

### 认证失效怎么办？

CLI 工具的 OAuth Token 有有效期，过期后需要重新授权：

```bash
# 重新授权 Gemini
gemini auth login

# 重新授权 Claude Code  
claude auth login

# 将新生成的认证文件复制到 auths 目录
# CLIProxyAPI 会热重载自动识别
```

### 如何查看请求日志？

```bash
# Docker 部署查看日志
docker logs -f cliproxyapi

# 或访问 WebUI 管理页面的日志面板
http://YOUR_SERVER:8317/management.html
```

### 模型名称不对？

CLIProxyAPI 支持模型名称映射，可以在 `config.yaml` 中自定义：

```yaml
model-mapping:
  "gpt-4o": "gemini-2.5-pro"       # 把 gpt-4o 请求转发到 Gemini
  "claude-3-5-sonnet": "claude-sonnet-4-5"
```

### 端口被占用？

修改 `config.yaml` 中的 `port` 字段，或 Docker 部署时修改端口映射：

```bash
docker run -p 9000:8317 ...  # 映射到宿主机 9000 端口
```

### 流式响应中断？

检查 Nginx 配置中是否设置了 `proxy_buffering off` 和足够长的 `proxy_read_timeout`。

---

## 安全建议

:::warning[生产环境清单]
- [ ] `secret-key` 设置为强密码（16 位以上随机字符）
- [ ] `api-keys` 不要使用简单字符串
- [ ] 服务器防火墙只开放必要端口（建议套 Nginx + HTTPS，不直接暴露 8317）
- [ ] 定期轮换 `api-keys`
- [ ] `allow-remote: false` 如果不需要远程访问管理接口
:::

---

## 相关项目

::github{repo="router-for-me/Cli-Proxy-API-Management-Center"}

::github{repo="router-for-me/EasyCLI"}

::github{repo="justlovemaki/AIClient2API"}

---

CLIProxyAPI 的[官方文档](https://help.router-for.me/cn/)有更多高级配置细节，包括配额限制、安全策略、Webhook 等企业级功能。
