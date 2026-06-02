---
title: Linux 网络排查：TIME_WAIT、偶发丢包与 MTU 黑洞的内核调优实战
published: 2026-05-24T14:31:19
description: '一次诡异的线上网络故障排查笔记。TIME_WAIT 堆积导致服务假死、偶发丢包定位思路、MTU 黑洞引发的"半连通"现象，以及对应的内核参数调优。'
image: ''
pinned: false
tags: ['Linux', '网络', '排查']
category: '运维'
draft: false
lang: 'zh-CN'
---

线上网络故障最难受的不是宕机——宕机至少能快速定位。真正消耗时间的，是那些"看上去都正常但就是不对劲"的玄学问题：TCP 握手成功但传不动数据、curl 偶发卡 5s 然后突然返回、监控显示 0% 丢包但用户喊延迟飙升。这篇文章把我反复踩过的三类网络坑梳理一下，配上排查命令和内核参数调优。

---

## 故事：从一个"假死"的服务说起

某天凌晨告警炸了：一个对外的 HTTP API 网关在持续 5xx，但进程没挂，CPU、内存、磁盘 IO 都健康，业务日志也没有报错堆栈。SSH 上去 `curl 127.0.0.1` 是好的，从外网请求却几乎全部超时。

第一反应是查连接数：

```bash
ss -s
```

```text title="输出节选"
Total: 142
TCP:   65823 (estab 312, closed 65498, orphaned 0, timewait 65497)

Transport Total     IP        IPv6
TCP       325       213       112
UDP       12        8         4
```

`timewait 65497`——TIME_WAIT 已经把可用端口塞满了。这就是后面要讲的第一个坑。直观感受一下：

```text
 本地端口范围   32768 ───────────────────────────── 60999
                ┌──────────────────────────────────────┐
 端口占用       │ ████████████████████████████████████ │  ← TIME_WAIT 把池子吃光
                └──────────────────────────────────────┘
                                  │
                                  ▼
                  新连接 connect() → EADDRNOTAVAIL
                  curl / 业务调用看到的就是"超时 / 失败"
```

:::tip
排查网络问题之前，先做一件事：在脑子里把 OSI 七层从下到上过一遍，每一层问自己"这里能挂吗"。从物理层（网卡 / MTU）到传输层（TCP 状态、端口、conntrack）再到应用层（重试、超时），按层定位比拍脑袋猜要快得多。
:::

---

## 坑一：TIME_WAIT 堆积导致服务"假死"

### 现象

- 服务进程活着、CPU 不高
- 本地回环正常，外部请求大量超时或 `Connection reset`
- `ss -s` 看到 TIME_WAIT 数万甚至几十万
- `dmesg` 里出现 `TCP: time wait bucket table overflow` 或 `kernel: nf_conntrack: table full`

### 原理速记

TCP 主动关闭方在四次挥手后会进入 **TIME_WAIT** 状态，停留 `2 * MSL`（Linux 内核里写死了 60 秒，对应 `TCP_TIMEWAIT_LEN`）：

```text
   主动关闭方                          被动关闭方
   ──────────                          ──────────
  ESTABLISHED                         ESTABLISHED
       │                                   │
       │ ───────── FIN ──────────────▶     │
  FIN_WAIT_1                               │
       │ ◀───────── ACK ──────────────     │ CLOSE_WAIT
  FIN_WAIT_2                               │  (应用还没 close)
       │                                   │
       │ ◀───────── FIN ──────────────     │ LAST_ACK
       │ ───────── ACK ──────────────▶     │
   TIME_WAIT                            CLOSED
       │
       │   2 × MSL = 60s
       │   ↑ 等待两个 MSL，确保：
       │     ① 最后那个 ACK 真的送达
       │     ② 旧连接的迟到报文在网络中自然消亡
       ▼
    CLOSED
```

这个等待是必要的，目的是：

1. 让网络中迟到的报文有机会被丢弃，避免污染下一个相同四元组的连接
2. 保证被动关闭方收得到最后一个 ACK

正常场景下 TIME_WAIT 完全无害。出问题的是这种模式：**本机作为客户端短连接大量主动关闭**（典型场景：API 网关回源、PHP-FPM 调外部 HTTP 服务、爬虫）。

每个 TIME_WAIT 占用一个四元组（`本地 IP + 本地端口 + 远端 IP + 远端端口`）。如果回源目标固定，那相当于本地端口范围被吃光：

```bash
sysctl net.ipv4.ip_local_port_range
# net.ipv4.ip_local_port_range = 32768  60999
```

默认能用的端口只有约 28k 个，对一个高并发回源的网关来说撑不了多久。

### 排查命令

```bash
# 查看各状态连接数
ss -ant | awk 'NR>1 {print $1}' | sort | uniq -c | sort -rn

# 看 TIME_WAIT 都集中在哪个对端（确认是不是单点回源）
ss -ant state time-wait | awk '{print $5}' | cut -d: -f1 | sort | uniq -c | sort -rn | head

# 看本地端口耗尽情况
ss -s
cat /proc/net/sockstat
```

```text title="/proc/net/sockstat 关键字段"
sockets: used 65800
TCP: inuse 312 orphan 0 tw 65497 alloc 65812 mem 4123
```

`tw` 字段就是 TIME_WAIT 总数，`alloc` 是已分配的 socket 数，逼近 `net.ipv4.tcp_max_tw_buckets` 时就要警惕了。

### 调优

把以下参数加到 `/etc/sysctl.d/99-network.conf`，`sysctl -p` 生效：

```ini title="/etc/sysctl.d/99-network.conf"
# 扩大本地端口范围
net.ipv4.ip_local_port_range = 1024 65535

# 允许重用 TIME_WAIT 状态的端口给新的出向连接（依赖时间戳）
net.ipv4.tcp_tw_reuse = 1

# TIME_WAIT 桶上限，超过即直接销毁，避免内核打日志
net.ipv4.tcp_max_tw_buckets = 262144

# 时间戳必须打开，tcp_tw_reuse 才有效
net.ipv4.tcp_timestamps = 1
```

:::warning
不要再用 `net.ipv4.tcp_tw_recycle`。这个参数从 Linux 4.12 起已经被**完全移除**——它依赖时间戳做快速回收，在客户端经过 NAT 时会因时间戳乱序丢连接，是经典坑。能调的只有 `tcp_tw_reuse`。
:::

:::important
`tcp_tw_reuse` 只对**主动发起连接（客户端方向）**有效。监听端口收到的入向 TIME_WAIT 它管不着。如果是服务端 TIME_WAIT 堆积，要解决的是"为什么是服务端主动关闭"——通常是长连接被错误地关掉，或者应用层 keep-alive 没启用。
:::

应用层能做的事：

- 开启 **HTTP keep-alive**（连接复用），nginx 上游加 `keepalive 256;`
- 用**连接池**而不是每次新建（Go `http.Client` 一定要全局复用，Python 用 `requests.Session`）
- 协议允许就走长连接（gRPC / WebSocket / 数据库连接池）

---

## 坑二：偶发丢包——监控显示 0%，但用户在喊延迟

这是最折磨人的一类问题，因为它不是"完全坏"，是"偶尔坏"。

排查之前先建立一张"包从网线到应用"的全景图，每一层都可能默默丢包，下面的 5 个步骤就是按这张图自底向上走的：

```text
 ┌──────────────────────────────────────────────────────────────┐
 │  应用层                                                       │
 │     ┌──────────────┐                                         │
 │     │  accept() 队列│  ← 第 2 步：ListenOverflows / Backlog drop
 │     └──────┬───────┘                                         │
 ├────────────┼─────────────────────────────────────────────────┤
 │  传输层    │   TCP / UDP                                      │
 │     ┌──────▼───────┐    ┌──────────┐                         │
 │     │ recv buffer  │    │ SYN 队列  │  ← TcpExtListenDrops    │
 │     └──────────────┘    └──────────┘                         │
 ├──────────────────────────────────────────────────────────────┤
 │  网络层 / netfilter                                           │
 │     ┌────────────────────┐                                   │
 │     │ conntrack 表       │  ← 第 3 步：table full → 静默丢包   │
 │     └────────────────────┘                                   │
 │     ┌────────────────────┐                                   │
 │     │ iptables / nftables│  ← DROP / REJECT                  │
 │     └────────────────────┘                                   │
 ├──────────────────────────────────────────────────────────────┤
 │  软中断 (softirq / RPS)                                       │
 │     ┌────────────────────┐                                   │
 │     │ per-CPU backlog    │  ← netdev_max_backlog 满          │
 │     └────────────────────┘                                   │
 ├──────────────────────────────────────────────────────────────┤
 │  网卡驱动                                                     │
 │     ┌────────────────────┐                                   │
 │     │ RX ring buffer     │  ← 第 1 步：rx_dropped / fifo_err  │
 │     └────────────────────┘                                   │
 ├──────────────────────────────────────────────────────────────┤
 │  物理网卡 / 线缆                                              │
 │     ←───────────── 报文从这里进来 ─────────────               │
 └──────────────────────────────────────────────────────────────┘
                                          ↑
                                     抓不到包就上 tcpdump (第 4 步)
                                     还是定位不到就 dropwatch (第 5 步)
```

### 第 1 步：先看网卡层有没有丢

```bash
# 看接口统计：errors / dropped 是关键
ip -s link show eth0

# 网卡硬件层统计（更细，包含 rx_no_buffer 等）
ethtool -S eth0 | grep -Ei 'drop|err|miss|fifo'

# 看 ring buffer 是否打满
ethtool -g eth0
```

如果 `rx_dropped`、`rx_fifo_errors`、`rx_missed_errors` 在涨，说明**网卡 ring buffer 不够大**或者 **softirq 处理不过来**。前者改 ring buffer：

```bash
# 当前可能是 256/256，最大支持看 "Pre-set maximums"
ethtool -G eth0 rx 4096 tx 4096
```

后者是 CPU/中断的问题：单队列网卡所有中断打到一个 CPU，那个核飙到 100% si（软中断）就开始丢包。检查：

```bash
# 看 softirq 是否倾斜
mpstat -P ALL 1

# 看中断在哪个 CPU
cat /proc/interrupts | grep eth0
```

解决方案：开启 **RPS（Receive Packet Steering）** 或 **RSS（多队列）**，把软中断分散到多核：

```bash
# 把 eth0 的 rx 队列 0 的软中断分散到 CPU 0-7
echo ff > /sys/class/net/eth0/queues/rx-0/rps_cpus
```

### 第 2 步：协议栈是不是在丢

```bash
# TCP/UDP/IP 层各种异常计数器（强烈推荐）
nstat -az | grep -Ei 'drop|retrans|listen|overflow|prune'

# 老牌工具，等价信息
netstat -s | grep -Ei 'drop|retrans|listen|overflow|prune'
```

重点看几个字段：

| 字段 | 含义 |
| :--- | :--- |
| `TcpExtListenOverflows` | accept 队列溢出，应用层 accept 不及时 |
| `TcpExtListenDrops` | SYN 队列或 accept 队列丢 SYN |
| `TcpExtTCPBacklogDrop` | 已建连但 socket 缓冲区满，包被丢 |
| `TcpExtPruneCalled` / `TCPRcvCollapsed` | 接收缓冲区不够，触发回收，性能急剧下降 |
| `TcpRetransSegs` | 重传段，对照基线看是否飙升 |
| `IpReasmFails` | IP 分片重组失败（提示 MTU 问题，见坑三）|

`ListenOverflows` 涨说明应用 accept 慢了，调大队列：

```ini
net.core.somaxconn = 65535
net.ipv4.tcp_max_syn_backlog = 65535
```

应用层也要配套，nginx 的 `listen 80 backlog=65535;`、Go `net.Listen` 后的 `ListenConfig{KeepAlive}`、Java Netty 的 `SO_BACKLOG` 都要设。

### 第 3 步：conntrack 表满

这个特别隐蔽，**会让数据包"无声"地被丢，应用层完全感知不到**：

```bash
# 当前 conntrack 数 / 上限
cat /proc/sys/net/netfilter/nf_conntrack_count
cat /proc/sys/net/netfilter/nf_conntrack_max

# dmesg 里搜 "table full"
dmesg | grep -i conntrack
```

`nf_conntrack: table full, dropping packet` 出现就说明已经在丢。调大：

```ini
net.netfilter.nf_conntrack_max = 1048576
net.netfilter.nf_conntrack_buckets = 262144   # 通常设为 max 的 1/4
net.netfilter.nf_conntrack_tcp_timeout_established = 600
```

:::caution
如果机器只是单纯做转发或者根本不需要 NAT，可以直接 `modprobe -r nf_conntrack` 或在 iptables 里给关键链加 `NOTRACK`，比调大表更治本。但前提是你不用 docker / k8s 默认的 SNAT，否则关掉会炸网络。
:::

### 第 4 步：抓包确认

到这一步还没结论，就上 `tcpdump`：

```bash
# 抓特定对端的所有包，写到文件方便 Wireshark 分析
tcpdump -i eth0 -nn -s 0 -w /tmp/cap.pcap host 10.0.0.5 and port 443

# 只看 SYN 和 RST，定位握手问题
tcpdump -i eth0 -nn 'tcp[tcpflags] & (tcp-syn|tcp-rst) != 0'

# 实时看重传（粗略）
tcpdump -i eth0 -nn -A 'tcp[13] & 0x04 != 0 or tcp[13] & 0x02 != 0'
```

Wireshark 里看 `tcp.analysis.retransmission`、`tcp.analysis.duplicate_ack`、`tcp.analysis.zero_window`，比命令行直观得多。

:::tip
线上抓包加 `-s 0 -w` 必加 `host` / `port` 过滤，否则 pcap 文件能在分钟内吃光磁盘。还有个更好的工具是 `tcpdump -i eth0 -nn ... | head -1000`，限制行数防止刷屏。
:::

### 第 5 步：内核层面看丢包点

如果以上都没线索，用 `dropwatch` 直接定位是内核哪一行代码丢的包：

```bash
dropwatch -l kas
> start
# ...几秒后
> stop
```

输出会告诉你 `tcp_v4_rcv+0x1b3/0x500` 之类的具体函数。对深度排查很有用，但门槛较高，作为最后手段。

---

## 坑三：MTU 黑洞——能 ping 通但传文件卡死

这是最玄学的一个。现象典型组合：

- `ping` 对端正常，**延迟也不高**
- `curl` 拉小页面 200 OK
- 一旦响应体变大（比如 10KB+）就卡死、超时
- SSH 登录能连上，敲命令到一半再回车就没反应了

九成是 **MTU 不匹配 + ICMP 被防火墙吞了**，也就是教科书上说的 **Path MTU Discovery 黑洞**。

```text
                  ┌──── 中间链路 MTU = 1400 ────┐
   Client                                          Server
   MTU=1500  ──── 物理网卡 ────  ──── 物理网卡 ──── MTU=1500

   ① 小包 (1200B, DF=1)
      ────●─────────────────────────────●────▶   ✓ 顺利通过

   ② 大包 (1500B, DF=1)
      ────●─────────╳                   ●        ✗ 在中间链路被丢
                    │
                    │  路由器本应回送 ICMP Type 3 Code 4
                    ▼  "Fragmentation Needed, MTU=1400"
                    ╳  被防火墙整段 ban 掉 ICMP → 发送方完全不知情
                          │
                          ▼
                    持续按 1500 重传 → 应用层看到的现象就是
                    "能 ping 通、能建连、一传大包就卡死"
```

### 原理

TCP 协商时会基于本地 MTU 算 MSS（`MSS = MTU - 40`），一张图看清各字段在以太帧里占的位置：

```text
 ┌──── Ethernet 帧 (链路层) ─────────────────────────────────────┐
 │ DMAC 6│ SMAC 6│ Type 2│           Payload ≤ MTU (默认1500)    │
 └───────┴───────┴───────┴───────────────────────────────────────┘
                         │
                         ▼
                ┌──── IP 包  (MTU = 1500) ───────────────────────┐
                │ IP 头 20  │ TCP 头 20 │   TCP 数据 ≤ MSS = 1460 │
                └───────────┴───────────┴─────────────────────────┘
                                         ↑
                          MSS = MTU − IP头(20) − TCP头(20) = 1460
                          IPv6 / TCP 时间戳选项启用时再各扣几字节
```

当数据包经过中间链路（VPN、隧道、运营商 PPPoE）时，链路 MTU 可能比两端都小。本来应该靠 ICMP `Fragmentation Needed (Type 3, Code 4)` 通知发送方降低分片大小，但很多防火墙傻乎乎把所有 ICMP 全 ban 了，于是发送方既不知道要分片，又因为 IP 头有 DF 标记不能在中间分片——大包就这样被静默吞掉。

**为什么小包没事**？因为小包没超过中间最小 MTU，根本走得过去。

### 排查

最简单的方法：手动试探 PMTU。

```bash
# -M do：禁止分片；-s 1472：1472 + 28(ICMP+IP) = 1500 字节
ping -M do -s 1472 target.example.com

# 如果上面失败，逐步减小，直到通过
ping -M do -s 1400 target.example.com
ping -M do -s 1300 target.example.com
```

找到能通过的最大 `-s` 值，加 28 就是路径 MTU。

或者用 `tracepath`，自动探测：

```bash
tracepath target.example.com
```

```text title="输出示例"
 1?: [LOCALHOST]                      pmtu 1500
 1:  10.0.0.1                                          0.523ms 
 1:  10.0.0.1                                          0.491ms 
 2:  ...                                               1.234ms pmtu 1400
 3:  target.example.com                                3.456ms reached
```

`pmtu 1400` 这一跳就是瓶颈。

抓包视角看就更明显：

```bash
tcpdump -i eth0 -nn -vv 'icmp[icmptype] = 3'
```

看不到 ICMP Type 3 → 中间防火墙吞了 → PMTU 黑洞实锤。

### 修复

**方案 A：调小本机 MTU**（兜底，但治标不治本）：

```bash
ip link set eth0 mtu 1400
```

**方案 B：在路由表上钉死 MSS**（推荐，对特定目标生效）：

```bash
# 通过 iptables 在 SYN 上 clamp MSS
iptables -t mangle -A FORWARD -p tcp --tcp-flags SYN,RST SYN \
  -j TCPMSS --clamp-mss-to-pmtu
```

对 VPN/WireGuard/IPSec 场景几乎是必配。WireGuard 默认 MTU 1420，对端如果走再套一层 GRE 之类还得继续减。

**方案 C：开启 TCP MTU Probing**，让内核自己探测：

```ini
net.ipv4.tcp_mtu_probing = 1
net.ipv4.tcp_base_mss = 1024
```

`tcp_mtu_probing = 1` 是"只在检测到黑洞时启用"，比较保守；`= 2` 是"始终启用"。建议从 1 开始。

:::important
做 Overlay 网络（Docker、k8s CNI、VXLAN、IPIP）时，永远要意识到内层 MTU 会比物理网卡小。VXLAN 头 50 字节，所以物理 MTU 1500 时内层应该是 1450。Flannel、Calico 默认会处理这件事，但自建隧道时常常忘掉。
:::

---

## 内核参数调优清单

把上面散落的参数汇总成一份可以直接抄的模板，放在 `/etc/sysctl.d/99-network.conf`：

```ini title="/etc/sysctl.d/99-network.conf"
# ===== 连接管理 =====
net.ipv4.ip_local_port_range = 1024 65535
net.ipv4.tcp_tw_reuse = 1
net.ipv4.tcp_max_tw_buckets = 262144
net.ipv4.tcp_timestamps = 1
net.ipv4.tcp_fin_timeout = 15

# ===== 队列与缓冲区 =====
net.core.somaxconn = 65535
net.core.netdev_max_backlog = 32768
net.ipv4.tcp_max_syn_backlog = 65535
net.ipv4.tcp_syncookies = 1

# ===== 收发缓冲区（按需，大带宽延迟积场景才调） =====
net.core.rmem_max = 16777216
net.core.wmem_max = 16777216
net.ipv4.tcp_rmem = 4096 87380 16777216
net.ipv4.tcp_wmem = 4096 65536 16777216

# ===== 拥塞控制 =====
net.core.default_qdisc = fq
net.ipv4.tcp_congestion_control = bbr

# ===== conntrack（NAT / 转发场景）=====
net.netfilter.nf_conntrack_max = 1048576
net.netfilter.nf_conntrack_tcp_timeout_established = 600

# ===== MTU 探测 =====
net.ipv4.tcp_mtu_probing = 1

# ===== Keepalive（让僵尸连接更快被清理）=====
net.ipv4.tcp_keepalive_time = 600
net.ipv4.tcp_keepalive_intvl = 30
net.ipv4.tcp_keepalive_probes = 3
```

应用：

```bash
sysctl -p /etc/sysctl.d/99-network.conf
```

:::warning
**不要照搬**。这份参数适合"高并发、对外提供服务的 Linux 主机"。如果你的机器是数据库、做 NAT 网关、还是单纯桌面，每一项都要按场景判断。比如把 `rmem_max` 调到 16M 在低 BDP（带宽延迟积）链路上反而浪费内存。
:::

---

## 常用排查命令速查

按"看哪一层"组织，故障来时按顺序敲：

```bash title="物理 / 链路层"
ip -s link show eth0                   # 接口收发计数、错误统计
ethtool eth0                           # 协商速率、双工
ethtool -S eth0 | grep -i err          # 网卡硬件错误
ethtool -g eth0                        # ring buffer 大小
dmesg -T | tail -50                    # 网卡 reset / 链路抖动
```

```bash title="网络 / 路由层"
ip route                               # 路由表
ip neigh                               # ARP / NDP 邻居
ping -M do -s 1472 <host>              # PMTU 探测
mtr -rwn <host>                        # 持续 traceroute，看丢包点
tracepath <host>                       # 自动 PMTU 探测
```

```bash title="传输层 / 协议栈"
ss -ant                                # 所有 TCP，比 netstat 快得多
ss -anti                               # 加 -i 看每个连接的拥塞窗口、RTT
ss -ltnp                               # 监听端口 + 进程
ss -s                                  # 各状态汇总
nstat -az                              # 协议栈计数器（推荐）
netstat -s                             # 同上，老牌
cat /proc/net/sockstat                 # socket / TIME_WAIT 总览
```

```bash title="防火墙 / NAT"
iptables -L -vn --line-numbers
nft list ruleset
cat /proc/sys/net/netfilter/nf_conntrack_count
conntrack -L                           # 当前所有连接追踪记录
```

```bash title="抓包 / 深度"
tcpdump -i eth0 -nn -s 0 -w cap.pcap host X
tshark -i eth0 -Y 'tcp.analysis.retransmission'
dropwatch -l kas                       # 内核丢包点定位
bpftrace -e 'kprobe:tcp_drop { @[kstack] = count(); }'
```

---

## 总结

线上网络问题之所以"玄学"，是因为表象（应用层报错）和根因（内核状态、链路 MTU、conntrack 表）之间有好几层间接关系。一旦养成"按层排查"的肌肉记忆，绝大多数所谓诡异问题都会变成可复现、可解释的事故。

收尾建议：

1. **基线监控比事中救火更重要**。把 `ss -s`、`nstat`、`conntrack_count`、`net_dropped` 拉到监控里，比出事后再去看真实数据有价值得多
2. **不要迷信"重启就好了"**。能重启好的问题大多是参数 / 资源耗尽问题，下一次它一定会再来
3. **改内核参数前先记下原值**。`sysctl net.ipv4.tcp_tw_reuse` 看到旧值再改，回滚才有依据
4. **应用层和内核层一起调**。`somaxconn = 65535` 但 nginx `backlog` 默认 511，等于白调

最后一句话：**`tcp_tw_recycle` 永远不要碰，永远。**
