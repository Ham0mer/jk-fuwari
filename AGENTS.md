# 仓库指南

## 项目结构与模块组织

这是一个 Astro 5 博客/主题项目，使用 Svelte、Tailwind、Stylus 和 Markdown 内容。应用代码位于 `src/`：路由在 `src/pages`，布局在 `src/layouts`，UI 组件在 `src/components`，工具函数在 `src/utils`，类型定义在 `src/types`，国际化文案在 `src/i18n`，内容在 `src/content`。博客文章使用 `src/content/posts/<slug>/index.md`，文章本地图片放在同一文章目录旁。静态文件放在 `public/`；生成产物位于 `dist/`，不应手动编辑。

## 构建、测试与开发命令

使用 pnpm；`preinstall` 会强制检查。

- `pnpm dev` 或 `pnpm start`：在本地运行 Astro 开发服务器。
- `pnpm check`：对页面、组件和内容运行 Astro 诊断。
- `pnpm type-check`：使用 `tsc --noEmit --isolatedDeclarations` 运行 TypeScript 检查。
- `pnpm build`：构建站点，并在 `dist/` 中生成 Pagefind 搜索数据。
- `pnpm preview`：在本地预览生产构建。
- `pnpm new-post`：使用 `scripts/new-post.js` 创建新文章。
- `pnpm format`：使用 Biome 格式化 `src`。
- `pnpm lint`：对 `src` 运行 Biome 检查并执行安全写入。

## 编码风格与命名约定

Biome 是格式化和 lint 规则的准绳。它在 JavaScript/TypeScript 中使用 tab 缩进和双引号。工具函数和面向配置的代码优先使用 TypeScript。Astro 和 Svelte 组件使用 PascalCase 命名，例如 `PostCard.astro`；工具文件使用 kebab-case 命名，例如 `content-utils.ts`。路由文件名保持符合 Astro 约定，例如 `[...slug].astro`。尽量使用自闭合元素，并避免重新赋值函数参数。

## 测试指南

当前未配置独立的单元测试套件。提交更改前，请运行 `pnpm check`、`pnpm type-check` 和 `pnpm build`。对于 UI 或内容更改，还要运行 `pnpm dev` 并检查受影响页面；相关时也应检查文章、归档页和 RSS 相关路由。

## 提交与拉取请求指南

尽可能遵循 Conventional Commits，并与现有历史保持一致：`feat: add pinned posts`、`fix: update code block warning`、`docs: add article`。提交应保持聚焦，避免把无关重构与内容或样式更改混在一起。拉取请求应说明更改内容，列出已运行的验证命令，链接相关 issue 或讨论，并为可见的 UI 更改附上截图。

## 安全与配置提示

将站点设置集中在 `src/config.ts`，将 Astro 集成相关更改放在 `astro.config.mjs`。不要提交密钥、本地环境文件、生成的 `dist/` 产物或依赖目录。添加第三方脚本、评论或嵌入式 HTML 时，发布前请检查清理策略和 CSP 影响。
