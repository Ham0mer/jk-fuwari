---
title: Office 365管理员
published: 2025-09-06
description: 'Office 365管理员常用配置链接汇总'
image: '/IMG/Office.jpg'
tags: ['Office']
category: '工具'
draft: false 
lang: ''
---
### Office365管理中心:

https://admin.microsoft.com/AdminPortal/Home#/homepage

### 验证
许可数量验证：
https://admin.microsoft.com/AdminPortal/Home#/licenses

### 安全配置
备用电话和邮箱配置:
https://portal.office.com/account/#personalinfo

### 密码修改
https://portal.office.com/account/#security

### 双重验证相关配置
https://account.activedirectory.windowsazure.com/proofup.aspx
https://account.activedirectory.windowsazure.com/passwordreset/Register.aspx

### 个性化配置
组织信息（如公司名、等联系方式等）配置：
https://admin.microsoft.com/AdminPortal/Home#/companyprofile

域名配置：
https://admin.microsoft.com/AdminPortal/Home#/Domains

默认的初始域不可删除，但可在添加其它域名后取消主域设置，并在用户管理中将用户修改为新域名

### 使用配置
Onedrive默认容量配置：
https://admin.onedrive.com/?v=StorageSettings

密码过期时间配置：
https://admin.microsoft.com/AdminPortal/Home#/settings/security

### 开号
https://admin.microsoft.com/AdminPortal/Home#/users

最简单和常用的方法就是直接去用户管理这里直接手动创建账号；需要大量跑号时，建议使用脚本批量跑号，一万个大概一个多小时能跑完；

### Azure Active Directory管理中心
https://aad.portal.azure.com/

除了office365管理中心可以进行设置外，Azure Active Directory管理中心亦有更多高级管理功能可供设置

### 用户自助找回密码配置
https://aad.portal.azure.com/#blade/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/PasswordReset