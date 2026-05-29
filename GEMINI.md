# MyLink - Gemini CLI Comprehensive Instructions

This file serves as a comprehensive guide for Gemini CLI to understand the project deeply and provide development support aligned with planning and design intentions.

## 1. Project Overview
MyLink is a **Linktree clone service** that connects all your activities and content through a single link.

### Core Tech Stack
- **Framework**: Next.js 16.2 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn/ui (Radix UI based)
- **Backend**: Firebase (Auth, Firestore, Storage)
- **Icons**: Lucide-React

## 2. Key Features & Requirements (Based on PRD)
- **Authentication**: Single Google Social Login via Firebase Auth.
- **User Address**: Unique `username` setup (`mylink.to/{username}`).
- **Link Management (CRUD)**: Title/URL management and automatic Favicon parsing.
- **Profile Settings**: Avatar upload, display name, and bio (max 80 chars).
- **Themes**: Light/Dark and presets based on shadcn/ui.
- **Landing Page**: Mobile-optimized responsive profile page.

## 3. Screen Design & UI Structure (Based on Wireframes)

### 3.1 Main Screen Structure
- **Login Page**: Central logo and Google Login `Button`.
- **Username Setup**: `Input` field with duplicate check helper text, start `Button`.
- **Admin Dashboard**: Tab switching via `NavigationMenu` (`Links`, `Appearance`).
  - **Links Tab**: `+ Add Link` button and link item `Card` list.
  - **Appearance Tab**: `Avatar` upload, `Input`/`Textarea` settings, theme cards.
- **User Landing Page**: Center-aligned `Avatar`, name, bio, and full-width link `Button` list.

### 3.2 Component Mapping
- Button: `Button` (shadcn/ui)
- Input: `Input`, `Textarea` (shadcn/ui)
- Card: `Card` (shadcn/ui)
- Avatar: `Avatar` (shadcn/ui)
- Navigation: `NavigationMenu` (shadcn/ui)

## 4. Database Design (Cloud Firestore)
- `users` (Collection): `uid`, `email`, `username`, `displayName`, `profile_bio`, `profile_image_url`, `theme`, `created_at`
- `users/{uid}/links` (Sub-collection): `id`, `title`, `url`, `favicon_url`, `created_at`

## 5. Development Guidelines & Cautions
- **Next.js Rules**: Adhere to `AGENTS.md`; note differences in Next.js 16.2 APIs.
- **Adding Components**: Use `npx shadcn@latest add [component-name]`.
- **Utilities**: Use the `cn` function from `lib/utils.ts` for class merging.
- **Documentation**: Prioritize PRD, Scenarios, and Wireframes in `docs/`.
- **Commit Messages**: Detailed commit messages (in English to save tokens).

## 6. Key Commands
- `npm run dev`: Start dev server
- `npm run build`: Production build
- `npm run typecheck`: TypeScript check
- `npm run lint`: ESLint check
- `npm run format`: Prettier format

---
*This guide is updated as the project evolves.*
