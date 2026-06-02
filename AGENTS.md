# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Project

Chinese-language personal blog at https://jk.sb, built on the [Fuwari](https://github.com/saicaca/fuwari) Astro template. Deployed on Vercel.

## Commands

- `pnpm dev` — start dev server on `localhost:4321`
- `pnpm build` — runs `astro build && pagefind --site dist` (the Pagefind step is what makes site search work; don't skip it when reproducing prod issues)
- `pnpm preview` — preview the built `./dist/`
- `pnpm check` — `astro check` (type-checks `.astro` and content schema)
- `pnpm type-check` — `tsc --noEmit --isolatedDeclarations`
- `pnpm lint` / `pnpm format` — Biome with `--write` (configured to ignore `src/**/*.css`, `dist/`, `public/`)
- `pnpm new-post <filename>` — scaffolds `src/content/posts/<filename>.md` with frontmatter. Append `img` (e.g. `pnpm new-post foo img`) to also create `public/IMG/foo/`.

`pnpm` is enforced via a `preinstall` hook (`npx only-allow pnpm`). Requires Node ≤ 22 and pnpm ≤ 9 per README, though `package.json` pins `pnpm@10.19.0` — use what's pinned.

## Repository quirks

- **Default branch is `master`**, but `.github/workflows/{build,biome}.yml` trigger on pushes to `main`. CI does not run on `master` pushes — keep this in mind before relying on green CI as a signal.
- `astro.config.mjs` sets `trailingSlash: "always"` and `site: "https://jk.sb"`. Internal links should not include trailing slashes manually; Astro adds them.
- `vercel.json` sets aggressive cache headers (`max-age=86400`, CDN `max-age=31536000`). Asset URLs that need to change should be renamed, not just edited.

## Architecture

### Content pipeline

Posts live in `src/content/posts/*.md` as an Astro content collection defined in [src/content/config.ts](src/content/config.ts). The schema enforces frontmatter (`title`, `published`, optional `updated`, `draft`, `description`, `image`, `tags`, `category`, `lang`, `pinned`). It also reserves internal fields (`prevTitle`, `prevSlug`, `nextTitle`, `nextSlug`) that are populated during build for post navigation — do not set these in frontmatter.

Posts can be either flat `slug.md` files or folders `slug/index.md` with local images in `slug/images/` (referenced as `./images/foo.jpg`). The slug comes from the filename or folder name. Cover images referenced as `/IMG/foo.jpg` resolve to `public/IMG/`. The `new-post <name> img` helper creates the matching folder.

Post sort order: pinned posts (`pinned: true`) appear first, then sorted by `published` descending (time-of-day is respected, not just date).

### Markdown extensions

The Markdown stack (configured in [astro.config.mjs](astro.config.mjs)) is unusually layered. When editing post content or adding new directive types, both pipelines below matter:

1. **Remark plugins** (text → MDAST): `remark-math`, `remark-reading-time` (custom, in `src/plugins/`), `remark-excerpt` (custom), `remark-github-admonitions-to-directives` (converts `> [!TIP]` to `:::tip`), `remark-directive`, `remark-sectionize`, then a custom `parseDirectiveNode` that turns directives into rehype-consumable nodes.
2. **Rehype plugins** (MDAST → HAST): `rehype-katex`, `rehype-slug`, then `rehype-components` which dispatches custom directives to renderers in `src/plugins/`:
   - `::github{repo="owner/repo"}` → [src/plugins/rehype-component-github-card.mjs](src/plugins/rehype-component-github-card.mjs)
   - `:::note` / `:::tip` / `:::important` / `:::caution` / `:::warning` → [src/plugins/rehype-component-admonition.mjs](src/plugins/rehype-component-admonition.mjs)
   - Finally `rehype-autolink-headings` appends `#` anchors with `data-pagefind-ignore` so anchor text doesn't pollute search results.

To add a new directive type, register it in the `rehypeComponents` config in `astro.config.mjs` AND implement the renderer in `src/plugins/`.

### Code blocks

Code rendering uses Astro Expressive Code (not Shiki directly) with custom plugins in [src/plugins/expressive-code/](src/plugins/expressive-code/):
- `language-badge.ts` — shows a language label
- `custom-copy-button.ts` — replaces the default copy button (the default is disabled via `frames.showCopyToClipboardButton: false`)

The active theme is `expressiveCodeConfig.theme` in [src/config.ts](src/config.ts) (currently `github-dark`). Note: only dark themes are supported because the blog overrides some backgrounds via CSS variables (`--codeblock-bg`, `--codeblock-topbar-bg`). `shellsession` blocks suppress line numbers via `defaultProps.overridesByLang`.

### Site configuration

[src/config.ts](src/config.ts) is the single source of truth for site identity: title, theme hue, banner, nav links, profile sidebar, license, code-block theme, and GitHub edit link. Routes that need to surface this data import from here directly rather than going through a context layer.

### Page layer

- Routing: [src/pages/](src/pages/) — `[...page].astro` is the paginated home feed; `posts/` holds the post template; `archive.astro`, `about.astro`, `friends.astro` are static; `rss.xml.ts` and `robots.txt.ts` are dynamic endpoints.
- Layout: `MainGridLayout.astro` wraps everything inside `Layout.astro` and contains the sidebar slot.
- Components split by role: `widget/` (sidebar blocks), `control/` (interactive bits like pagination, back-to-top), `misc/` (content helpers like `ImageWrapper`, `License`).
- Page transitions use `@swup/astro` configured with `containers: ["main", "#toc"]`. When adding a new top-level container that should swap on navigation, register it here.
- **Svelte/Astro hybrid**: interactive components (Search, LightDarkSwitch, DisplaySettings, ArchivePanel) are `.svelte` files loaded with `client:only="svelte"`. Static/SSR components are `.astro`. Don't add client interactivity to `.astro` files — create a `.svelte` component and embed it.

### i18n

UI strings go through [src/i18n/i18nKey.ts](src/i18n/i18nKey.ts) (enum) + `i18n(key)` from [src/i18n/translation.ts](src/i18n/translation.ts). The active language is `siteConfig.lang` in [src/config.ts](src/config.ts). To add a new string: add the key to the `I18nKey` enum, then add the string to every language file in [src/i18n/languages/](src/i18n/languages/) (10 locales: `en`, `zh_CN`, `zh_TW`, `ja`, `ko`, `es`, `th`, `vi`, `tr`, `id`).

### Runtime theme system

Theme hue is passed from `siteConfig.themeColor.hue` via `ConfigCarrier.astro` (a hidden `<div data-hue="…">`). Client-side [src/utils/setting-utils.ts](src/utils/setting-utils.ts) reads it on first load, persists overrides to `localStorage`, and sets `--hue` on `:root`. Setting `themeColor.fixed: true` in `src/config.ts` hides the hue picker from users. Dark/light mode follows the same pattern via the `theme` localStorage key and `applyThemeToDocument()`.

### Path aliases

Defined in [tsconfig.json](tsconfig.json): `@components/*`, `@assets/*`, `@constants/*`, `@utils/*`, `@i18n/*`, `@layouts/*`, `@/*`. Prefer these over relative paths in new code. All internal URLs should go through `url()` from `@utils/url-utils.ts` to correctly prepend `BASE_URL`; never construct `/posts/…` paths by hand.

## Contributing notes

Per [CONTRIBUTING.md](CONTRIBUTING.md): one purpose per PR, Conventional Commits, run `pnpm check` and `pnpm format` before submitting.
