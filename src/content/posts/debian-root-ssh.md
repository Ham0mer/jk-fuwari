---
title: debian开启root用户ssh登录
published: 2025-09-07
description: '一个用于在Debian系统中开启root用户SSH登录的脚本教程，包括设置root密码、修改SSH配置和重启SSH服务等步骤。'
image: '/IMG/debian-root-ssh.jpg'
tags: ['脚本']
category: '教程'
draft: false 
lang: 'zh-CN'
---

```sh frame="none"
#!/bin/bash
set -e

# 设置 root 密码
echo "请输入新的 root 密码："
passwd root

# 修改 SSH 配置文件
SSHD_CONFIG="/etc/ssh/sshd_config"

# 备份配置文件
cp $SSHD_CONFIG ${SSHD_CONFIG}.bak.$(date +%F-%T)

# 开启 root 登录
sed -i 's/^#\?PermitRootLogin.*/PermitRootLogin yes/' $SSHD_CONFIG
sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication yes/' $SSHD_CONFIG

# 重启 SSH 服务
if command -v systemctl &>/dev/null; then
    systemctl restart ssh || systemctl restart sshd
else
    service ssh restart || service sshd restart
fi

echo "✅ Root SSH 登录已开启！"
```