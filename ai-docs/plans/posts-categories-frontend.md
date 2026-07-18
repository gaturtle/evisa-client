# Plan: Posts & Categories Frontend

> Source PRD: `ai-docs/prd/posts-categories-frontend.md`

## Architectural decisions

- **Navigation:** No React Router — navigation is component-based via `activeItem` state in `App.tsx`. Sidebar sections are defined in `src/config/navigation.tsx` as `navigationSections`. Add a new "Content" section with "Categories" and "Posts" items.
- **Posts sub-view:** The Posts page manages its own internal view state (`"list" | "create" | "edit"`) since the full-page form replaces the main content area without a URL change.
- **API layer:** New files `src/api/categories.ts` and `src/api/posts.ts` following the existing `apiClient` (Axios + Bearer token) pattern. Response unwrapped from `ApiResponse<T>` wrapper.
- **Types:** New files `src/types/category.ts` and `src/types/post.ts`.
- **State:** React Query for server state (`useQuery` / `useMutation`). Query keys: `["categories"]`, `["posts"]`. Local component state for dialog open/close, edit target, sub-view selection.
- **Rich text editor:** Tiptap (`@tiptap/react`, `@tiptap/starter-kit` + link extension). Output is an HTML string stored in the `content` field.
- **Slug auto-generation:** Client-side, derived from `name` (category) or `title` (post) in real time — lowercase, hyphenated, special chars stripped. Field remains manually editable.
- **Toasts:** Existing `sonner` integration (`toast.success` / `toast.error`).
- **UI components:** Existing shadcn/ui library (`Dialog`, `AlertDialog`, `Table`, `Badge`, `Select`, `Form`, etc.).

---

## Phase 1: Navigation + Categories CRUD

**User stories:** 1, 2, 3, 4, 5, 6, 7, 8

### What to build

Add a "Content" section to the sidebar with two items: "Categories" and "Posts". The Categories item renders a full Categories management page.

The Categories page follows the existing dialog-based CRUD pattern (same as Nationalities):
- Table showing all categories with Name and Slug columns
- "Add Category" button opens a form dialog
- Form has a Name field; Slug is auto-generated from Name as the user types but remains editable; helper text reads "Auto-generated from name"
- Edit action opens the same form pre-filled
- Delete action opens a confirmation `AlertDialog`
- All mutations show success/error toasts and invalidate the categories query

API coverage: `GET /api/v1/categories`, `POST /api/v1/categories`, `PUT /api/v1/categories/:id`, `DELETE /api/v1/categories/:id`.

### Acceptance criteria

- [ ] Sidebar shows a "Content" section with "Categories" and "Posts" items visible to any authenticated user
- [ ] Clicking "Categories" renders the categories table listing all categories with Name and Slug columns
- [ ] "Add Category" opens a dialog; entering a name auto-populates the slug field in real time
- [ ] Slug field is editable independently after auto-generation
- [ ] Submitting the form creates the category, closes the dialog, refreshes the table, and shows a success toast
- [ ] Clicking Edit on a row opens the form pre-filled with the existing name and slug
- [ ] Saving an edit updates the row and shows a success toast
- [ ] Clicking Delete opens a confirmation dialog naming the category
- [ ] Confirming delete removes the row and shows a success toast
- [ ] API errors (e.g. slug collision 409) show an error toast
- [ ] Form submit button is disabled and shows loading state while the request is in-flight

---

## Phase 2: Posts List with Status Toggle & Delete

**User stories:** 9, 10, 21, 22, 23, 24

### What to build

The "Posts" sidebar item renders a Posts list page. The list is a table with columns: Title, Category, Status (badge), Created At, and Actions (Edit, Delete, Publish toggle).

Above the table is a category filter dropdown. Selecting a category re-fetches the list filtered by `categoryId`. The "All Categories" option clears the filter.

Each row has three action buttons:
- **Edit** — switches the page to the edit form (Phase 3 wires this up; button can be present but inert until Phase 3)
- **Delete** — opens a confirmation `AlertDialog`; on confirm calls `DELETE /api/v1/posts/:id`, removes the row, shows success toast
- **Publish toggle** — if status is Draft shows "Publish", if Published shows "Unpublish"; calls `PATCH /api/v1/posts/:id/status` and refreshes the row without a full reload

Status badge: "Draft" (muted/secondary variant) and "Published" (default/green variant).

API coverage: `GET /api/v1/posts?status=all&categoryId=...`, `DELETE /api/v1/posts/:id`, `PATCH /api/v1/posts/:id/status`.

### Acceptance criteria

- [ ] Posts table displays Title, Category name, Status badge, Created At, and action buttons for all posts (drafts and published)
- [ ] Status badge renders "Draft" and "Published" with visually distinct styles
- [ ] Category filter dropdown lists all categories plus an "All Categories" option; selecting one filters the table
- [ ] Clearing the filter (back to "All Categories") shows all posts
- [ ] Delete button opens an `AlertDialog` with the post title; confirming deletes the post and removes the row
- [ ] Publish/Unpublish toggle button calls `PATCH /status` and the row status badge updates immediately
- [ ] "Create Post" button is visible (navigates to form — fully wired in Phase 3)
- [ ] Loading state shown while the initial post list is fetching
- [ ] Error toast shown if any mutation fails

---

## Phase 3: Post Create/Edit Full-Page Form

**User stories:** 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 25, 26, 27, 28

### What to build

Install Tiptap packages (`@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-link`).

The Posts page switches to a `"create"` or `"edit"` sub-view when the user clicks "Create Post" or "Edit" on a row. This full-page form replaces the list in the main content area. A "Back" / "Cancel" button returns to the list.

The form contains:
- **Title** — required text input; drives slug auto-generation on each keystroke
- **Slug** — auto-generated from title (lowercase, hyphenated, special chars stripped); editable; helper text "Auto-generated from title"
- **Content** — Tiptap rich text editor with a toolbar supporting: H1, H2, H3, Bold, Italic, Bullet List, Ordered List, Link; output is HTML
- **Thumbnail URL** — optional plain text input (no file upload)
- **Category** — required dropdown populated from `GET /api/v1/categories`
- **Status** — radio or select: Draft (default) / Published

Validation (zod): title required, content required (non-empty HTML), categoryId required, slug non-empty.

On submit:
- Create mode: `POST /api/v1/posts` → success toast → navigate back to list
- Edit mode: `PUT /api/v1/posts/:id` → success toast → navigate back to list
- Submit button disabled + shows loading state while in-flight
- API errors show error toast; form stays open

In edit mode the form is pre-filled with the existing post data. The "Edit" button in the list now navigates to this form.

### Acceptance criteria

- [ ] Tiptap editor renders with a visible toolbar (H1, H2, H3, Bold, Italic, Bullet List, Ordered List, Link buttons)
- [ ] Typing in Title auto-populates the Slug field in real time
- [ ] Slug field is manually editable independently of the title
- [ ] Slug field shows helper text "Auto-generated from title"
- [ ] Category dropdown is populated from the categories API
- [ ] Status selector defaults to "Draft" for new posts
- [ ] Submitting with missing title, content, or category shows inline validation errors
- [ ] Successful create shows success toast and returns to the posts list, with the new post visible
- [ ] Clicking Edit on a list row opens the form pre-filled with existing post data
- [ ] Successful edit shows success toast and returns to the posts list with updated data
- [ ] Submit button is disabled and shows loading text while the request is in-flight
- [ ] API errors (e.g. slug collision) show an error toast without closing the form
- [ ] Cancel / Back button returns to the posts list without saving
