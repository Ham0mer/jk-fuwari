---
title: 给fuwari主题添加置顶功能
published: 2025-10-08 21:00:00
description: '本教程详细介绍如何为Fuwari博客主题添加文章置顶功能，包括修改排序逻辑、配置文件和显示标签的完整步骤。'
image: ''
tags: ['fuwari']
category: '教程'
draft: false 
lang: ''
---

## 修改工具文件

### 修改排序逻辑
`src\utils\content-utils.ts`,编辑文件，将 `getSortedPosts` 函数中的排序逻辑修改为：

```js
export async function getSortedPosts() {
	const allBlogPosts = await getCollection("posts", ({ data }) => {
		return import.meta.env.PROD ? data.draft !== true : true;
	});
	const sorted = allBlogPosts.sort((a, b) => {
		// 如果一个是置顶一个不是置顶，置顶的排在前面
		if (a.data.pinned !== b.data.pinned) {
			return a.data.pinned ? -1 : 1;
		}
		// 都是置顶或都不是置顶，按发布日期时间排序（包含小时分钟秒）
		const dateA = new Date(a.data.published);
		const dateB = new Date(b.data.published);
		return dateA > dateB ? -1 : 1;
	});

	for (let i = 1; i < sorted.length; i++) {
		sorted[i].data.nextSlug = sorted[i - 1].slug;
		sorted[i].data.nextTitle = sorted[i - 1].data.title;
	}
	for (let i = 0; i < sorted.length - 1; i++) {
		sorted[i].data.prevSlug = sorted[i + 1].slug;
		sorted[i].data.prevTitle = sorted[i + 1].data.title;
	}
	
	return sorted;
}
```
### 修改文章配置文件
`src\content\config.ts`,在`lang`字段后增加 `pinned` 字段

```js
pinned: z.boolean().optional().default(false),
```

### 修改置顶显示标签

`src\components\PostCard.astro`,此文件需要修改两处。

#### 第一处：添加置顶标签判断

```js
const isPinned = entry.data.pinned === true;
```
#### 第二处：添加置顶标签显示
```js
{isPinned && (
    <span class="inline-flex items-center mr-2 px-2 py-0.5 text-sm font-medium bg-[oklch(97%_0.1_var(--hue))] dark:bg-[oklch(30%_0.1_var(--hue))] text-[oklch(55%_0.1_var(--hue))] dark:text-[oklch(80%_0.1_var(--hue))] rounded">
        <Icon name="material-symbols:push-pin" class="mr-1 text-base" /> 置顶
    </span>
)}
```
