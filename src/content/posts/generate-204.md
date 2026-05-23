---
title: generate_204：网络连通性检测服务汇总
published: 2025-10-27T13:19:07
description: '什么是 generate_204？原理是什么？国内外主流 generate_204 服务地址汇总，含国内厂商（小米、华为、Vivo）及 Google、Apple、Cloudflare 等。'
image: ''
pinned: false
tags: ['generate_204', '延迟测试', '网络工具']
category: '工具'
draft: false
lang: 'zh-CN'
---

## 什么是 generate_204

`generate_204` 是一种用于检测网络联通性的轻量 HTTP 接口。设备连接到 Wi-Fi 后，操作系统会自动向预设 URL 发送 HTTP 请求，根据返回的状态码判断当前网络状态：

- 返回 **204 No Content** 或 **200 OK** → 网络畅通，可正常上网
- 返回 **302 重定向** → 可能处于需要认证的 Captive Portal（如酒店/机场 Wi-Fi 登录页）
- **请求超时 / 无响应** → 网络不通或被封锁

:::note
"204" 的含义是 HTTP 状态码 No Content（无内容），服务器返回空响应体，流量消耗极少，非常适合作为周期性心跳检测。
:::

---

## 工作原理

```
设备连接 Wi-Fi
    ↓
发送 HTTP GET → http://www.gstatic.com/generate_204
    ↓
┌───────────────────────────────────────┐
│  返回 204   →  网络正常，无感知通过   │
│  返回 302   →  弹出 Portal 登录界面   │
│  超时/其他  →  显示"无互联网访问"     │
└───────────────────────────────────────┘
```

各主流操作系统使用不同的检测地址：

| 系统 / 浏览器 | 使用的检测 URL |
| :--- | :--- |
| Android (AOSP) | `http://connectivitycheck.gstatic.com/generate_204` |
| Chrome / ChromeOS | `http://www.gstatic.com/generate_204` |
| Microsoft Edge | `http://edge-http.microsoft.com/captiveportal/generate_204` |
| Windows (NCSI) | `http://www.msftconnecttest.com/connecttest.txt` |
| macOS / iOS | `http://captive.apple.com` |
| Firefox | `http://detectportal.firefox.com/canonical.html` |
| MIUI (小米) | `http://connect.rom.miui.com/generate_204` |
| HarmonyOS (华为) | `http://connectivitycheck.platform.hicloud.com/generate_204` |

---

## 服务地址汇总

:::tip
下表中的"体验评分"为粗略延迟测试（满分 10 分），实际结果因地区和时段而异，仅供参考。
:::

### 国际服务

| 服务提供者 | 链接 | 大陆体验 | 境外体验 | HTTP / HTTPS 响应码 | IP 版本 |
| :--- | :--- | :--: | :--: | :--: | :--: |
| Google | `http://www.gstatic.com/generate_204` | 5 | 10 | 204 / 204 | 4+6 |
| Google | `http://www.google.com/generate_204` | 0 | 10 | 204 / 204 | 4+6 |
| Google | `http://connectivitycheck.gstatic.com/generate_204` | 4 | 10 | 204 / 204 | 4+6 |
| Google | `http://connectivitycheck.android.com/generate_204` | 3 | 10 | 204 / 204 | 4+6 |
| Google | `http://clients3.google.com/generate_204` | 3 | 10 | 204 / 204 | 4+6 |
| Google | `http://play.googleapis.com/generate_204` | 2 | 10 | 204 / 204 | 4+6 |
| Google | `http://www.google-analytics.com/generate_204` | 6 | 10 | 204 / 204 | 4+6 |
| Apple | `http://captive.apple.com` | 3 | 10 | 200 / 200 | 4+6 |
| Apple 🔥 | `http://www.apple.com/library/test/success.html` | 7 | 10 | 200 / 200 | 4+6 |
| Microsoft | `http://www.msftconnecttest.com/connecttest.txt` | 5 | 10 | 200 / error | 4 |
| Microsoft | `http://edge-http.microsoft.com/captiveportal/generate_204` | 5 | 10 | 204 / 204 | 4 |
| Microsoft | `http://www.msftncsi.com/ncsi.txt` | 4 | 10 | 200 / 200 | 4 |
| Cloudflare 🔥 | `http://cp.cloudflare.com/` | 4 | 10 | 204 / 204 | 4+6 |
| Firefox | `http://detectportal.firefox.com/success.txt` | 5 | 10 | 200 / 200 | 4+6 |
| Firefox | `http://detectportal.firefox.com/canonical.html` | 5 | 10 | 200 / 200 | 4+6 |
| GNOME | `http://nmcheck.gnome.org/check_network_status.txt` | 2 | 8 | 200 / 200 | 4+6 |
| V2EX | `http://www.v2ex.com/generate_204` | 0 | 10 | 204 / 301 | 4+6 |

### 国内服务

| 服务提供者 | 链接 | 大陆体验 | 境外体验 | HTTP / HTTPS 响应码 | IP 版本 |
| :--- | :--- | :--: | :--: | :--: | :--: |
| 小米 / MIUI 🔥 | `http://connect.rom.miui.com/generate_204` | 10 | 4 | 204 / 204 | 4 |
| 华为 / HiCloud | `http://connectivitycheck.platform.hicloud.com/generate_204` | 10 | 5 | 204 / 204 | 4 |
| Vivo | `http://wifi.vivo.com.cn/generate_204` | 10 | 5 | 204 / 204 | 4 |

:::warning
国内服务（小米、华为、Vivo）在境外网络环境下延迟较高甚至不可达，不建议在海外服务器上使用。反之，Google 系地址在大陆网络中通常被封锁，大陆用户推荐使用 Apple、Cloudflare 或国内厂商地址。
:::

---

## 常见使用场景

### 1. 代理软件联通性测试

主流代理工具（如 Clash、sing-box）的延迟测试（URL Test）默认使用 `http://www.gstatic.com/generate_204`，可根据需要替换为延迟更低的地址：

```yaml
# Clash / Mihomo 示例
url-test:
  url: "http://cp.cloudflare.com/"   # 或使用 apple.com/library/test/success.html
  interval: 300
```

### 2. 替换 Android 默认检测地址（去除感叹号）

在 Android 设备（需 Root 或 ADB）中修改检测地址，可将 Google 服务替换为国内可访问的地址，解决 Wi-Fi 图标感叹号问题：

```bash
# 通过 ADB 修改（Android 7+）
adb shell settings put global captive_portal_http_url "http://connect.rom.miui.com/generate_204"
adb shell settings put global captive_portal_https_url "https://connect.rom.miui.com/generate_204"
```

:::caution
修改系统检测地址可能影响 Captive Portal 的自动弹出功能（如机场/酒店 Wi-Fi 登录页），请根据实际需求谨慎操作。
:::

### 3. 自建检测服务

可以用 Nginx 快速搭建私有 generate_204 端点，适合企业内网或私有部署场景：

```nginx
location /generate_204 {
    return 204;
}
```

---

## 选择建议

| 使用环境 | 推荐地址 |
| :--- | :--- |
| 大陆用户，追求速度 | `http://www.apple.com/library/test/success.html` |
| 大陆用户，Android 原生 | `http://connect.rom.miui.com/generate_204` |
| 境外服务器 / 代理测速 | `http://cp.cloudflare.com/` |
| 需要严格 204 状态码 | `http://www.gstatic.com/generate_204`（境外）|
| 全球通用，兼容性佳 | `http://cp.cloudflare.com/` |

---

*体验评分仅为粗略延迟测试，大概率与实际不符，仅作参考。*
