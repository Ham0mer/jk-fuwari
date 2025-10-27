---
title: 检测网络联通性&generate_204服务汇总
published: 2025-10-27T13:19:07
description: 'generate_204服务汇总，检测网络联通性'
image: ''
pinned: false
tags: ['generate_204','延迟测试']
category: '工具'
draft: false 
lang: ''
---
| 服务提供者 | 链接 | 大陆体验 | 境外体验 | http/https | IP Version |
| :--- | :--- | :--: | :--: | :--: | :--: |
| Google | http://www.gstatic.com/generate_204 | 5 | 10 | 204/204 | 4+6 |
| Google | http://www.google-analytics.com/generate_204 | 6 | 10 | 204/204 | 4+6 |
| Google | http://www.google.com/generate_204 | 0 | 10 | 204/204 | 4+6 |
| Google | http://connectivitycheck.gstatic.com/generate_204 | 4 | 10 | 204/204 | 4+6 |
| Apple | http://captive.apple.com | 3 | 10 | 200/200 | 4+6 |
| Apple🔥 | http://www.apple.com/library/test/success.html | 7 | 10 | 200/200 | 4+6 |
| MicroSoft | http://www.msftconnecttest.com/connecttest.txt | 5 | 10 | 200/error | 4 |
| Cloudflare | http://cp.cloudflare.com/ | 4 | 10 | 204/204 | 4+6 |
| Firefox | http://detectportal.firefox.com/success.txt | 5 | 10 | 200/200 | 4+6 |
| V2ex | http://www.v2ex.com/generate_204 | 0 | 10 | 204/301 | 4+6 |
| 小米 | http://connect.rom.miui.com/generate_204 | 10 | 4 | 204/204 | 4 |
| 华为 | http://connectivitycheck.platform.hicloud.com/generate_204 | 10 | 5 | 204/204 | 4 |
| Vivo | http://wifi.vivo.com.cn/generate_204 | 10 | 5 | 204/204 | 4 |

体验目前仅进行粗略测试延迟，大概率实际不符，仅作参考。