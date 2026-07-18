# Plan: Applications Page

> Source PRD: ai-docs/prd/applications-page.md

## Architectural decisions

- **Navigation:** `Application-list` nav ID already exists in the navigation config. `ApplicationsPage` is wired into `App.tsx` switch-case router under that ID.
- **Routing:** No URL-based routing — the app uses sidebar-driven state navigation.
- **API base:** `GET /api/v1/applications` for list (server-side pagination), `GET /api/v1/applications/{id}` for detail.
- **Pagination:** Server-side offset pagination via `page` / `pageSize` query params. Filter changes reset page to 1.
- **Key models:** `VisaApplicationListItem` (list row), `VisaApplicationDetail` (drawer), `ApplicationStatus` enum (0–5), `UpdateStatusRequest`, `UpdateApplicationRequest`.
- **Detail presentation:** Right slide-over drawer (Sheet). List stays visible behind it.
- **Status badge colours:** Submitted → blue · UnderReview → yellow · Approved → green · Rejected → red · RequiresAction → orange · Cancelled → grey.
- **Gating rules:** Edit button — Submitted (0) or RequiresAction (4) only. Download button — Approved (2) only. Delete button — Cancelled (5) only. Status select excludes Submitted (0).
- **Data fetching:** React Query for all reads. Mutations invalidate the applications list query and the specific detail query.
- **Pattern:** Follows existing page patterns — API service module, typed requests/responses, React Query hooks, Sonner toasts for feedback.

---

## Phase 1: Application list with pagination

**User stories:** 1, 4, 5, 6, 21, 22, 23

### What to build

Wire `ApplicationsPage` into the router. Create the `ApplicationStatus` enum, `VisaApplicationListItem` type, and a typed API service function for `GET /api/v1/applications`. Render a table with columns: Reference No. · Contact Name · Email · Applicants · Status (colour-coded badge) · Created Date · Actions (placeholder). Add server-side pagination with prev/next navigation and a page size selector. Handle loading, error, and empty states.

### Acceptance criteria

- [x] Navigating to "Applications" in the sidebar renders the page.
- [x] Applications are fetched from the real API and displayed in the table.
- [x] Status is shown as a colour-coded badge matching the 6-status palette.
- [x] Prev/Next buttons navigate between pages; current page and total count are visible.
- [x] Page size selector changes the number of rows fetched.
- [x] Loading spinner shown while fetching.
- [x] Error state shown when the API call fails.
- [x] Empty state shown when no applications are returned.

---

## Phase 2: List filters

**User stories:** 2, 3

### What to build

Add a filter toolbar above the table with a status dropdown ("All" + 6 labelled status options) and two date pickers (`from` / `to`). Any filter change resets pagination to page 1. Filters are passed as query params to `GET /api/v1/applications`.

### Acceptance criteria

- [x] Status dropdown filters the list to the selected status; "All" clears the filter.
- [x] Date pickers send `from` and `to` to the API; either can be set independently.
- [x] Changing any filter resets the page to 1.
- [x] Active filters persist while navigating pages.
- [x] Clearing a filter re-fetches without that param.

---

## Phase 3: Detail drawer (read-only)

**User stories:** 7, 8, 9, 10

### What to build

Clicking a row (or an action button) opens a right slide-over drawer. The drawer fetches the full application detail via `GET /api/v1/applications/{id}`. Display all sections: contact info, travel dates, visa type and processing option (labels resolved by cross-referencing the visa-type and visa-processing lists), special request flags, notes, applicant list, and payment record. The list remains interactive behind the drawer.

### Acceptance criteria

- [x] Clicking a row opens the drawer with the correct application's data.
- [x] All contact fields are displayed.
- [x] Visa type and processing option show human-readable labels, not raw UUIDs.
- [x] All applicants (first name, last name, nationality) are listed.
- [x] Payment record (amount, currency, status, Stripe intent ID) is displayed.
- [x] Closing the drawer returns focus to the list without a page reload.
- [x] Loading state shown inside the drawer while the detail is fetched.
- [x] Error state shown if the detail fetch fails.

---

## Phase 4: Status management + PDF download

**User stories:** 11, 12, 13, 14, 15

### What to build

Add an actions section to the drawer with two capabilities:

1. **Status management** — a select showing all statuses except Submitted (0), a reason textarea (optional), and an "Update Status" button that calls `PATCH /api/v1/applications/{id}/status`. On success, invalidate the detail and list queries and show a toast.

2. **PDF download** — a "Download Visa" button visible only when status is Approved (2). Calls `GET /api/v1/applications/track/document` with `referenceNumber` and `contactEmail` and triggers a browser file download.

### Acceptance criteria

- [x] Status select contains all statuses except Submitted (0).
- [x] Selecting a status and clicking "Update Status" sends the PATCH request.
- [x] Reason textarea is optional; its value is included in the request when filled.
- [x] On success, the drawer reflects the new status and the list row updates.
- [x] "Download Visa" button is visible only when status is Approved.
- [x] Clicking "Download Visa" downloads the PDF file in the browser.
- [x] Toast notification shown on status update success and on error.

---

## Phase 5: Edit application

**User stories:** 16, 17

### What to build

Add an "Edit" button to the drawer, visible only when status is Submitted (0) or RequiresAction (4). The button opens an edit form covering: contact fields (full name, phone, email, address), entry/exit dates, visa type, processing option, and the full applicant list (first name, last name, nationality — no photo upload). On submit, calls `PUT /api/v1/applications/{id}` with the full payload. On success, invalidate the detail and list queries and show a toast.

### Acceptance criteria

- [x] "Edit" button is visible only when status is Submitted or RequiresAction.
- [x] "Edit" button is absent for all other statuses.
- [x] Edit form pre-populates all current values.
- [x] All required fields are validated before submission.
- [x] Applicant list can be modified (add, remove, edit rows); at least one applicant is required.
- [x] Submitting sends the full applicant list, not a partial diff.
- [x] On success, the drawer reflects updated data and a toast confirms the save.
- [x] On error, a toast displays the failure message.

## Phase 6: Delete application

**User stories:** 18, 19, 20

### What to build

Add a "Delete" button to the drawer, visible only when status is Cancelled (5). Clicking it opens a confirmation dialog. Confirming calls `DELETE /api/v1/applications/{id}`. On success, close the drawer, invalidate the list query, and show a toast.

### Acceptance criteria

- [x] "Delete" button is visible only when status is Cancelled.
- [x] "Delete" button is absent for all other statuses.
- [x] A confirmation dialog appears before the delete request is sent.
- [x] Cancelling the dialog makes no API call.
- [x] Confirming sends the DELETE request.
- [x] On success, the drawer closes, the row disappears from the list, and a toast confirms deletion.
- [x] On error, a toast displays the failure message.
