---
title: Fuwari 主题：集成 Giscus 评论区
published: 2025-10-08
description: '本教程详细介绍如何为Fuwari博客主题集成giscus评论系统，包括GitHub仓库配置、giscus设置、创建评论组件以及在文章页面中引入评论区的完整步骤。'
image: ''
tags: ['giscus','fuwari']
category: '教程'
draft: false 
lang: ''
---

## giscus简介
giscus 加载时，会使用 GitHub Discussions 搜索 API 根据选定的映射方式（如 `URL`、`pathname`、`<title>` 等）来查找与当前页面关联的 discussion。如果找不到匹配的 discussion，giscus bot 就会在第一次有人留下评论或回应时自动创建一个 discussion。


## 配置Github

- 该仓库是[公开](https://docs.github.com/en/github/administering-a-repository/managing-repository-settings/setting-repository-visibility#making-a-repository-public)的，否则访客将无法查看 discussion。
- [giscus app](https://github.com/apps/giscus) 已安装，否则访客将无法评论和回应。
- Discussions 功能已在你的[仓库中启用](https://docs.github.com/en/github/administering-a-repository/managing-repository-settings/enabling-or-disabling-github-discussions-for-a-repository)。

## 配置giscus

打开[giscus官网](https://giscus.app/)，填入仓库地址，选择 Discussion 分类和映射方式后，页面会自动生成配置脚本。其中 `data-repo-id` 和 `data-category-id` 是 giscus 根据你填写的仓库和分类自动生成的唯一标识，直接复制即可。

```html
<script src="https://giscus.app/client.js"
        data-repo="Ham0mer/giscus-fuwari"
        data-repo-id="R_kgDOP-iBJw"
        data-category="Announcements"
        data-category-id="DIC_kwDOP-iBJ84CwZLW"
        data-mapping="pathname"
        data-strict="0"
        data-reactions-enabled="1"
        data-emit-metadata="0"
        data-input-position="bottom"
        data-theme="preferred_color_scheme"
        data-lang="zh-CN"
        crossorigin="anonymous"
        async>
</script>
```

## 创建/修改fuwari文件

### 创建GiscusComment

在 `src/components/misc/` 目录下创建 `GiscusComment.astro`。该组件接收 `repo`、`repoId`、`category`、`categoryId` 等参数，动态加载 giscus 脚本，并监听主题变化自动切换 giscus 的亮/暗主题。

组件代码可参考项目仓库中的 [GiscusComment.astro](https://github.com/Ham0mer/jk-fuwari/blob/master/src/components/misc/GiscusComment.astro)，核心逻辑：

- 根据页面 `dark` class 判断当前主题色，传给 giscus
- 通过 `MutationObserver` 监听主题切换，用 `postMessage` 通知 giscus iframe 更新主题

### 引入到文章页面

编辑 `src/pages/posts/[...slug].astro`，在文件头部引入组件：

```js
import GiscusComment from "../../components/misc/GiscusComment.astro";
```

在文章内容下方（License 之后、上一篇/下一篇导航之前）放入评论区：

```js
<GiscusComment
    repo="Ham0mer/giscus-fuwari"
    repoId="R_kgDOP-iBJw"
    category="Announcements"
    categoryId="DIC_kwDOP-iBJ84CwZLW"
/>
```

`repoId` 和 `categoryId` 即上一步 giscus 官网生成的对应值，替换为你自己的即可。
