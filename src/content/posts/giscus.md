---
title: 给fuwari主题添加giscus评论区
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

打开[giscus官网](https://giscus.app/)，填入仓库地址。
自动生成下面的配置文件

```js
<script src="https://giscus.app/client.js"
        data-repo="Ham0mer/giscus-fuwari"
        data-repo-id="xxxx"
        data-category="General"
        data-category-id="xxxx"
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
在 `src\components\misc` 目录下面创建 `GiscusComment.astro`,将下方代码粘贴进去不需要修改。
![image.png](https://img.cii.li/v2/K9GsJDL.png)

```js title="GiscusComment.astro"
---
interface Props {
  repo: string;
  repoId: string;
  category: string;
  categoryId: string;
  mapping?: string;
  reactionsEnabled?: boolean;
  emitMetadata?: boolean;
  inputPosition?: 'top' | 'bottom';
  lang?: string;
}

const {
  repo,
  repoId,
  category,
  categoryId,
  mapping = 'pathname',
  reactionsEnabled = true,
  emitMetadata = false,
  inputPosition = 'bottom',
  lang = 'zh-CN'
} = Astro.props;
---

<div id="giscus-container"></div>

<script define:vars={{ repo, repoId, category, categoryId, mapping, reactionsEnabled, emitMetadata, inputPosition, lang }}>
  function loadGiscus() {
    const container = document.getElementById('giscus-container');
    if (!container) return;

    // 获取当前主题
    const isDark = document.documentElement.classList.contains('dark');
    const theme = isDark ? 'dark' : 'light';

    // 创建Giscus脚本
    const script = document.createElement('script');
    script.src = 'https://giscus.app/client.js';
    script.setAttribute('data-repo', repo);
    script.setAttribute('data-repo-id', repoId);
    script.setAttribute('data-category', category);
    script.setAttribute('data-category-id', categoryId);
    script.setAttribute('data-mapping', mapping);
    script.setAttribute('data-strict', '0');
    script.setAttribute('data-reactions-enabled', reactionsEnabled ? '1' : '0');
    script.setAttribute('data-emit-metadata', emitMetadata ? '1' : '0');
    script.setAttribute('data-input-position', inputPosition);
    script.setAttribute('data-theme', theme);
    script.setAttribute('data-lang', lang);
    script.setAttribute('data-loading', 'lazy');
    script.crossOrigin = 'anonymous';
    script.async = true;

    container.appendChild(script);
  }

  // 监听主题变化
  function updateGiscusTheme() {
    const giscusFrame = document.querySelector('iframe[src*="giscus"]');
    if (giscusFrame) {
      const isDark = document.documentElement.classList.contains('dark');
      const theme = isDark ? 'dark' : 'light';

      giscusFrame.contentWindow.postMessage({
        giscus: {
          setConfig: {
            theme: theme
          }
        }
      }, 'https://giscus.app');
    }
  }

  // 监听DOM变化来检测主题切换
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
        updateGiscusTheme();
      }
    });
  });

  // 页面加载时初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadGiscus);
  } else {
    loadGiscus();
  }

  // 开始观察主题变化
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class']
  });
</script>
```

### 通用引入方法

例如我准备在文章页面引入评论，编辑 `src\pages\posts\[...slug].astro` 文件

头部引入刚刚创建的文件

```js
import GiscusComment from "../../components/misc/GiscusComment.astro";
```

在下方找到你想放评论区的位置，粘贴下方代码

```js
<GiscusComment repo="csl0p/jksb" repoId="xxx" category="Announcements" categoryId="xxx" />
```