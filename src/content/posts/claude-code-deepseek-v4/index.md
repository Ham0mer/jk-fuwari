---
title: Claude Code 对接 DeepSeek V4 Pro 完整指南
published: 2026-05-23T12:49:50
description: 'Claude Code CLI 和 VSCode 插件对接 DeepSeek V4 Pro 的配置详解，包含环境变量、模型映射和常见问题。'
image: ''
pinned: false
tags: ['Claude Code', 'DeepSeek', 'AI', '工具']
category: 教程
draft: false
lang: 'zh-CN'
---

Claude Code 是 Anthropic 推出的命令行 AI 编程助手，深度集成在终端和 VSCode 中。虽然它默认使用 Anthropic 自家的 Claude 模型，但通过 DeepSeek 提供的 Anthropic 兼容 API，我们可以用 DeepSeek V4 Pro 来驱动 Claude Code，大幅降低成本（约 99%）。

## 1. Claude Code CLI 对接 DeepSeek V4 Pro

### 1.1 安装 Claude Code

首先确保安装了 Node.js 18+，然后全局安装 Claude Code：

```bash
npm install -g @anthropic-ai/claude-code
```

验证安装：

```bash
claude --version
```

### 1.2 配置环境变量

DeepSeek 提供了一个兼容 Anthropic API 的端点 `https://api.deepseek.com/anthropic`，只需设置几个环境变量即可让 Claude Code 指向 DeepSeek。

在 `~/.zshrc`（或 `~/.bashrc`）中添加：

```bash
export ANTHROPIC_BASE_URL="https://api.deepseek.com/anthropic"
export ANTHROPIC_AUTH_TOKEN="<你的 DeepSeek API Key>"
export ANTHROPIC_MODEL="deepseek-v4-pro[1m]"
export ANTHROPIC_DEFAULT_OPUS_MODEL="deepseek-v4-pro[1m]"
export ANTHROPIC_DEFAULT_SONNET_MODEL="deepseek-v4-pro[1m]"
export ANTHROPIC_DEFAULT_HAIKU_MODEL="deepseek-v4-flash"
export CLAUDE_CODE_SUBAGENT_MODEL="deepseek-v4-flash"
export CLAUDE_CODE_EFFORT_LEVEL="max"
```

使配置生效：

```bash
source ~/.zshrc
```

### 1.3 环境变量说明

| 变量 | 值 | 说明 |
|---|---|---|
| `ANTHROPIC_BASE_URL` | `https://api.deepseek.com/anthropic` | DeepSeek 的 Anthropic 兼容端点 |
| `ANTHROPIC_AUTH_TOKEN` | 你的 API Key | 在 [DeepSeek Platform](https://platform.deepseek.com/api_keys) 获取 |
| `ANTHROPIC_MODEL` | `deepseek-v4-pro[1m]` | 主力模型，适合复杂代码分析 |
| `ANTHROPIC_DEFAULT_HAIKU_MODEL` | `deepseek-v4-flash` | 轻量模型，适合简单任务 |
| `CLAUDE_CODE_SUBAGENT_MODEL` | `deepseek-v4-flash` | 子 Agent 使用 Flash 以节省成本 |
| `CLAUDE_CODE_EFFORT_LEVEL` | `max` | 最高努力级别 |

### 1.4 模型选择

DeepSeek V4 系列目前提供两个模型：

- **`deepseek-v4-pro[1m]`**：主力模型，1M 上下文窗口，适合复杂代码分析、大型项目重构、多文件编辑
- **`deepseek-v4-flash`**：快速轻量模型，适合日常问答、简单代码修改、子 Agent 任务

### 1.5 启动使用

配置完成后，在项目目录下直接运行：

```bash
cd /path/to/your-project
claude
```

即可进入 Claude Code 交互界面，底层已经切换为 DeepSeek V4 Pro。

## 2. VSCode 插件对接 DeepSeek V4 Pro

在 VSCode 中使用 Claude Code 插件对接 DeepSeek，配置方式略有不同——需要通过 VSCode 的 `settings.json` 来注入环境变量。

### 2.1 安装插件

在 VSCode 扩展市场搜索 **Claude Code**（作者：Anthropic），点击安装。

### 2.2 配置 settings.json

打开 VSCode 设置（`Cmd+Shift+P` → `Preferences: Open User Settings (JSON)`），添加以下配置：

```json
{
  "claudeCode.environmentVariables": [
    {
      "name": "ANTHROPIC_BASE_URL",
      "value": "https://api.deepseek.com/anthropic"
    },
    {
      "name": "ANTHROPIC_AUTH_TOKEN",
      "value": "<你的 DeepSeek API Key>"
    },
    {
      "name": "ANTHROPIC_MODEL",
      "value": "deepseek-v4-pro[1m]"
    },
    {
      "name": "ANTHROPIC_DEFAULT_OPUS_MODEL",
      "value": "deepseek-v4-pro[1m]"
    },
    {
      "name": "ANTHROPIC_DEFAULT_SONNET_MODEL",
      "value": "deepseek-v4-pro[1m]"
    },
    {
      "name": "ANTHROPIC_DEFAULT_HAIKU_MODEL",
      "value": "deepseek-v4-flash"
    },
    {
      "name": "CLAUDE_CODE_SUBAGENT_MODEL",
      "value": "deepseek-v4-flash"
    },
    {
      "name": "CLAUDE_CODE_EFFORT_LEVEL",
      "value": "max"
    }
  ]
}
```

> **注意**：`ANTHROPIC_AUTH_TOKEN` 的值换成你自己的 DeepSeek API Key。API Key 可以在 [platform.deepseek.com/api_keys](https://platform.deepseek.com/api_keys) 创建。

### 2.3 切换模型

配置完成后重启 VSCode，打开 Claude Code 面板，可以通过以下方式切换模型：

- 使用快捷键打开命令面板，输入 `Claude Code: Switch Model`
- 或在对话中输入 `/model` 选择模型

日常使用建议：
- 复杂任务（代码分析、重构）→ `deepseek-v4-pro[1m]`
- 简单问答、小修改 → `deepseek-v4-flash`

### 2.4 验证配置

在 Claude Code 面板中输入「你当前使用的是哪个模型？」，如果返回 DeepSeek 相关信息，说明配置成功。

## 注意事项

- **环境变量不要放在 `.env` 文件中**。Claude Code 不读取项目 `.env` 文件，必须通过 shell 配置文件（CLI 方式）或 VSCode 设置（插件方式）注入。
- **API Key 安全**。不要将 API Key 硬编码在项目文件中，确保 `.zshrc` 或 `settings.json` 不会被提交到公开仓库。
- **工具调用能力**。DeepSeek 在工具调用（tool calling）方面与原生 Claude 模型存在差距，部分复杂的多步骤操作可能需要更多调试。
- **模型名称中的 `[1m]`**。这是 DeepSeek 官方文档中 `deepseek-v4-pro` 的完整名称后缀，如果接口报错可以尝试去掉该后缀。
