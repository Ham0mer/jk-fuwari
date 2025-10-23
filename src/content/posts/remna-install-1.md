---
title: Remna节点管理面板-面板篇
published: 2025-10-18T21:37:53
description: 'Remna节点管理面板Docker部署安装教程'
image: '/IMG/remna-install-2/01.webp'
pinned: true
tags: ['Remna','节点管理面板','Docker']
category: '教程'
draft: false 
lang: 'zh-CN'
---

:::tip
这是秒杀一切的面板，它可以帮助你管理你的节点，包括节点的状态、节点的配置、节点的日志等。
:::

面板官网：[https://remna.st/](https://remna.st/)

## 安装Docker

使用官方脚本安装 Docker

```bash
sudo curl -fsSL https://get.docker.com | sh
```
## 安装前准备

### 创建运行目录

```bash
mkdir /opt/remnawave && cd /opt/remnawave
```

### 获取docker-compose.yml文件

```bash
curl -o docker-compose.yml https://raw.githubusercontent.com/remnawave/backend/refs/heads/main/docker-compose-prod.yml
```

### 获取 .env 文件

```bash
curl -o .env https://raw.githubusercontent.com/remnawave/backend/refs/heads/main/.env.sample
```

## 配置 .env 文件

### 生成安全密钥

```bash
sed -i "s/^JWT_AUTH_SECRET=.*/JWT_AUTH_SECRET=$(openssl rand -hex 64)/" .env && sed -i "s/^JWT_API_TOKENS_SECRET=.*/JWT_API_TOKENS_SECRET=$(openssl rand -hex 64)/" .env
```

### 生成密码

```bash
sed -i "s/^METRICS_PASS=.*/METRICS_PASS=$(openssl rand -hex 64)/" .env && sed -i "s/^WEBHOOK_SECRET_HEADER=.*/WEBHOOK_SECRET_HEADER=$(openssl rand -hex 64)/" .env
```

### 更改 Postgres 密码

```bash
pw=$(openssl rand -hex 24) && sed -i "s/^POSTGRES_PASSWORD=.*/POSTGRES_PASSWORD=$pw/" .env && sed -i "s|^\(DATABASE_URL=\"postgresql://postgres:\)[^\@]*\(@.*\)|\1$pw\2|" .env
```

### 配置面板端域名

现在，打开`.env`文件并更新以下变量：

`FRONT_END_DOMAIN`是面板可访问的域名。在此处输入您的域名。 例：panel.yourdomain.com
`SUB_PUBLIC_DOMAIN`是订阅地址 例：panel.yourdomain.com/api/sub

## 启动容器

```sh
docker compose up -d && docker compose logs -f -t
```
建议使用1Panel管理容器，panel.yourdomain.com反向代理到3000端口