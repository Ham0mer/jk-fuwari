---
title: Remnawave节点管理面板-面板篇
published: 2025-10-18T21:37:53
description: 'Remnawave节点管理面板Docker部署安装教程'
image: '/IMG/remna-install-2/01.webp'
pinned: true
tags: ['Remnawave','节点管理面板','Docker']
category: '教程'
draft: false 
lang: 'zh-CN'
---

:::tip
Remnawave 是一款功能强大的节点管理面板，可以帮助你管理节点状态、配置、订阅和用户等。
:::

面板官网：[https://remna.st/](https://remna.st/)

## 安装 Docker

如果尚未安装 Docker，使用官方脚本一键安装：

```bash
sudo curl -fsSL https://get.docker.com | sh
```

## 第一步 - 下载所需文件

创建项目目录：

```bash
mkdir /opt/remnawave && cd /opt/remnawave
```

下载 `docker-compose.yml` 文件：

```bash
curl -o docker-compose.yml https://raw.githubusercontent.com/remnawave/backend/refs/heads/main/docker-compose-prod.yml
```

下载 `.env` 文件：

```bash
curl -o .env https://raw.githubusercontent.com/remnawave/backend/refs/heads/main/.env.sample
```

## 第二步 - 配置 .env 文件

### 生成安全密钥

`JWT_AUTH_SECRET` 和 `JWT_API_TOKENS_SECRET` 用于身份验证和相关安全功能，运行以下命令自动生成：

```bash
sed -i "s/^JWT_AUTH_SECRET=.*/JWT_AUTH_SECRET=$(openssl rand -hex 64)/" .env && sed -i "s/^JWT_API_TOKENS_SECRET=.*/JWT_API_TOKENS_SECRET=$(openssl rand -hex 64)/" .env
```

### 生成随机密码

```bash
sed -i "s/^METRICS_PASS=.*/METRICS_PASS=$(openssl rand -hex 64)/" .env && sed -i "s/^WEBHOOK_SECRET_HEADER=.*/WEBHOOK_SECRET_HEADER=$(openssl rand -hex 64)/" .env
```

### 更改 Postgres 密码

**强烈建议**修改默认的 Postgres 密码：

```bash
pw=$(openssl rand -hex 24) && sed -i "s/^POSTGRES_PASSWORD=.*/POSTGRES_PASSWORD=$pw/" .env && sed -i "s|^\(DATABASE_URL=\"postgresql://postgres:\)[^\@]*\(@.*\)|\1$pw\2|" .env
```

### 配置域名

打开 `.env` 文件，更新以下两个变量：

- `FRONT_END_DOMAIN`：面板的访问域名。例：`panel.yourdomain.com`
- `SUB_PUBLIC_DOMAIN`：订阅地址，在面板域名后加上 `/api/sub`。例：`panel.yourdomain.com/api/sub`

:::tip
更多环境变量的说明，请参考[官方文档 - Environment Variables](https://remna.st/docs/install/environment-variables)。
:::

## 第三步 - 启动容器

```bash
docker compose up -d && docker compose logs -f -t
```

启动后稍等片刻，日志输出正常即表示面板已成功运行。

## 下一步 - 配置反向代理

:::danger
**必须配置反向代理才能正常使用 Remnawave 面板。**

请勿将服务直接暴露到公网，Remnawave 各服务应仅绑定到 `127.0.0.1`。
:::

建议使用 1Panel 或 Nginx Proxy Manager 管理反向代理，将 `panel.yourdomain.com` 反向代理到本机 `3000` 端口。