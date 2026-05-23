---
title: Maddy：自建邮件服务器指南
published: 2025-09-06
description: '从零开始用 Docker 搭建 maddy 自建邮件服务器，包含 DNS、DKIM、SPF、DMARC 配置及账户管理。'
image: '/IMG/maddy-mail.jpg'
tags: ['mail', 'Docker']
category: '工具'
draft: false
lang: 'zh-CN'
---

maddy 是一个开箱即用的一体化邮件服务器，集 MTA、IMAP、DKIM、SPF、DMARC 于一身，配置比传统 Postfix + Dovecot 方案简单很多。

::github{repo="foxcpp/maddy"}

## 前置条件

- 一台有**独立公网 IP** 的 VPS（需要开放 25、587、993、143 端口，部分云厂商默认封禁 25 端口，需提工单申请）
- 一个已解析的**域名**（例如 `example.com`）
- 一个指向服务器 IP 的**子域名**作为邮件主机名（例如 `mx.example.com`）
- SSL/TLS 证书（推荐 Let's Encrypt，可用 acme.sh 或 Certbot 申请）

:::warning
请先确认您的 VPS 已开放 TCP 25 端口，否则无法收发外部邮件。阿里云、腾讯云等默认封禁，需单独申请。
:::

---

## 安装 maddy

### 使用 docker-compose（推荐）

```yaml title="docker-compose.yml"
services:
  maddy:
    image: foxcpp/maddy:latest
    container_name: maddy
    restart: unless-stopped
    ports:
      - "25:25"       # SMTP (接收外部邮件)
      - "587:587"     # SMTP Submission (客户端发信)
      - "143:143"     # IMAP
      - "993:993"     # IMAPS (TLS)
    environment:
      - MADDY_HOSTNAME=mx.example.com   # 邮件服务器主机名
      - MADDY_DOMAIN=example.com        # 处理的邮件域名
    volumes:
      - ./maddy-data:/data
```

```bash
docker compose up -d
```

:::tip
`/data` 目录会自动生成默认配置文件 `maddy.conf`，以及 DKIM 私钥等数据。需要自定义配置时，直接编辑 `./maddy-data/maddy.conf` 后重启容器。
:::

### 配置 TLS 证书

maddy 首次启动会因找不到证书而失败。将证书文件复制到数据目录：

```bash
cp /path/to/fullchain.pem ./maddy-data/tls/fullchain.pem
cp /path/to/privkey.pem   ./maddy-data/tls/privkey.pem
```

然后重启容器：

```bash
docker compose restart maddy
```

---

## DNS 配置

以下记录均以 `example.com` 为例，请替换为您的实际域名。

### 基础记录

| 类型 | 主机记录 | 值 |
|------|---------|-----|
| A | `mx` | 服务器公网 IP |
| MX | `@` | `mx.example.com`（优先级 10） |
| PTR | 服务器 IP | `mx.example.com`（在 VPS 管理面板设置反向解析） |

:::important
PTR 反向解析（rDNS）是许多邮件服务器判断是否接收邮件的重要依据，务必配置，否则发出的邮件极易进垃圾箱。
:::

### SPF 记录

```txt
v=spf1 mx ~all
```

| 类型 | 主机记录 | 值 |
|------|---------|-----|
| TXT | `@` | `v=spf1 mx ~all` |

### DKIM 记录

maddy 在首次启动后会自动生成 DKIM 密钥，查看公钥内容：

```bash
cat ./maddy-data/dkim_keys/example.com_default.dns
```

输出示例（格式为 DNS TXT 记录值）：

```txt
v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...
```

将该内容添加到 DNS：

| 类型 | 主机记录 | 值 |
|------|---------|-----|
| TXT | `default._domainkey` | 上方输出的完整内容 |

### DMARC 记录

```txt
v=DMARC1; p=quarantine; rua=mailto:postmaster@example.com
```

| 类型 | 主机记录 | 值 |
|------|---------|-----|
| TXT | `_dmarc` | `v=DMARC1; p=quarantine; rua=mailto:postmaster@example.com` |

:::tip
DNS 记录生效通常需要几分钟到数小时，配置完成后可使用 [mail-tester.com](https://www.mail-tester.com) 检测评分，7 分以上为合格。
:::

---

## 账户管理

以下命令均在容器内执行，先进入容器终端：

```bash
docker exec -it maddy sh
```

### 创建邮箱账户

创建登录凭证（执行后会提示设置密码）：

```sh frame="none"
maddy creds create admin@example.com
```

创建 IMAP 存储账户：

```sh frame="none"
maddy imap-acct create admin@example.com
```

:::important
两步都要执行：`creds create` 负责认证登录，`imap-acct create` 负责创建邮件存储。缺少任意一步，账户都无法正常使用。
:::

### 修改密码

```sh frame="none"
maddy creds password admin@example.com
```

### 查看账户列表

```sh frame="none"
maddy creds list
maddy imap-acct list
```

### 管理邮箱文件夹

查看账户下的邮箱分类：

```sh frame="none"
maddy imap-mboxes list admin@example.com
```

---

## 测试收发邮件

### 测试收信

使用 QQ 邮箱、Gmail 等向 `admin@example.com` 发送一封测试邮件，然后在容器内查看收件箱：

```sh frame="none"
maddy imap-msgs list admin@example.com INBOX
```

### 测试发信评分

使用邮件客户端（Thunderbird、Apple Mail 等）通过以下参数连接后发送测试邮件到 [mail-tester.com](https://www.mail-tester.com)：

| 参数 | 值 |
|------|----|
| IMAP 服务器 | `mx.example.com` |
| IMAP 端口 | `993`（SSL/TLS）|
| SMTP 服务器 | `mx.example.com` |
| SMTP 端口 | `587`（STARTTLS）|
| 用户名 | `admin@example.com` |

---

## 常见问题

**邮件进了垃圾箱？**
检查 PTR 反向解析是否配置、DKIM/SPF/DMARC 是否全部生效，可在 [MXToolbox](https://mxtoolbox.com) 逐项验证。

**25 端口被封？**
联系 VPS 服务商提工单解封，或换用不封 25 端口的服务商（如 Vultr、Hetzner）。

**日志查看：**

```bash
docker logs -f maddy
```
