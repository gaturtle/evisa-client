# Project Status

**Last updated:** 2026-06-11 · **Author:** gaturtle · **Session:** 1

---

## Completed

| Date | Item |
|---|---|
| pre-session | Applications page — Phase 1: list with pagination |
| pre-session | Applications page — Phase 2: list filters |
| pre-session | Applications page — Phase 3: detail drawer (read-only) |
| pre-session | Applications page — Phase 4: status management + PDF download |
| pre-session | Applications page — Phase 5: edit application |
| pre-session | Applications page — Phase 6: delete application |
| pre-session | Backend: visa document upload (Tasks 1–4: column, upload endpoint, serve via download endpoint, expose in detail response) |
| pre-session | Backend: multi-person visa download (extend `GET /track/document` → PDF or ZIP; per-applicant upload endpoint; `Applicant.DocumentPath` column) |
| 2026-06-11 | Designed multi-person visa download (grill-me session, all decisions logged) |
| 2026-06-11 | PRD: `ai-docs/prd/multi-person-visa-download-backend.md` |
| 2026-06-11 | PRD: `ai-docs/prd/multi-person-visa-download-frontend.md` |
| 2026-06-11 | Plan: `ai-docs/plans/multi-person-visa-download-frontend.md` |
| 2026-06-11 | Frontend: multi-person visa download — Phase 1 (Content-Type-aware handler, dynamic button label, `documentPath` on `Applicant` type) |

---

## In Progress

- **Frontend: visa document upload** — `ai-docs/plans/visa-document-upload-frontend.md`
  - Phase 1 (attach button, file validation, upload call) — not started
  - Phase 2 (document-attached badge, replace flow) — not started

---

## Next Tasks

1. Implement `visa-document-upload-frontend` Phase 1 — attach visa document button
2. Implement `visa-document-upload-frontend` Phase 2 — attachment indicator + replace flow

---

## Deferred Issues

_None recorded._

---

## Warnings

- `GET /api/v1/applications/track/document` returns `404` if any applicant's PDF has not been uploaded yet (multi-applicant path). The frontend download button has no way to signal this ahead of time — a confusing 404 will surface as a generic error toast. Consider surfacing per-applicant `documentPath` in the UI before enabling the download button.
- The `visa-document-upload-backend.md` plan uses old task-style format (not phased). All four tasks are backend-complete per DATABASE.md / API_SPEC.md — the file can be archived once the frontend upload work is done.
