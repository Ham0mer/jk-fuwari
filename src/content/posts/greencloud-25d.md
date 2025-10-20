---
title: "[测评]绿云东京Softbank"
published: 2025-10-20T20:37:58
description: '测评绿云东京Softbank三年付翻倍机器'
image: '/IMG/greencloudvps.webp'
pinned: false
tags: ['绿云', 'Softbank']
category: '测评'
draft: false 
lang: ''
---

官网：[https://greencloudvps.com](https://greencloudvps.com)
:::tip
第一次入手这家的机器，具体型号是 `Budget KVM Sale - BudgetKVMJP-2 (Softbank)` ，也不算是闪购鸡，因为我懒得抢看到这个有货就下单了三年，共计70刀。
:::

## 套餐

 - 2 cores @ EPYC Rome CPU
 - 4096MB RAM  ***# 三年付翻倍 8192MB RAM***
 - 35GB NVMe RAID-10 Hard drive
 - 1 IPv4
 - /64 IPv6
 - 750GB Bandwidth  ***# 三年付翻倍 1500GB Bandwidth***
 - 10Gbps Port
 - Linux OS
 - Tokyo, JP Softbank Line Location
 - Virtfusion Control Panel
 - 1 Free Backup/Snapshot

## 测评

:::warning
这家限制CPU占用时间，谨慎选择吧。
:::

### Yabs测试

```bash
# ## ## ## ## ## ## ## ## ## ## ## ## ## ## ## ## ## #
#              Yet-Another-Bench-Script              #
#                     v2025-04-20                    #
# https://github.com/masonr/yet-another-bench-script #
# ## ## ## ## ## ## ## ## ## ## ## ## ## ## ## ## ## #

Mon Oct 20 08:50:19 PM CST 2025

Basic System Information:
---------------------------------
Uptime     : 0 days, 7 hours, 6 minutes
Processor  : AMD EPYC 7C13 64-Core Processor
CPU cores  : 2 @ 2000.000 MHz
AES-NI     : ✔ Enabled
VM-x/AMD-V : ✔ Enabled
RAM        : 7.7 GiB
Swap       : 512.0 MiB
Disk       : 34.9 GiB
Distro     : Debian GNU/Linux 12 (bookworm)
Kernel     : 6.1.0-40-amd64
VM Type    : KVM
IPv4/IPv6  : ✔ Online / ✔ Online

IPv6 Network Information:
---------------------------------
ISP        : Cat Networks K.K
ASN        : AS3258 xTom Japan Corporation
Host       : Cat Networks K.K
Location   : Tokyo, Tokyo (13)
Country    : Japan

fio Disk Speed Tests (Mixed R/W 50/50) (Partition /dev/vda3):
---------------------------------
Block Size | 4k            (IOPS) | 64k           (IOPS)
  ------   | ---            ----  | ----           ---- 
Read       | 193.63 MB/s  (48.4k) | 1.87 GB/s    (29.2k)
Write      | 194.14 MB/s  (48.5k) | 1.88 GB/s    (29.3k)
Total      | 387.78 MB/s  (96.9k) | 3.75 GB/s    (58.6k)
           |                      |                     
Block Size | 512k          (IOPS) | 1m            (IOPS)
  ------   | ---            ----  | ----           ---- 
Read       | 4.71 GB/s     (9.2k) | 5.47 GB/s     (5.3k)
Write      | 4.96 GB/s     (9.7k) | 5.83 GB/s     (5.6k)
Total      | 9.68 GB/s    (18.9k) | 11.30 GB/s   (11.0k)

iperf3 Network Speed Tests (IPv4):
---------------------------------
Provider        | Location (Link)           | Send Speed      | Recv Speed      | Ping           
-----           | -----                     | ----            | ----            | ----           
Clouvider       | London, UK (10G)          | 771 Mbits/sec   | 815 Mbits/sec   | 204 ms         
Eranium         | Amsterdam, NL (100G)      | 754 Mbits/sec   | 769 Mbits/sec   | 239 ms         
Uztelecom       | Tashkent, UZ (10G)        | busy            | 1.19 Gbits/sec  | --             
Leaseweb        | Singapore, SG (10G)       | 2.63 Gbits/sec  | 2.78 Gbits/sec  | 68.0 ms        
Clouvider       | Los Angeles, CA, US (10G) | 412 Mbits/sec   | 938 Mbits/sec   | 98.4 ms        
Leaseweb        | NYC, NY, US (10G)         | 1.04 Gbits/sec  | 1.05 Gbits/sec  | 143 ms         
Edgoo           | Sao Paulo, BR (1G)        | 396 Mbits/sec   | 485 Mbits/sec   | 266 ms         

iperf3 Network Speed Tests (IPv6):
---------------------------------
Provider        | Location (Link)           | Send Speed      | Recv Speed      | Ping           
-----           | -----                     | ----            | ----            | ----           
Clouvider       | London, UK (10G)          | busy            | 643 Mbits/sec   | 204 ms         
Eranium         | Amsterdam, NL (100G)      | 668 Mbits/sec   | 695 Mbits/sec   | 239 ms         
Uztelecom       | Tashkent, UZ (10G)        | busy            | 700 Mbits/sec   | 229 ms         
Leaseweb        | Singapore, SG (10G)       | 2.71 Gbits/sec  | 2.76 Gbits/sec  | 68.1 ms        
Clouvider       | Los Angeles, CA, US (10G) | 1.54 Gbits/sec  | 161 Mbits/sec   | 101 ms         
Leaseweb        | NYC, NY, US (10G)         | 1.26 Gbits/sec  | 1.25 Gbits/sec  | 143 ms         
Edgoo           | Sao Paulo, BR (1G)        | 579 Mbits/sec   | 609 Mbits/sec   | 265 ms         

Geekbench 5 Benchmark Test:
---------------------------------
Test            | Value                         
                |                               
Single Core     | 1085                          
Multi Core      | 1981                          
Full Test       | https://browser.geekbench.com/v5/cpu/23855411

Geekbench 6 Benchmark Test:
---------------------------------
Test            | Value                         
                |                               
Single Core     | 1438                          
Multi Core      | 2556                          
Full Test       | https://browser.geekbench.com/v6/cpu/14561868

YABS completed in 17 min 33 sec
```
### 三网回程路由测试

```bash
2025/10/20 21:07:53 正在测试三网回程路由...
国家: JP 城市: Tokyo 服务商: AS3258 xTom Japan Corporation
项目地址: https://github.com/zhanghanyun/backtrace
北京电信 219.141.140.10  测试超时
北京联通 202.106.195.68  联通4837 [普通线路]          
北京移动 221.179.155.161 移动CMI  [普通线路]          
上海电信 202.96.209.133  测试超时
上海联通 210.22.97.1     联通4837 [普通线路]          
上海移动 211.136.112.200 移动CMI  [普通线路]          
广州电信 58.60.188.222   电信163  [普通线路]          
广州联通 210.21.196.6    联通4837 [普通线路]          
广州移动 120.196.165.24  移动CMI  [普通线路]          
成都电信 61.139.2.69     测试超时
成都联通 119.6.6.6       联通4837 [普通线路]          
成都移动 211.137.96.205  移动CMI  [普通线路]          
2025/10/20 21:07:54 测试完成!
```
### 流媒体平台及游戏区域限制测试

```bash
 ** 正在测试IPv4解锁情况 
--------------------------------
 ** 您的网络为: ip (45.129.*.*) 


============[ Multination ]============
 Dazn:                  原生解锁        Yes (Region: JP)
 TikTok:                                Failed
 Disney+:               原生解锁        Yes (Region: JP)
 Netflix:               原生解锁        Yes (Region: JP)
 YouTube Premium:       原生解锁        Yes (Region: JP)
 Amazon Prime Video:    原生解锁        Yes (Region: JP)
 TVBAnywhere+:          原生解锁        Yes
 iQyi Oversea Region:   原生解锁        HK
 YouTube CDN:                           Tokyo 
 Netflix Preferred CDN:                 Tokyo  
 Spotify Registration:  原生解锁        Yes (Region: JP)
 Steam Currency:                        JPY
 ChatGPT:               原生解锁        Yes (Region: JP)
 Google Gemini:         原生解锁        Yes (Region: JPN)
 Bing Region:                           JP
 Wikipedia Editability:                 Yes
 Instagram Licensed Audio:              Failed
 ---Forum---
 Reddit:                                Yes
=======================================


 ** 正在测试IPv6解锁情况 
--------------------------------
 ** 您的网络为: ip (2a12:a304:4:*:*) 


============[ Multination ]============
 Dazn:                                  Failed (Network Connection)
 TikTok:                                Failed
 Disney+:               原生解锁        Yes (Region: JP)
 Netflix:               原生解锁        Yes (Region: JP)
 YouTube Premium:       原生解锁        Yes (Region: JP)
 Amazon Prime Video:                    Unsupported
 TVBAnywhere+:                          Failed (Network Connection)
 iQyi Oversea Region:                   Failed
 YouTube CDN:                           Tokyo 
 Netflix Preferred CDN:                 Tokyo  
 Spotify Registration:  原生解锁        Yes (Region: JP)
 Steam Currency:                        Failed (Network Connection)
 ChatGPT:                               Failed
 Google Gemini:         原生解锁        Yes (Region: JPN)
 Bing Region:                           JP
 Wikipedia Editability:                 Yes
 Instagram Licensed Audio:              Failed
 ---Forum---
 Reddit:                                Failed (Network Connection)
=======================================
本次测试已结束，感谢使用此脚本 
```
