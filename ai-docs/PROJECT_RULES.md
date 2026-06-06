# Project Rules - React, Tailwind, Shadcn

---

## 0. Tech Stack

| Layer          | Technology                          |
| -------------- | ----------------------------------- |
| Language       | TypeScript                          |
| Framework      | React 19                            |
| Build Tool     | Vite                                |
| Styling        | Tailwind CSS 4                      |
| UI Library     | shadcn/ui (Radix UI + CVA)          |
| Icons          | lucide-react                        |
| HTTP Client    | axios                               |
| Server State   | TanStack Query (React Query)        |
| Testing        | Vitest + React Testing Library      |
| Formatter      | Prettier + ESLint (no conflicts)    |

---

## 1. TypeScript

- Enable `"strict": true` in `tsconfig.app.json` — no exceptions.
- Never use `any`. Use `unknown` and narrow the type explicitly.
- ESLint rule `@typescript-eslint/no-explicit-any` set to `error`.
- No `// eslint-disable` comments without a reviewed justification.
- Use `interface` for component props and object shapes.
- Use `type` for unions, intersections, and aliases (e.g. `type Status = 'active' | 'inactive'`).

---

## 2. Formatting

- Prettier for formatting (indentation, quotes, semicolons, line length).
- ESLint for code quality rules.
- `eslint-config-prettier` installed to prevent conflicts.
- Run both on save and in CI.

---

## 3. Testing

- Framework: **Vitest** (shares Vite config, no separate transform needed).
- Component tests: **React Testing Library**.
- Every new component and utility function must have at least a smoke test.
- No mocking the API layer in integration tests — use MSW or a real test server.

---

## 4. State Management

- **Server state** (API data, loading, errors): TanStack Query (`useQuery`, `useMutation`).
- **UI state** (modals open, selected tab, etc.): React `useState` / `useContext`.
- Add Zustand only if global client state becomes complex — do not add preemptively.
- Never fetch data directly inside components — always go through a TanStack Query hook.

---

## 5. HTTP Client & API Layer

- Use **axios** as the HTTP client.
- All API calls live in `src/api/` — one file per domain:
  - `src/api/nationalities.ts`
  - `src/api/exemptions.ts`
  - etc.
- Each file exports typed `async` functions only. TanStack Query hooks call these functions.
- No `axios` calls or `fetch` calls inside components or hooks directly.
- Base URL and auth headers configured once in a shared axios instance (`src/api/client.ts`).

---

## 6. Component Organization

```
src/
├── components/
│   ├── ui/          # shadcn primitives — never modify directly
│   ├── layout/      # app shell (Sidebar, Header, etc.)
│   └── shared/      # reusable business components used across pages
├── pages/
│   └── <feature>/
│       ├── index.tsx
│       └── components/   # components used only by this page
```

- One component per file.
- File name matches component name in PascalCase (`SidebarItem.tsx`).
- `index.tsx` only for folder entry points — not as a component file itself.

---

## 7. Imports & Aliases

- Always use the `@/` path alias — never relative `../../` paths.
- No barrel exports (`index.ts` re-exporting everything from a folder).
- Import directly from the source file: `import { SidebarItem } from '@/components/layout/sidebar/SidebarItem'`.

---

## 8. Git Conventions

Follow **Conventional Commits**:

```
<type>(<scope>): <description>
```

Types: `feat`, `fix`, `chore`, `refactor`, `test`, `docs`

Examples:
- `feat(nationalities): add search filter to table`
- `fix(exemptions): correct pagination offset`
- `chore(deps): upgrade TanStack Query to v5`

---

## 9. Environment Variables

- Keep `.env.example` in version control with all required variable names and placeholder values.
- Keep `.env` in `.gitignore` — never commit real values.
- All `VITE_*` env vars are accessed exclusively through `src/config/env.ts` — never `import.meta.env.VITE_*` scattered across files.
- `src/config/env.ts` validates and exports typed constants.

---

## 10. Error Handling

- Mount a **React Error Boundary** at the page/route level — one per route.
- **Mutation errors** (create, update, delete): show a toast notification (Sonner).
- **Query errors** (data loading): show an inline error state within the component.
- Never swallow errors silently — every `catch` block must either re-throw or display feedback to the user.

---

## 11. Styling

- **Tailwind utility classes only** — no inline `style` props.
- No arbitrary values (e.g. `w-[347px]`) unless a pixel-perfect design spec requires it.
- No raw CSS outside `index.css`.
- All theme tokens (colors, spacing, radius) defined as CSS variables in `index.css` — never hardcoded.
- Component variants use `class-variance-authority` (CVA) — never conditional string concatenation.
- Use `cn()` from `@/lib/utils` to merge Tailwind classes.

---

## 12. shadcn-First Components

Before building any UI element, check [ui.shadcn.com/docs/components](https://ui.shadcn.com/docs/components).

If a shadcn component covers the use case, install it:
```
npx shadcn@latest add <component>
```

Never hand-roll `<button>`, `<input>`, `<select>`, `<dialog>`, or form elements with manual Tailwind focus/hover/ring classes — those are solved by shadcn.

**Currently installed:** `badge`, `table`, `scroll-area`

**Must be added (actively used as raw HTML now):** `button`, `input`

**Add when needed:** `dialog`, `alert-dialog`, `sonner`, `tooltip`, `form`, `select`

---

## 13. Async / Promises

- Use `async/await` exclusively — no `.then()/.catch()` chains.
- Errors caught with `try/catch`.
- Exception: TanStack Query manages its own promise internally — that is fine as-is.
