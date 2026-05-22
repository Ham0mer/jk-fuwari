---
title: AnyTLS 技术原理与适用场景
published: 2026-05-23T01:35:57
description: 'AnyTLS 是一种新型 TLS 代理协议，通过灵活的填充策略和连接复用机制，有效缓解 TLS-in-TLS 流量指纹识别问题。'
image: ''
pinned: false
tags: ['AnyTLS', '代理协议', '网络安全']
category: '技术'
draft: false
lang: 'zh-CN'
---

## 什么是 AnyTLS

AnyTLS 是一个开源的 TLS 代理协议，核心目标是解决"TLS-in-TLS"流量指纹识别问题。所谓 TLS-in-TLS，是指代理客户端先与代理服务器建立 TLS 加密隧道，然后再在该隧道内传输用户的 TLS 流量（如 HTTPS），形成嵌套的双层 TLS 结构。这种流量模式具有明显的统计特征，容易被深度包检测（DPI）系统识别并封锁。

AnyTLS 的参考实现使用 Go 编写，目前在 GitHub 上已获得超过 1.3k Star，并已被 sing-box、mihomo 等主流代理工具集成支持。

::github{repo="anytls/anytls-go"}

::github{repo="anytls/sing-anytls"}

---

## 核心技术原理

### 1. 协议层次结构

:::note
所有会话层的通信都在 TLS 加密之上进行，协议本身的控制指令和用户数据均处于加密状态，中间人无法解析。
:::

AnyTLS 的协议栈从底层到上层依次为：

```
TCP → TLS → Session（会话层）→ Stream（流）→ 用户数据
```

所有会话层的通信都在 TLS 加密之上进行，也就是说协议本身的控制指令和用户数据全部处于加密状态，无法被中间人解析。

### 2. 认证流程

TLS 握手完成后，客户端立即发送一个认证包，结构如下：

| 字段 | 长度 | 说明 |
|------|------|------|
| SHA256(password) | 32 字节 | 密码哈希，用于身份验证 |
| Padding0 长度 | 2 字节（大端序） | 初始填充长度 |
| Padding 数据 | 可变 | 随机填充内容 |

服务端验证成功后进入会话循环；验证失败则关闭连接，或回落至 HTTP 服务，以此规避主动探测。

### 3. 帧格式

会话层的数据以帧为单位传输，每帧的结构为：

```
┌──────────┬───────────────┬─────────────┬──────────────┐
│ Command  │   Stream ID   │  Data Len   │     Data     │
│ (1 byte) │   (4 bytes)   │  (2 bytes)  │  (variable)  │
└──────────┴───────────────┴─────────────┴──────────────┘
```

主要命令类型：

| 命令 | 值 | 作用 |
|------|----|------|
| cmdSYN | 1 | 打开新流 |
| cmdPSH | 2 | 传输流数据 |
| cmdFIN | 3 | 关闭流 |
| cmdSettings | 4 | 客户端发送配置 |
| cmdWaste | 0 | 填充帧（服务端忽略） |
| cmdHeartRequest/Response | 8/9 | 心跳保活（v2+） |
| cmdSYNACK | 7 | 服务端确认出站连接状态（v2+） |

### 4. 填充策略（Padding Scheme）

:::important
填充策略是 AnyTLS 规避流量指纹识别的核心机制，也是与其他 TLS 代理协议最显著的差异所在。
:::

这是 AnyTLS 规避流量指纹识别的核心机制。协议通过对前几个数据包注入可变长度的随机填充，破坏 TLS-in-TLS 流量的统计特征。

填充策略的配置语法示例：

```
stop=8
0=30-30
1=100-400
2=400-500,c,500-1000,c
```

- `stop=8`：仅对前 8 个数据包应用填充策略
- `0=30-30`：第 1 个包固定填充 30 字节
- `1=100-400`：第 2 个包随机填充 100～400 字节
- `2=400-500,c,500-1000,c`：第 3 个包先填充 400～500 字节，遇到 `c`（checkpoint）时若用户数据已发完则停止，否则继续填充 500～1000 字节

`c`（checkpoint）机制的意义在于：若在填充过程中用户数据已经发送完毕，则立即停止填充，避免产生"强制填充至固定长度"这一新的可识别特征。

**动态更新机制**：服务端可以通过 `cmdUpdatePaddingScheme` 指令向客户端推送新的填充策略。当默认策略被检测到时，可动态更换，使流量特征持续变化，理论上只有在使用旧默认策略时的第一次连接才可能被捕获。

:::tip
填充策略支持服务端动态下发，无需重启客户端即可更新流量指纹，这是 AnyTLS 相较于同类协议的关键优势之一。
:::

### 5. 连接复用（Session Multiplexing）

AnyTLS 强制要求实现连接复用。复用策略遵循以下原则：

- **优先复用最新的空闲会话**（最高序号优先），减少因会话老化被识别的风险
- **优先清理最老的空闲会话**，节约服务端资源
- 建议空闲超时设置为 60 秒
- 保持一定数量的空闲会话以备下次代理使用

连接复用不仅降低了代理延迟（复用已有 TLS 连接，省去握手时间），也使流量模式更接近正常的 HTTP/2 或 QUIC 复用行为。

### 6. 协议版本演进

**v1**：基础隧道功能，存在超时检测问题。

**v2**（v0.0.8+）：新增以下能力：
- `cmdSYNACK`：服务端主动反馈出站连接是否成功，客户端可据此快速重试
- 主动心跳（`cmdHeartRequest/Response`）：检测并恢复卡死的隧道连接
- `cmdServerSettings`：服务端版本协商，确保向下兼容

版本协商机制保证了新旧客户端/服务端之间的互通性：若版本不匹配，v2 特性自动降级禁用。

---

## URI 配置格式

AnyTLS 定义了标准 URI 格式（参考 Hysteria2 设计），便于在各客户端间通用：

```
anytls://[password@]hostname[:port]/?[key=value]
```

常见参数：

| 参数 | 说明 |
|------|------|
| `sni` | TLS SNI 域名（IP 地址无法作为 SNI） |
| `insecure` | `1` 允许跳过 TLS 证书验证，`0` 为默认严格验证 |

示例：

```
# 标准配置
anytls://mypassword@example.com/?sni=real.example.com

# 测试/跳过证书验证
anytls://mypassword@example.com/?sni=127.0.0.1&insecure=1

# IPv6 + 自定义端口
anytls://0fdf77d7-d4ba-455e-9ed9-a98dd6d5489a@[2409:8a71:6a00:1953::615]:8964/?insecure=1
```

---

## 快速部署

:::warning
AnyTLS 完全依赖 TLS，部署时必须配置有效的 TLS 证书。`insecure=1` 跳过证书验证仅适用于测试环境，生产环境中会显著降低安全性。
:::

### 服务端

```bash
./anytls-server -l 0.0.0.0:8443 -p <password>
```

### 客户端

```bash
# 传统参数形式
./anytls-client -l 127.0.0.1:1080 -s <server-ip:port> -p <password>

# URI 形式（v0.0.12+）
./anytls-client -l 127.0.0.1:1080 -s "anytls://password@host:port"
```

### sing-box 配置示例

**服务端 inbound：**

```json
{
  "type": "anytls",
  "listen": "0.0.0.0",
  "listen_port": 8443,
  "users": [
    { "password": "your-password" }
  ],
  "tls": {
    "enabled": true,
    "certificate_path": "/path/to/cert.pem",
    "key_path": "/path/to/key.pem"
  }
}
```

**客户端 outbound：**

```json
{
  "type": "anytls",
  "server": "example.com",
  "server_port": 8443,
  "password": "your-password",
  "tls": {
    "enabled": true,
    "server_name": "example.com"
  }
}
```

---

## 适用场景

### 适合使用 AnyTLS 的场景

:::tip[高审查强度网络环境]
在对 TLS-in-TLS 流量进行针对性封锁的网络环境中，AnyTLS 的动态填充策略能有效模糊流量特征，降低被识别的概率。
:::

:::tip[需要低延迟代理的场景]
连接复用机制避免了每次请求都重新建立 TLS 握手，对于高频短连接（如大量 HTTPS API 请求）有显著的延迟优化效果。
:::

:::tip[已使用 sing-box / mihomo 的用户]
两款工具均已原生集成 AnyTLS，无需额外部署，配置即用。
:::

:::tip[希望保留回落能力的场景]
AnyTLS 支持认证失败时回落至 HTTP 服务，对主动探测具有一定的伪装能力。
:::

### 不太适合的场景

:::caution
- **轻量级需求**：若网络环境宽松，Shadowsocks、VLESS+TLS 等成熟方案已经足够，引入 AnyTLS 的额外复杂度意义不大。
- **极致性能需求**：填充机制会引入一定的额外流量开销，对带宽敏感型应用有轻微影响。
- **不支持 TLS 的环境**：AnyTLS 完全依赖 TLS，在无法部署证书的场景下不可用。
:::

---

## 与其他协议的横向对比

| 特性 | AnyTLS | VLESS+TLS | Hysteria2 | Trojan |
|------|--------|-----------|-----------|--------|
| 传输层 | TLS over TCP | TLS over TCP | QUIC | TLS over TCP |
| TLS-in-TLS 规避 | ✅ 填充策略 | ❌ | N/A | ❌ |
| 连接复用 | ✅ | 需配合 mux | ✅ | 需配合 mux |
| 动态指纹更新 | ✅ | ❌ | ❌ | ❌ |
| 回落支持 | ✅ | ✅ | ❌ | ✅ |
| 生态成熟度 | 新兴 | 成熟 | 成熟 | 成熟 |

---

## 总结

AnyTLS 的设计思路清晰：将 TLS-in-TLS 流量的最大弱点（可预测的包长分布）作为主要攻克目标，通过灵活的填充策略和服务端动态下发机制，在协议被识别后能快速"换脸"。连接复用则是性能层面的重要补充。

对于在高审查环境中寻找 TLS 伪装方案的用户，AnyTLS 是一个值得关注的新选项，尤其是在已使用 sing-box 或 mihomo 的用户群体中，几乎零成本即可尝试。其生态虽不及 VLESS、Trojan 成熟，但活跃的开发节奏（v2 协议、多语言实现）值得持续关注。

:::note
AnyTLS 目前仍处于快速迭代阶段，建议关注 [anytls-go releases](https://github.com/anytls/anytls-go/releases) 页面跟踪最新版本，默认填充策略会随版本更新。
:::

---

**参考资料**

- [anytls/anytls-go — GitHub](https://github.com/anytls/anytls-go)
- [AnyTLS 协议规范文档](https://github.com/anytls/anytls-go/blob/main/docs/protocol.md)
- [AnyTLS URI 格式规范](https://github.com/anytls/anytls-go/blob/main/docs/uri_scheme.md)
- [Xray-core 社区讨论](https://github.com/XTLS/Xray-core/discussions/4387)
- [anytls/sing-anytls](https://github.com/anytls/sing-anytls)
