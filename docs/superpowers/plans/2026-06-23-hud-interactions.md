# HUD Interactions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build eight complete HUD-native interactions for the portfolio: command terminal, project scanning, radar section navigation, archive layer, blog signal reader, mission replay, life fragment map, and contact handshake.

**Architecture:** Add a small shared interaction state to `AppContext` for archive mode and command terminal status, then keep each feature near the existing component that owns its UI. Use existing `navigateTo`, system notices, SCSS Modules, and current data arrays instead of introducing a new state library or router structure.

**Tech Stack:** Next.js 14 Pages Router, React 18 hooks, TypeScript, SCSS Modules, GSAP only where the project already uses it.

---

### Task 1: Shared HUD Interaction State

**Files:**
- Modify: `types/index.ts`
- Modify: `contexts/AppContext.tsx`
- Modify: `components/layout/MainLayout.tsx`

- [ ] Add `archiveLayerActive`, `toggleArchiveLayer`, `setArchiveLayerActive`, `commandTerminalOpen`, `openCommandTerminal`, and `closeCommandTerminal` to the app context type and provider.
- [ ] Make `MainLayout` render global interaction components only after the main app is visible.
- [ ] Wire `Ctrl/Cmd+K` to open the command terminal and `Escape` to close it.

### Task 2: Global Command Terminal

**Files:**
- Create: `components/interactive/CommandTerminal.tsx`
- Create: `components/interactive/CommandTerminal.module.scss`
- Modify: `components/layout/MainLayout.tsx`

- [ ] Implement a modal command terminal with search and command actions for sections, blog tags, archive layer, charge/discharge affordances, and direct routes.
- [ ] Use `useTransition().navigateTo` for internal navigation.
- [ ] Support keyboard navigation with arrow keys, Enter, Escape, focus restore, empty state, and mobile layout.

### Task 3: Content Radar Navigation

**Files:**
- Create: `components/interactive/ContentRadar.tsx`
- Create: `components/interactive/ContentRadar.module.scss`
- Modify: `pages/content.tsx`
- Modify: `components/layout/MainLayout.tsx`

- [ ] Track `/content` scroll position and active section using the existing scroll container.
- [ ] Render a compact fixed HUD radar with current section code, percentage, visitor stats, and clickable section pips.
- [ ] Push system notices when section changes, without spamming on first paint.

### Task 4: Project Blackbox Scan

**Files:**
- Modify: `components/cards/ProjectCard.tsx`
- Modify: `styles/_sections.scss`

- [ ] Add hover/focus scan states: locked signal, decode line, status/year/role metadata, and tech payload.
- [ ] Keep the existing image, title, description, live link, and card click behavior intact.
- [ ] Respect `prefers-reduced-motion` by removing the animated sweep while retaining readable decoded content.

### Task 5: Archive Layer Unlock

**Files:**
- Modify: `contexts/AppContext.tsx`
- Modify: `components/layout/MainLayout.tsx`
- Modify: `components/cards/ProjectCard.tsx`
- Modify: `components/sections/AboutSection.tsx`
- Modify: `styles/_sections.scss`

- [ ] Let full-power discharge toggle `archiveLayerActive`.
- [ ] Add visible archive-only side notes on projects and About while preserving normal content.
- [ ] Reflect archive state in global HUD classes and system notices.

### Task 6: Blog Signal Reader

**Files:**
- Modify: `components/sections/BlogSection.tsx`
- Modify: `styles/BlogPostCard.module.scss`
- Modify: `pages/blog/[slug].tsx`
- Modify: `styles/BlogDetailView.module.scss`

- [ ] Add terminal-style tag filtering and signal count to the blog list.
- [ ] Extend the detail reader with current coordinate, estimated signal phase, and richer right-nav copy.
- [ ] Preserve existing MDX rendering and reading progress.

### Task 7: Experience Mission Replay

**Files:**
- Modify: `components/sections/ExperienceSection.tsx`
- Modify: `styles/_sections.scss`

- [ ] Add a selected mission panel that replays details as numbered objectives.
- [ ] Keep timeline items clickable and keyboard accessible.
- [ ] Make the replay useful before opening the full detail overlay.

### Task 8: Life Fragment Map

**Files:**
- Modify: `components/sections/LifeSection.tsx`
- Modify: `styles/_sections.scss`

- [ ] Add a fragment-map view for the active Life tab with coordinates and connecting traces.
- [ ] Preserve existing tab content and detail navigation.
- [ ] Use a compact list layout on mobile.

### Task 9: Contact Handshake Protocol

**Files:**
- Modify: `pages/content.tsx`
- Modify: `components/sections/ContactSection.tsx`
- Modify: `styles/_sections.scss`

- [ ] Replace single-step copy feedback with three handshake phases: ping, channel, copied.
- [ ] Keep copy success/error accessible via live regions.
- [ ] Animate the contact radar state without depending on audio.

### Task 10: Verification

**Files:**
- No code ownership.

- [ ] Run `npm run build`.
- [ ] If build is blocked by known MDX type resolution, run `npx tsc --noEmit` and report the exact blocker.
- [ ] Run a local dev server with `npm run dev` and inspect desktop/mobile with browser automation or screenshots when available.
