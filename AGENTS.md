@/Users/xt/.codex/RTK.md
Communicate in Chinese

# Project Constraints

本文件是本仓库的代理/协作约束。修改代码前先遵守这里的约定，再参考 README 和源码现状。

## 运行与包管理

- 使用 npm 作为默认包管理器；`package-lock.json` 是锁文件来源。不要新增或更新 `pnpm-lock.yaml`、`yarn.lock`，除非用户明确要求切换包管理器。
- 运行环境要求 Node.js `>=18.0.0`。
- 开发命令使用 `npm run dev`，它会启动自定义 `server.js`，不是 `next dev`。
- 生产流程使用 `npm run build` 后 `npm start`。`server.js` 负责 Next 请求处理、SSE 统计接口和 `.stats.json` 持久化。
- `.env.local` 来自 `.env.example`。常用环境变量：`PORT`、`NEXT_PUBLIC_SITE_URL`、`ANALYZE`、`NEXT_BUILD_DIR`。

## 技术栈与架构

- 项目是 Next.js 14 Pages Router + React 18 + TypeScript + SCSS Modules + GSAP + Three.js/R3F + MDX。
- 路由放在 `pages/`。不要引入 App Router 结构，除非用户明确要求迁移。
- 跨页面全局状态集中在 `contexts/AppContext.tsx`，页面转场集中在 `contexts/TransitionContext.tsx`。
- `components/layout/MainLayout.tsx` 拥有全局 HUD、左侧面板、音乐播放器、自定义光标、WebGL 背景和移动端底栏。不要在页面里重复实现这些全局壳层。
- 桌面端可使用 WebGL、自定义光标和复杂动效；平板/移动端要保留系统光标、抽屉/底栏导航和更轻的交互。

## 内容与数据

- 作品、经历、生活、技能、友链等内容优先写入 `data/*.ts`，并使用 `types/index.ts` 中已有类型。
- 博客写在 `content/blog/*.mdx`，frontmatter 至少保持：
  - `title`
  - `date`
  - `excerpt`
  - `tags`
- 博客读取、阅读时长和日期倒序逻辑在 `lib/blog.ts`。新增博客能力时优先扩展这里，不要在页面中重复文件读取逻辑。
- 图片、音乐等静态资源放在 `public/`。音频文件按 `.gitignore` 约定不提交到 git。

## 路由与导航

- 首页 `/` 是六列 HUD 导航。主内容聚合页是 `/content`，区块锚点为：
  - `#works`
  - `#experience`
  - `#blog`
  - `#life`
  - `#contact`
  - `#about`
- `/works`、`/experience`、`/blog`、`/life`、`/contact`、`/about` 是到 `/content#...` 的跳转页。新增或改名区块时，要同步首页列点击、左侧导航、区块 `id="section-*"` 和跳转页。
- 用户可见的内部跳转优先使用 `useTransition().navigateTo(...)`，以保持统一转场动画。只有简单重定向、预取、服务端数据函数等场景才直接使用 Next router。
- Web 项目详情路由是 `/web/[id]`，生活详情路由是 `/life/[slug]`，博客详情路由是 `/blog/[slug]`。

## 样式与视觉规范

- 样式以 SCSS Modules 为主。全局变量在 `styles/globals.scss`。
- `styles/Home.module.scss` 是主样式入口，并导入 `_animations.scss`、`_columns.scss`、`_sections.scss`、`_layout.scss`。
- 优先复用现有 CSS 变量、断点和动画类。不要随意新增一套并行设计系统。
- 视觉语言保持后末日科幻 HUD：暗色底、细线网格、扫描线、终端文本、克制的发光、英文大写标签。
- 主强调色是 `--ark-highlight-green: #b2f2bb`；满电/反色模式通过 `.inverted` 覆盖为粉紫色。新增组件必须考虑普通模式和反色模式。
- 响应式断点沿用：
  - mobile: `max-width: 767px`
  - tablet: `768px - 1023px`
  - desktop: `min-width: 1024px`
- 尊重 `prefers-reduced-motion`，不要让新增动画绕过全局减少动画策略。

## 代码风格

- 现有源码主要使用相对路径导入；虽然 `tsconfig.json` 配了 `@/*` alias，但新增代码优先跟随周围文件风格。
- React 组件使用函数组件和 hooks。局部交互状态放组件内；跨页面状态封装到 hook/context。
- 对已有 `Project`、`LifeItem`、`ExperienceItem`、`BlogPostMeta` 等类型优先做类型扩展，不要散落 `any`。
- Three.js/R3F 相关文件当前可能使用 `@ts-nocheck` 规避 JSX 类型冲突。修改这些文件时优先保持现有模式，除非同时系统性修复类型。
- 注释只在复杂动效、时序、WebGL、SSE、导航转场等不直观逻辑处添加。

## 验证约束

- 交付前至少尝试运行与改动相关的验证命令，并在回复中说明结果。
- 当前项目没有测试脚本或测试文件；不要声称测试已通过。
- 当前 `npm run lint` 会进入 Next.js ESLint 初始化交互，说明 ESLint 尚未配置。
- 当前 `npm run build` / `npx tsc --noEmit` 可能因 `components/mdx/MDXComponents.tsx` 中 `mdx/types` 类型解析失败而无法通过。修复类型/依赖前，应如实说明该阻塞。
- `next.config.js` 配置了 `@svgr/webpack`，但依赖中未声明该包。若新增 TSX 直接导入 SVG 的用法，应先补齐依赖或调整 SVG 策略。

## 变更边界

- 保持改动小而集中。不要为了新增内容重写全局布局、转场系统或样式架构。
- 不要删除 `server.js` 的 SSE 统计能力，除非用户明确要求。
- 不要提交 `.stats.json`、`.env.local`、音频文件或构建产物。
- 如果发现未跟踪的 `pnpm-lock.yaml`，默认视为本地环境产物，不要纳入变更，除非用户要求切换到 pnpm。
