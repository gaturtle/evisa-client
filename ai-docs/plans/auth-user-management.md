# Plan: Authentication & User Management

> Source PRD: ai-docs/prd/auth-user-management.md

## Architectural decisions

- **Auth gate**: Conditional render in `App.tsx` — if no valid token, render `<LoginPage />` instead of the dashboard. No React Router introduced.
- **Token storage**: `localStorage` — persists across page refreshes; cleared on logout.
- **Auth state**: React Context (`AuthContext`) exposes `token`, `role`, `email`, `login(token, role, email)`, and `logout()`. Wraps the entire app.
- **Current user identity**: Derived by decoding the JWT payload (base64 decode middle segment) via a `parseJwt` utility — no extra API call needed.
- **Axios interceptors**: Request interceptor injects `Authorization: Bearer <token>` on every outgoing call. Response interceptor catches `401` and triggers logout.
- **Role-based nav**: The "Administration" sidebar section is filtered out entirely when the current user's role is `Staff`. Role value comes from `AuthContext`.
- **Key models**: `LoginResponse` (token, expiresAt, role), `AdminUser` (id, email, fullName, role, isActive), `CreateUserRequest`, `UpdateUserRequest`.

---

## Phase 1: Login & Auth Gate

**User stories**: 1, 2, 3, 4, 7

### What to build

A login page that exchanges email + password for a JWT, stores the token in `localStorage`, and populates `AuthContext`. `App.tsx` checks for a stored token on mount — if none is present, it renders the login page instead of the dashboard. An Axios request interceptor reads the token from context/localStorage and injects the `Authorization` header on every outgoing request. After this phase, the dashboard is fully gated and all API calls carry the token automatically.

### Acceptance criteria

- [x] Visiting the app with no stored token shows the login page, not the dashboard
- [x] Submitting valid credentials navigates to the dashboard and stores the token in `localStorage`
- [x] Submitting invalid credentials shows an inline error message without leaving the login page
- [x] Refreshing the browser while logged in keeps the user on the dashboard (token persists)
- [x] All API requests include `Authorization: Bearer <token>` in the request headers

---

## Phase 2: Session Lifecycle

**User stories**: 5, 6

### What to build

A logout button fixed at the bottom of the sidebar that clears the token from `localStorage` and `AuthContext`, returning the user to the login screen. An Axios response interceptor that detects `401` responses (expired or invalid token) and automatically triggers the same logout flow. After this phase, the session has a clean start, middle, and end — users are never left with a broken dashboard after token expiry.

### Acceptance criteria

- [x] Clicking the logout button clears the session and shows the login page
- [x] After logout, refreshing the browser shows the login page (token is gone from `localStorage`)
- [x] When the API returns a `401` response, the user is automatically redirected to the login page
- [x] After auto-logout on 401, the login page is shown cleanly with no error state

---

## Phase 3: User List

**User stories**: 8, 9, 10, 17, 18

### What to build

An "Administration" section at the bottom of the sidebar containing a "Users" nav item, visible only to Admin-role users. The Users page fetches all admin users via `GET /api/v1/auth/users` and displays them in a table with columns: Full Name, Email, Role (badge), Status (Active/Inactive badge), and an Actions column (Edit and Delete icons, wired up in later phases). After this phase, admins can see all users; Staff users see no Administration section.

### Acceptance criteria

- [x] Logged-in Admin sees an "Administration" section in the sidebar with a "Users" item
- [x] Logged-in Staff user does not see the "Administration" section at all
- [x] Navigating to Users shows a table of all admin users
- [x] Each row displays Full Name, Email, a Role badge, and an Active/Inactive badge
- [x] The table re-fetches correctly when the page is revisited

---

## Phase 4: Create User

**User stories**: 11, 16, 19, 20, 21

### What to build

An "Add User" button above the table that opens a create form dialog. The form collects Email, Full Name, Password, and Role (combobox with "Admin" / "Staff" options). Zod validation enforces required fields and valid email format. On success, the user list refreshes and a success toast is shown. On `400` (email already taken), an error toast surfaces the API message. After this phase, admins can grant dashboard access to new team members.

### Acceptance criteria

- [x] Clicking "Add User" opens a dialog with Email, Full Name, Password, and Role fields
- [x] Submitting the form with missing or invalid fields shows inline validation errors
- [x] Successfully creating a user closes the dialog, refreshes the table, and shows a success toast
- [x] Attempting to create a user with a duplicate email shows an error toast with the API message
- [x] The Role field is a combobox restricted to "Admin" and "Staff" options

---

## Phase 5: Edit & Delete User

**User stories**: 12, 13, 14, 15

### What to build

The Edit action (pencil icon) on each table row opens the same form dialog in edit mode — showing Full Name, Role, and an Is Active toggle (email and password hidden). The Delete action (trash icon) opens a confirmation alert dialog before calling `DELETE /api/v1/auth/users/{id}`. Both actions on the row matching the current user's email are disabled to prevent self-modification. After this phase, full CRUD is complete and admins cannot accidentally lock themselves out.

### Acceptance criteria

- [x] Clicking Edit on a row opens the dialog pre-filled with the user's current Full Name, Role, and Is Active state
- [x] Email and Password fields are not shown in edit mode
- [x] Saving edits updates the user record, closes the dialog, refreshes the table, and shows a success toast
- [x] Setting Is Active to false deactivates the account (reflected in the Status badge after save)
- [x] Clicking Delete on a row opens a confirmation dialog; confirming deletes the user and refreshes the table
- [x] Edit and Delete actions on the current user's own row are visually disabled and non-interactive
