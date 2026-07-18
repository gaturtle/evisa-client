# Plan: Multi-Person Visa Download — Frontend

> Source PRD: ai-docs/prd/multi-person-visa-download-frontend.md

## Architectural decisions

- **No new endpoint**: The existing `GET /api/v1/applications/track/document` endpoint is reused. The backend returns `Content-Type: application/pdf` for one applicant and `Content-Type: application/zip` for multiple — the frontend branches on the response header.
- **Type update**: `Applicant` gains `documentPath: string | null` to align with the updated API spec. This field drives the per-applicant document-ready indicator and the download gate.
- **Button label source**: `applicants.length` is read from the already-loaded `VisaApplicationDetail` — no extra API call.
- **Download gate**: `status === Approved` is necessary but not sufficient. The button is also disabled when `applicants.length === 0` or any applicant has `documentPath === null`. `[].every()` returns `true` in JS so the length guard prevents a false-positive on empty arrays.
- **Disabled state UX**: When the gate fails the button is visible but disabled (not hidden), with an inline hint directly below it: "N document(s) missing — upload all to enable download". The hint is hidden when all documents are uploaded.
- **Filename convention**: Single → `evisa_{referenceNumber}.pdf`. ZIP → `evisa_{referenceNumber}.zip`. Derived client-side from `Content-Type` and `referenceNumber`.

---

## Phase 1: Content-Type-aware download with dynamic UX

**User stories**: 1, 2, 3, 4, 5, 6, 7, 8, 9

### What to build

Add `documentPath: string | null` to the `Applicant` type.

Update the `downloadVisaDocument` API function to inspect the `Content-Type` response header. If `application/zip`, save the file as `evisa_{referenceNumber}.zip`; if `application/pdf`, save as `evisa_{referenceNumber}.pdf`. The function signature stays the same — branching is internal.

In the application detail drawer, introduce a local `isDownloading` boolean state. Set it to `true` on button click and `false` in the `finally` block. Disable the button and show a spinner while `isDownloading` is true. On failure, show an error toast using the existing Sonner pattern. On success the browser download is triggered automatically.

Change the download button label to read `applicants.length` from the loaded detail object: render "Download Visa" when there is one applicant, "Download Visas (N)" when there are multiple.

### Acceptance criteria

- [x] `Applicant` type includes `documentPath: string | null`.
- [x] Download button label is "Download Visa" when `applicants.length === 1`.
- [x] Download button label is "Download Visas (N)" when `applicants.length > 1`, where N is the actual count.
- [x] Clicking the button disables it and shows a loading spinner immediately.
- [x] Button returns to normal state after download completes or fails.
- [x] When the backend returns `Content-Type: application/pdf`, the file is saved as `evisa_{referenceNumber}.pdf`.
- [x] When the backend returns `Content-Type: application/zip`, the file is saved as `evisa_{referenceNumber}.zip`.
- [x] A browser download is triggered in both cases without opening a new tab.
- [x] On download failure, an error toast is shown and the button is re-enabled.
- [x] Download button only appears when application status is `Approved`.
- [x] Download button is disabled (visible) when `applicants.length === 0` or any applicant has `documentPath === null`.
- [x] When disabled due to missing documents, an inline hint appears directly below the button: "N document(s) missing — upload all to enable download".
- [x] The hint is hidden when all applicants have `documentPath !== null` (button becomes enabled).
- [x] Gate uses `applicants.length > 0 && applicants.every(a => a.documentPath !== null)` to avoid JS `[].every()` false-positive.
