# Plan: Visa Document Upload — Frontend

> Source PRD: ai-docs/prd/visa-document-upload-frontend.md

## Architectural decisions

- **Location:** Upload action lives inside the existing `ApplicationDetailDrawer`, in the Approved-status actions section alongside the "Download Visa" button. No new page or route needed.
- **Visibility gate:** Upload button renders only when `status === Approved`. Hidden for all other statuses.
- **One document per application:** Uploading replaces any previously stored document. No append/list behaviour.
- **Key model change:** `VisaApplicationDetail` gains `visaDocumentPath: string | null`. Null means no document on file.
- **API contract:** `POST /api/v1/applications/{id}/document` via `multipart/form-data`. New `uploadVisaDocument(id, file)` function added to the applications API service module.
- **Download unchanged:** Existing `downloadVisaDocument` function and its trigger point are not modified.
- **State refresh:** On successful upload, the application detail React Query cache entry is invalidated — no manual state update needed.
- **Client-side validation:** PDF MIME type check and file size ≤ 10 MB enforced before any API call. Violations surface as error toasts.

---

## Phase 1: Upload flow

**User stories:** 1, 2, 3, 4, 5, 6, 7, 8, 12

### What to build

Extend `VisaApplicationDetail` with `visaDocumentPath: string | null`. Add `uploadVisaDocument(id, file)` to the applications API service.

In the drawer's Approved-status section, render an "Attach visa document" button. Clicking it triggers a hidden file input restricted to `.pdf`. On file selection, validate that the file is a PDF and under 10 MB — show an error toast and abort if either check fails. For valid files, call `uploadVisaDocument`, show a loading state on the button, then show a success or error toast on completion. The existing "Download Visa" button is untouched.

### Acceptance criteria

- [ ] "Attach visa document" button is visible when status is Approved.
- [ ] Button is absent for all other statuses.
- [ ] Clicking the button opens a native file picker that filters to `.pdf` files.
- [ ] Selecting a non-PDF file shows an error toast and makes no API call.
- [ ] Selecting a file larger than 10 MB shows an error toast and makes no API call.
- [ ] A valid PDF triggers the upload API call with `multipart/form-data`.
- [ ] Button shows a loading state while the upload is in progress.
- [ ] A success toast is shown on upload completion.
- [ ] An error toast is shown when the upload fails, displaying the server message.
- [ ] "Download Visa" button behaviour is unchanged throughout.

---

## Phase 2: Attachment indicator + replace flow

**User stories:** 9, 10, 11

### What to build

Read `visaDocumentPath` from the application detail response. When it is non-null, render a green "Document attached" badge near the upload button. Change the button label from "Attach visa document" to "Replace document". On successful upload, invalidate the detail query so the badge and button label update automatically without a manual page refresh.

### Acceptance criteria

- [ ] "Document attached" badge is shown when `visaDocumentPath` is non-null.
- [ ] Badge is absent when `visaDocumentPath` is null.
- [ ] Button label is "Replace document" when a document is already on file.
- [ ] Button label is "Attach visa document" when no document is on file.
- [ ] After a successful upload the badge appears (or stays visible) without a page reload.
- [ ] After a successful upload the button label reflects the current document state.
