# API Specification

> All endpoints return `ApiResponse<T>` wrapper.
> Update this file whenever endpoints change.

---

## Response Wrapper — `ApiResponse<T>`

Every endpoint returns this envelope:

```json
{
  "statusCode": 200,
  "data": {},
  "message": "Human-readable result message.",
  "timestamp": "2026-05-25T10:00:00"
}
```

| Field        | Type        | Description                                      |
| ------------ | ----------- | ------------------------------------------------ |
| `statusCode` | `int`       | Mirrors the HTTP status code                     |
| `data`       | `T \| null` | Payload on success; `null` on error              |
| `message`    | `string`    | Human-readable result description                |
| `timestamp`  | `string`    | UTC time of the response (`yyyy-MM-ddTHH:mm:ss`) |

**Class location:** `Features/Common/ApiResponse.cs` — namespace `ClaudeCodeDemo.Features.Common`

---

## Base URL

```
Production:
Development: https://localhost:7228/api/v1
```

---

## Authentication

All endpoints require JWT in `Authorization: Bearer <accessToken>` header,
except those marked as **Public**.

---

## 1. Auth

### POST /auth/login

Login and receive tokens.

**Request Body:**

```json
{
  "email": "admin@example.com",
  "password": "password123"
}
```

**Success Response (200):**

```json
{
  "statusCode": 200,
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  },
  "message": "Login successful",
  "timestamp": "20xx-02-28T10:00:00"
}
```

**Also sets cookie:**

```
Set-Cookie: refresh_token=eyJ...;
            HttpOnly; Secure; SameSite=Lax;
            Path=/api/v1/auth; Max-Age=259200
```

**Errors:**
| Status | When |
|--------|------|
| 400 | Missing email or password |
| 401 | Invalid credentials |

---

### POST /auth/register

Register a new user.

**Request Body:**

```json
{
  "username": "john",
  "password": "password123"
}
```

**Success Response (200):**

```json
{
  "statusCode": 200,
  "data": {
    "id": "guid",
    "username": "john",
    "passwordHash": "...",
    "refreshToken": null,
    "refreshTokenExpiryTime": null
  },
  "message": "User registered successfully.",
  "timestamp": "20xx-02-28T10:00:00"
}
```

**Errors:**
| Status | When |
|--------|------|
| 400 | Username already exists |

---

### POST /auth/refresh-token

Exchange a valid refresh token for a new token pair.

**Request Body:**

```json
{
  "userId": "guid",
  "refreshToken": "eyJ..."
}
```

**Success Response (200):**

```json
{
  "statusCode": 200,
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  },
  "message": "Token refreshed successfully.",
  "timestamp": "20xx-02-28T10:00:00"
}
```

**Errors:**
| Status | When |
|--------|------|
| 401 | Refresh token is invalid, expired, or user not found |

---

### GET /auth

Verify the caller is authenticated.

**Success Response (200):**

```json
{
  "statusCode": 200,
  "data": "You are authenticated!",
  "message": "Authenticated.",
  "timestamp": "20xx-02-28T10:00:00"
}
```

**Errors:**
| Status | When |
|--------|------|
| 401 | Missing or invalid access token |

---

### GET /auth/super

Accessible by `SuperAdmin` role only.

**Success Response (200):**

```json
{
  "statusCode": 200,
  "data": "You are authenticated!",
  "message": "SuperAdmin access granted.",
  "timestamp": "20xx-02-28T10:00:00"
}
```

**Errors:**
| Status | When |
|--------|------|
| 401 | Not authenticated |
| 403 | Authenticated but not SuperAdmin |

---

### GET /auth/admin-only

Accessible by `Admin` role only.

**Success Response (200):**

```json
{
  "statusCode": 200,
  "data": "You are an admin!",
  "message": "Admin access granted.",
  "timestamp": "20xx-02-28T10:00:00"
}
```

**Errors:**
| Status | When |
|--------|------|
| 401 | Not authenticated |
| 403 | Authenticated but not Admin |

---

## 5. User–Role Assignment

### GET /user/{userId}/roles

List all roles assigned to a user.

**Success Response (200):**

```json
{
  "statusCode": 200,
  "data": [
    { "id": "guid", "name": "Admin", "description": "Administrator role" }
  ],
  "message": "Roles retrieved successfully.",
  "timestamp": "20xx-02-28T10:00:00"
}
```

**Errors:**
| Status | When |
|--------|------|
| 404 | User not found |

---

### POST /user/{userId}/roles

Assign a role to a user. Idempotent — assigning an already-held role returns 200.

**Request Body:**

```json
{ "roleId": "guid" }
```

**Success Response (200):**

```json
{
  "statusCode": 200,
  "data": "Role assigned.",
  "message": "Role assigned successfully.",
  "timestamp": "20xx-02-28T10:00:00"
}
```

**Errors:**
| Status | When |
|--------|------|
| 404 | User not found |
| 404 | Role not found |

---

### DELETE /user/{userId}/roles/{roleId}

Revoke a role from a user.

**Success Response:** `204 No Content`

**Errors:**
| Status | When |
|--------|------|
| 404 | User not found |
| 404 | Role not assigned to user |

---
