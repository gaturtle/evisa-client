# Project Status

---

## Last Updated: 2026-06-09 (Session 7)

---

## Completed

### Infrastructure & Rules
- Coding standards in `ai-docs/PROJECT_RULES.md`; shadcn components, TanStack Query, axios, zod, react-hook-form installed
- `src/api/client.ts`, `src/types/api.ts`, `src/config/env.ts` — shared API layer

### Nationalities Page
- Full CRUD: `src/types/nationality.ts`, `src/api/nationalities.ts`, page + form + delete dialogs

### Visa Type Setup (2026-06-06)
- `src/types/visa-type.ts`, `src/api/visa-types.ts`, `src/pages/visa-types/` — full CRUD
- Wired to nav `"Type-setup"` in `App.tsx`

### Processing Setup (2026-06-06)
- `src/types/visa-processing.ts`, `src/api/visa-processings.ts`, `src/pages/visa-processings/` — full CRUD
- Wired to nav `"Processing-setup"` in `App.tsx`

### Applications Page — Phases 1–3 (2026-06-09)
- PRD: `ai-docs/prd/applications-page.md` · Plan: `ai-docs/plans/applications-page.md`
- **Phase 1** — `src/types/application.ts`, `src/api/applications.ts`, paginated table with colour-coded status badges; wired to nav `"Application-list"`
- **Phase 2** — Filter toolbar: status dropdown + from/to date pickers; any change resets to page 1; "Clear filters" button
- **Phase 3** — `src/components/ui/sheet.tsx` (right slide-over built on Radix Dialog); `VisaApplicationDetail` type + `getApplicationDetail()`; `ApplicationDetailDrawer` with Contact, Travel, Applicants, Payment sections; visa type/processing/nationality labels resolved via parallel React Query fetches; row-click and Eye button open the drawer
- **Phase 4** — Actions section in drawer: status select (all except Submitted), optional reason textarea, "Update Status" button calling `PATCH /api/v1/applications/{id}/status`; "Download Visa" button (Approved only) calling `GET /api/v1/applications/track/document` as blob download; mutations invalidate detail + list queries and show Sonner toasts; drawer state resets on open via `key` prop
- **Phase 5** — "Edit Application" button (Submitted/RequiresAction only) in drawer Actions section; `EditApplicationForm` component with contact, travel, applicants, notes sections; `useFieldArray` for dynamic applicant add/remove (min 1); react-hook-form + zod validation; calls `PUT /api/v1/applications/{id}`; invalidates detail + list queries on success; `UpdateApplicationRequest` type + `updateApplication()` API function; `VisaApplicationDetail` extended with individual boolean flag fields

---

## In Progress

### Applications Page — Phase 6 (planned)

| Phase | Title                            | Status      |
| ----- | -------------------------------- | ----------- |
| 6     | Delete application               | Not started |

### Exemptions Page
- **Stale** — exemption table removed from backend; page renders mock data, no real API endpoint [P2]

---

## Warnings
- **shadcn CLI Windows bug** — CLI creates a literal `@/` dir at project root; always move files manually to `src/components/ui/`
- **API not tested live** — backend must be running at `https://localhost:7010/`
- **VisaType ↔ VisaProcessing circular type** — both defined in `visa-type.ts`; `visa-processing.ts` re-exports to avoid duplication
- **No Select component** — shadcn Select not installed; all selects use native `<select>` for consistency (page size, status filter).
- **Uncommitted work** — sessions 2–4 are uncommitted

---

## Next Tasks
1. Applications Phase 6 — delete application (confirmation dialog + DELETE)
4. Exemptions page — repurpose or remove [P2]

---

## Reference
- `ai-docs/PROJECT_RULES.md` — coding standards
- `ai-docs/API_SPEC.md` — full API specification
- `ai-docs/prd/applications-page.md` — Applications page PRD
- `ai-docs/plans/applications-page.md` — Applications page implementation plan
