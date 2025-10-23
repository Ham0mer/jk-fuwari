---
title: 邮件服务器命令
published: 2025-09-06
description: 'maddy邮件服务器的基本操作命令指南，包括创建邮箱用户、设置密码、创建存储账户、查看账户列表、管理邮箱分类以及测试邮件接收等容器环境下的常用操作。'
image: '/IMG/maddy-mail.jpg'
tags: ['mail']
category: '工具'
draft: false 
lang: 'zh_CN'
---

创建邮箱用户

下面命令均在容器终端运行 `docker exec -it 1Panel-maddy-mail-1cQP sh`（这里maddy为容器名称）


创建登录账户，运行此命令后会让设置密码

```sh frame="none"
maddy creds create admin@example.com
```

创建存储账户

```sh frame="none"
maddy imap-acct create admin@example.com
```
可以查看账户列表

```sh frame="none"
maddy creds list
maddy imap-acct list
```
查看账户下的邮箱分类
```sh frame="none"
maddy imap-mboxes list admin@example.com
```
测试收信并在客户端上面配置
使用其他邮箱如QQ邮箱、谷歌邮箱向你上面创建的`admin@example.com`发送邮件，然后回到容器终端运行命令查看收件箱。
```sh frame="none"
maddy imap-msgs list admin@example.com INBOX
```