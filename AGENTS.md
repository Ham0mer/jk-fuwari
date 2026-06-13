# Repository Guidelines

## Project Structure & Module Organization

This is an Astro 5 blog/theme project using Svelte, Tailwind, Stylus, and Markdown content. Application code lives in `src/`: routes in `src/pages`, layouts in `src/layouts`, UI in `src/components`, utilities in `src/utils`, types in `src/types`, i18n strings in `src/i18n`, and content in `src/content`. Blog posts use `src/content/posts/<slug>/index.md`, with post-local images beside the post. Static files belong in `public/`; generated output in `dist/` should not be edited.

## Build, Test, and Development Commands

Use pnpm; `preinstall` enforces it.

- `pnpm dev` or `pnpm start`: run the Astro dev server locally.
- `pnpm check`: run Astro diagnostics for pages, components, and content.
- `pnpm type-check`: run TypeScript with `tsc --noEmit --isolatedDeclarations`.
- `pnpm build`: build the site and generate Pagefind search data in `dist/`.
- `pnpm preview`: preview the production build locally.
- `pnpm new-post`: create a new post using `scripts/new-post.js`.
- `pnpm format`: format `src` with Biome.
- `pnpm lint`: run Biome checks and safe writes over `src`.

## Coding Style & Naming Conventions

Biome is the source of truth for formatting and linting. It uses tabs for indentation and double quotes in JavaScript/TypeScript. Prefer TypeScript for utilities and configuration-facing code. Name Astro and Svelte components in PascalCase, for example `PostCard.astro`; name utilities in kebab case, for example `content-utils.ts`. Keep route filenames aligned with Astro conventions such as `[...slug].astro`. Use self-closing elements when possible and avoid parameter reassignment.

## Testing Guidelines

There is no standalone unit test suite configured. Before submitting changes, run `pnpm check`, `pnpm type-check`, and `pnpm build`. For UI or content changes, also run `pnpm dev` and inspect affected pages, including posts, archives, and RSS-related routes when relevant.

## Commit & Pull Request Guidelines

Follow Conventional Commits when possible, matching the existing history: `feat: add pinned posts`, `fix: update code block warning`, `docs: add article`. Keep commits focused and avoid mixing unrelated refactors with content or style changes. Pull requests should describe the change, note validation commands run, link related issues or discussions, and include screenshots for visible UI changes.

## Security & Configuration Tips

Keep site settings centralized in `src/config.ts` and Astro integration changes in `astro.config.mjs`. Do not commit secrets, local environment files, generated `dist/` artifacts, or dependency folders. When adding third-party scripts, comments, or embedded HTML, check sanitization and CSP implications before shipping.
