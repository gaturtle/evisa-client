# Evisa API Specification

**Base URL:** `{{BASE_URL}}`  
**API Version:** `v1`

---

## Authentication

JWT Bearer authentication is enforced on protected endpoints. Obtain a token via `POST /api/v1/auth/login` and pass it in the `Authorization` header:

```
Authorization: Bearer <token>
```

Tokens expire after **8 hours**. No refresh token mechanism — re-authenticate to get a new token.

### Roles

| Role | Description |
|------|-------------|
| `Admin` | Full access — reference data CRUD, application management, user management |
| `Staff` | Read-only access to applications; blocked from reference data CRUD and user management |

### Endpoint authorization summary

| Endpoint group | Rule |
|---|---|
| `POST /api/v1/auth/login` | Public |
| `GET /api/v1/applications/track`, `GET /api/v1/applications/track/document` | Public |
| `POST /api/v1/applications` | Public |
| `PATCH /api/v1/applications/{id}/payment-confirm` | Public |
| `GET /api/v1/applications`, `GET /api/v1/applications/{id}`, `PATCH /{id}/status`, `GET /{id}/payment` | `[Authorize]` (any authenticated user) |
| `PUT /api/v1/applications/{id}`, `DELETE /api/v1/applications/{id}`, `POST /{id}/document`, `POST /{id}/applicants/{applicantId}/document` | `[Authorize]` (any authenticated user) |
| `GET/POST/PUT/DELETE /api/v1/nationality` | `Admin` only |
| `GET/POST/PUT/DELETE /api/v1/visa-type` | `Admin` only |
| `GET/POST/PUT/DELETE /api/v1/visa-processing` | `Admin` only |
| `GET/POST/PUT/DELETE /api/v1/holidays` | `Admin` only |
| `POST/GET/PUT/DELETE /api/v1/auth/users` | `Admin` only |
| `GET /api/v1/categories`, `GET /api/v1/posts`, `GET /api/v1/posts/{slug}` | Public |
| `POST/PUT/DELETE /api/v1/categories`, `POST/PUT/DELETE /api/v1/posts`, `PATCH /api/v1/posts/{id}/status` | `[Authorize]` (any authenticated user) |

---

## Common Response Format

All endpoints return a unified `ApiResponse<T>` wrapper:

| Field | Type | Description |
|-------|------|-------------|
| statusCode | integer | HTTP status code |
| data | T \| null | Response payload |
| message | string | Human-readable result message |
| timestamp | string (ISO 8601 UTC) | Time the response was generated |

```json
{
  "statusCode": 200,
  "data": { },
  "message": "Success",
  "timestamp": "2026-06-06T10:00:00"
}
```

### Common Error Response

```json
{
  "statusCode": 404,
  "data": null,
  "message": "<resource> not found",
  "timestamp": "2026-06-06T10:00:00"
}
```

---

## Entities

### VisaApplication

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| id | string (UUID) | No | Unique identifier |
| referenceNumber | string | No | Server-generated reference — `"EV"` + 8 uppercase chars |
| purposeOfTravel | string | No | Reason for travel |
| visaTypeId | string (UUID) | No | FK → VisaType |
| processingOptionId | string (UUID) | No | FK → VisaProcessing |
| entryDate | string (ISO 8601) | No | Intended entry date |
| exitDate | string (ISO 8601) | No | Intended exit date |
| contactFullName | string | No | Primary contact full name |
| contactPhone | string | No | Primary contact phone |
| contactEmail | string | No | Primary contact email |
| contactAddress | string | No | Primary contact address |
| companyName | string | Yes | Sponsoring/host company name in Vietnam — set when purposeOfTravel is Business/Working, `null` otherwise |
| companyPhone | string | Yes | Company phone in Vietnam (`+84` prefixed) — set when purposeOfTravel is Business/Working, `null` otherwise |
| companyAddress | string | Yes | Company address in Vietnam — set when purposeOfTravel is Business/Working, `null` otherwise |
| isUrgentProcessing | boolean | No | Urgent processing requested |
| isMultipleEntry | boolean | No | Multiple entry requested |
| isAirportTransfer | boolean | No | Airport transfer requested |
| isOther | boolean | No | Other special request |
| notes | string | Yes | Free-text notes |
| emergencyContactName | string | Yes | Emergency contact full name — required when the shared applicant nationality has `requiresExtraDetails: true`, `null` otherwise |
| emergencyContactPhone | string | Yes | Emergency contact phone number — required under the same condition |
| emergencyContactRelationship | string | Yes | Emergency contact's relationship to the applicant — required under the same condition |
| emergencyContactAddress | string | Yes | Emergency contact address — required under the same condition |
| occupationCompanyName | string | Yes | Applicant's current employer name — required under the same condition |
| occupationJobTitle | string | Yes | Applicant's job title — required under the same condition |
| occupationCompanyPhone | string | Yes | Applicant's company phone number — required under the same condition |
| occupationCompanyAddress | string | Yes | Applicant's company address — required under the same condition |
| vnStayAddress | string | Yes | Temporary resident address in Vietnam — required under the same condition |
| vnStayPhone | string | Yes | Phone number in Vietnam — required under the same condition |
| vnVisitedLastYear | string | Yes | `"yes"` \| `"no"` — whether the applicant visited Vietnam in the last year; required under the same condition |
| vnVisitDetails | string | Yes | When and how long the applicant visited Vietnam — required under the same condition |
| vnHasRelatives | string | Yes | `"yes"` \| `"no"` — whether the applicant has relatives in Vietnam; required under the same condition |
| vnRelativeDetails | string | Yes | Relative details, if any — optional even when the other extra-details fields are required |
| status | integer | No | `0` Submitted · `1` UnderReview · `2` Approved · `3` Rejected · `4` RequiresAction · `5` Cancelled · `6` PendingReview |
| documentPath | string | Yes | Relative path to the admin-uploaded visa PDF (`documents/{referenceNumber}.pdf`); `null` until an admin uploads a document via `POST /api/v1/applications/{id}/document` |
| processingStartDate | string (ISO 8601 UTC) | Yes | Set on payment confirmation; `null` until then |
| completedDateTime | string (ISO 8601 UTC) | Yes | Set when status → Approved or Rejected; `null` until then |
| createdDateTime | string (ISO 8601) | No | Record creation time |
| modifiedDateTime | string (ISO 8601) | No | Last modification time |

### Payment

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| id | string (UUID) | No | Unique identifier |
| applicationId | string (UUID) | No | FK → VisaApplication |
| stripeIntentId | string | No | Stripe PaymentIntent ID |
| amount | number (decimal) | No | Charged amount |
| currency | string | No | Currency code (default: `"usd"`) |
| status | integer | No | `0` Pending · `1` Succeeded · `2` Failed |
| createdDateTime | string (ISO 8601) | No | Record creation time |

### Applicant

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| id | string (UUID) | No | Unique identifier |
| applicationId | string (UUID) | No | FK → VisaApplication |
| firstName | string | No | Applicant first name |
| lastName | string | No | Applicant last name |
| nationalityId | string (UUID) | Yes | FK → VisaNationality.Id — no EF navigation property, resolved via manual lookup |
| passportPhotoPath | string | Yes | Relative path to passport photo on disk |
| portraitPhotoPath | string | Yes | Relative path to portrait photo on disk |
| documentPath | string | Yes | Relative path to this applicant's individual visa PDF (`documents/{referenceNumber}/{firstName}_{lastName}.pdf`); `null` until uploaded via `POST /api/v1/applications/{id}/applicants/{applicantId}/document` |
| religion | string | Yes | Applicant's religion — required when the applicant's nationality has `requiresExtraDetails: true`, `null` otherwise |
| phoneInCountry | string | Yes | Applicant's phone number in their home country — required under the same condition |
| usedOtherPassport | string | Yes | `"yes"` \| `"no"` — whether the applicant has used another passport to enter Vietnam; required under the same condition |
| otherPassportNumber | string | Yes | Other passport number — required under the same condition |
| violatedLaws | string | Yes | `"yes"` \| `"no"` — whether the applicant has violated Vietnamese laws/regulations; required under the same condition |
| violationDetails | string | Yes | Violation details, if any — optional even when the other extra-details fields are required |

### VisaNationality

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| id | string (UUID) | No | Unique identifier |
| origName | string | No | Name in English |
| vietnameseName | string | No | Name in Vietnamese |
| isEligible | boolean | No | Whether the nationality is eligible for e-visa |
| exemptionDays | integer | Yes | Number of visa-free days granted; `null` means no exemption |
| groupId | string (UUID) | Yes | FK → NationalityGroup.Id; `null` if not assigned to a group. A nationality belongs to at most one group |
| requiresExtraDetails | boolean | No | When `true`, applicants of this nationality must submit the extra-details fields (religion, phone in home country, other-passport/violation questions, emergency contact, occupation, Vietnam stay/contact, Vietnam history) on `POST /api/v1/applications`. Independent of Restricted Group / PendingReview status — this flag is a standalone per-nationality setting (default: `false`) |

### NationalityGroup

A named cohort of nationalities that visa types and processing options can restrict/exclude as a unit.

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| id | string (UUID) | No | Unique identifier |
| name | string | No | Group display name |
| createdDateTime | string (ISO 8601) | No | Record creation time |
| modifiedDateTime | string (ISO 8601) | No | Last modification time |

### VisaType

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| id | string (UUID) | No | Unique identifier |
| description | string | No | Visa type description |
| price | number (decimal) | No | Price for this visa type |

### VisaProcessing

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| id | string (UUID) | No | Unique identifier |
| description | string | No | Processing option description |
| price | number (decimal) | No | Default price for this processing option |
| minDays | integer | Yes | Minimum processing days; `null` if not configured |
| maxDays | integer | Yes | Maximum processing days; `null` if not configured |
| isEmergency | boolean | No | Whether this tier is an emergency processing option (default: `false`) |
| effectivePrice | number (decimal) | No | Only present in the response of `GET /api/v1/visa-processing` when `nationalityId` is supplied — the price this nationality actually pays: the matching Nationality Price Override if one exists, otherwise equal to `price`. Absent from all other endpoints (`GET /{id}`, `POST`, `PUT`, and `GET /visa-processing` without `nationalityId`) |

### VisaProcessingNationalityPrice (Nationality Price Override)

A per-(VisaProcessing, Nationality) price that replaces a processing option's default `price` for applicants of that nationality. Independent of Excluded Group/Exception — a nationality can have a price override regardless of its exclusion/exception status, and having one never changes eligibility. At most one override exists per (VisaProcessing, Nationality) pair.

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| id | string (UUID) | No | Unique identifier |
| visaProcessingId | string (UUID) | No | FK → VisaProcessing.Id |
| nationalityId | string (UUID) | No | FK → VisaNationality.Id |
| price | number (decimal) | No | The overridden price for this (VisaProcessing, Nationality) pair |
| createdDateTime | string (ISO 8601) | No | Record creation time |
| modifiedDateTime | string (ISO 8601) | No | Last modification time — updated whenever the price is changed via upsert |

---

## 1. Applications

Base path: `/api/v1/applications`

---

### GET /api/v1/applications

List all applications with optional filtering and offset pagination. Sorted by `createdDateTime` descending.

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| status | integer | No | Filter by status value (see `ApplicationStatus`) |
| from | datetime | No | Filter — created on or after this date |
| to | datetime | No | Filter — created on or before this date |
| page | integer | No | Page number (default: `1`, min: `1`) |
| pageSize | integer | No | Items per page (default: `20`, max: `100`) |

#### Response `200 OK`

```json
{
  "statusCode": 200,
  "data": {
    "totalCount": 42,
    "page": 1,
    "pageSize": 20,
    "items": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "referenceNumber": "EV3A9F1C2B",
        "status": 0,
        "contactFullName": "John Doe",
        "contactEmail": "john@example.com",
        "createdDateTime": "2026-06-07T10:00:00",
        "applicantCount": 2,
        "visaTypeId": "a1b2c3d4-1111-4562-b3fc-2c963f66afa6",
        "processingOptionId": "b2c3d4e5-2222-4562-b3fc-2c963f66afa6"
      }
    ]
  },
  "message": "Applications retrieved successfully.",
  "timestamp": "2026-06-09T10:00:00"
}
```

---

### POST /api/v1/applications

Submit a new visa application with one or more applicants and their photo files.

**All applicants on the application must share the same `NationalityId`.** This is unconditional — the request is rejected with `400` if any two applicants have different nationalities, regardless of whether the selected processing option has a Nationality Price Override configured. Group bookings that genuinely mix nationalities must be submitted as separate applications, one per nationality.

The charged total is `(visaType.price + effectivePrice) × applicants.length`, where `effectivePrice` is the shared nationality's Nationality Price Override for `ProcessingOptionId` if one exists, otherwise `processingOption.price`. Check `GET /api/v1/visa-processing?nationalityId=...` beforehand to see the price that will actually be charged.

If `ProcessingOptionId` has an Excluded Group covering the applicants' nationality with no covering Exception, the request is rejected with `400` — check `GET /api/v1/visa-processing/{id}/excluded-groups` and `GET /api/v1/visa-processing/{id}/exceptions`, or filter the list via `?nationalityId=` before letting the user select it.

If `VisaTypeId` has a Restricted Group covering the applicants' nationality with no Exception, the application is still accepted, but `status` is set to `6` (`PendingReview`) instead of `0` (`Submitted`). There is no pre-submit signal for this — check `GET /api/v1/visa-type/{id}/restricted-groups` and `GET /api/v1/visa-type/{id}/exceptions` client-side if you want to warn the user before they submit.

**Extra details.** If the shared applicant `NationalityId` has `requiresExtraDetails: true` (see `GET /api/v1/nationality/{id}`), all of the extra-details fields below (per-applicant and application-level) become required and the request is rejected with `400` if any is missing/blank, or if either enum field isn't exactly `"yes"` or `"no"`. `ViolationDetails` and `VnRelativeDetails` stay optional even in that case. When the nationality's `requiresExtraDetails` is `false`, none of these fields are validated and any values sent are stored as-is.

**Content-Type:** `multipart/form-data`

#### Request Fields

**Application-level fields**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| PurposeOfTravel | string | Yes | Reason for travel |
| VisaTypeId | string (UUID) | Yes | ID of the selected visa type |
| ProcessingOptionId | string (UUID) | Yes | ID of the selected processing option |
| EntryDate | datetime | Yes | Intended entry date |
| ExitDate | datetime | Yes | Intended exit date |
| ContactFullName | string | Yes | Primary contact full name |
| ContactPhone | string | Yes | Primary contact phone |
| ContactEmail | string | Yes | Primary contact email |
| ContactAddress | string | Yes | Primary contact address |
| CompanyName | string | No | Sponsoring/host company name in Vietnam. Not enforced server-side — client should require it for Business/Working purposes |
| CompanyPhone | string | No | Company phone in Vietnam. Not enforced server-side — client should require it for Business/Working purposes |
| CompanyAddress | string | No | Company address in Vietnam. Not enforced server-side — client should require it for Business/Working purposes |
| IsUrgentProcessing | boolean | No | Default `false` |
| IsMultipleEntry | boolean | No | Default `false` |
| IsAirportTransfer | boolean | No | Default `false` |
| IsOther | boolean | No | Default `false` |
| Notes | string | No | Free-text notes |
| EmergencyContactName | string | Conditional | Emergency contact full name. Required only when the shared nationality has `requiresExtraDetails: true` |
| EmergencyContactPhone | string | Conditional | Emergency contact phone number. Required under the same condition |
| EmergencyContactRelationship | string | Conditional | Emergency contact's relationship to the applicant. Required under the same condition |
| EmergencyContactAddress | string | Conditional | Emergency contact address. Required under the same condition |
| OccupationCompanyName | string | Conditional | Applicant's current employer name. Required under the same condition |
| OccupationJobTitle | string | Conditional | Applicant's job title. Required under the same condition |
| OccupationCompanyPhone | string | Conditional | Applicant's company phone number. Required under the same condition |
| OccupationCompanyAddress | string | Conditional | Applicant's company address. Required under the same condition |
| VnStayAddress | string | Conditional | Temporary resident address in Vietnam. Required under the same condition |
| VnStayPhone | string | Conditional | Phone number in Vietnam. Required under the same condition |
| VnVisitedLastYear | string | Conditional | `"yes"` \| `"no"` — visited Vietnam in the last year. Required under the same condition |
| VnVisitDetails | string | Conditional | When and how long the applicant visited Vietnam. Required under the same condition |
| VnHasRelatives | string | Conditional | `"yes"` \| `"no"` — has relatives in Vietnam. Required under the same condition |
| VnRelativeDetails | string | No | Relative details, if any. Always optional |

**Per-applicant fields** (repeat for each applicant using indexed keys)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Applicants[N].FirstName | string | Yes | Applicant first name |
| Applicants[N].LastName | string | Yes | Applicant last name |
| Applicants[N].NationalityId | string (UUID) | Yes | FK → VisaNationality.Id; rejected with `400` if it doesn't resolve to an existing nationality |
| Applicants[N].PassportPhoto | file | No | Passport photo — max 5 MB |
| Applicants[N].PortraitPhoto | file | No | Portrait photo — max 5 MB |
| Applicants[N].Religion | string | Conditional | Applicant's religion. Required only when the shared nationality has `requiresExtraDetails: true` |
| Applicants[N].PhoneInCountry | string | Conditional | Applicant's phone number in their home country. Required under the same condition |
| Applicants[N].UsedOtherPassport | string | Conditional | `"yes"` \| `"no"` — used another passport to enter Vietnam. Required under the same condition |
| Applicants[N].OtherPassportNumber | string | Conditional | Other passport number. Required under the same condition |
| Applicants[N].ViolatedLaws | string | Conditional | `"yes"` \| `"no"` — violated Vietnamese laws/regulations. Required under the same condition |
| Applicants[N].ViolationDetails | string | No | Violation details, if any. Always optional |

> Replace `N` with `0`, `1`, `2`, … for each applicant.

#### Response `200 OK`

```json
{
  "statusCode": 200,
  "data": {
    "referenceNumber": "EV3A9F1C2B",
    "applicationId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "stripeClientSecret": "pi_3abc...secret_xyz"
  },
  "message": "Application submitted successfully.",
  "timestamp": "2026-06-07T10:00:00"
}
```

#### Response `400 Bad Request`

```json
{
  "statusCode": 400,
  "data": null,
  "message": "At least one applicant is required.",
  "timestamp": "2026-06-07T10:00:00"
}
```

Also returned (same shape, different `message`) when the processing option is Excluded for an applicant's nationality:

```json
{
  "statusCode": 400,
  "data": null,
  "message": "Selected processing option is not available for one or more applicants' nationality.",
  "timestamp": "2026-06-07T10:00:00"
}
```

Also returned when applicants don't all share the same nationality:

```json
{
  "statusCode": 400,
  "data": null,
  "message": "All applicants on an application must share the same nationality.",
  "timestamp": "2026-06-07T10:00:00"
}
```

Also returned (same shape, different `message`) when the shared nationality has `requiresExtraDetails: true` and a required extra-details field is missing/blank, e.g.:

```json
{
  "statusCode": 400,
  "data": null,
  "message": "Religion is required for the selected nationality.",
  "timestamp": "2026-06-07T10:00:00"
}
```

---

### GET /api/v1/applications/track

Look up an application by reference number and contact email. Returns the full status summary when both match. Always returns `404` on any mismatch to prevent reference number enumeration.

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| referenceNumber | string | Yes | Application reference number (e.g. `EV3A9F1C2B`) |
| email | string | Yes | Contact email used at submission |

#### Response `200 OK`

```json
{
  "statusCode": 200,
  "data": {
    "referenceNumber": "EV3A9F1C2B",
    "status": 1,
    "visaType": "Single Entry",
    "processingOption": "Standard",
    "purposeOfTravel": "Tourism",
    "entryDate": "2026-07-01T00:00:00",
    "exitDate": "2026-07-15T00:00:00",
    "contactFullName": "John Doe",
    "createdDateTime": "2026-06-07T10:00:00",
    "hasDocument": false,
    "processingStartDate": "2026-06-08T03:00:00Z",
    "completedDateTime": null,
    "applicants": [
      { "firstName": "John", "lastName": "Doe", "nationalityId": "6b7e1a2c-1111-4c1a-9f2b-abc123456789", "nationalityName": "American" }
    ]
  },
  "message": "Application found.",
  "timestamp": "2026-06-09T10:00:00"
}
```

#### Response `400 Bad Request`

```json
{
  "statusCode": 400,
  "data": null,
  "message": "referenceNumber and email are required.",
  "timestamp": "2026-06-09T10:00:00"
}
```

#### Response `404 Not Found`

```json
{
  "statusCode": 404,
  "data": null,
  "message": "Application not found.",
  "timestamp": "2026-06-09T10:00:00"
}
```

---

### GET /api/v1/applications/track/document

Download the approved visa document(s) for an application. Validates both reference number and contact email before serving the file.

- **Single applicant**: returns a PDF (`application/pdf`).
- **Multiple applicants**: returns a ZIP archive (`application/zip`) containing one PDF per applicant. The ZIP is assembled in-memory server-side. Returns `404` if any applicant's individual PDF has not yet been uploaded.

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| referenceNumber | string | Yes | Application reference number |
| email | string | Yes | Contact email used at submission |

#### Response `200 OK` — single applicant

```
Content-Disposition: attachment; filename="evisa_EV3A9F1C2B.pdf"
Content-Type: application/pdf
```

Binary PDF stream.

#### Response `200 OK` — multiple applicants

```
Content-Disposition: attachment; filename="evisa_EV3A9F1C2B.zip"
Content-Type: application/zip
```

Binary ZIP stream. Each entry inside the archive is named `evisa_{referenceNumber}_{firstName}_{lastName}.pdf` (spaces replaced with underscores, non-ASCII characters stripped).

#### Response `400 Bad Request`

```json
{
  "statusCode": 400,
  "data": null,
  "message": "referenceNumber and email are required.",
  "timestamp": "2026-06-09T10:00:00"
}
```

#### Response `404 Not Found`

```json
{
  "statusCode": 404,
  "data": null,
  "message": "Document not available.",
  "timestamp": "2026-06-09T10:00:00"
}
```

---

### GET /api/v1/applications/{id}

Get full detail for a single application, including all applicants and payment record.

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string (UUID) | Yes | Application ID |

#### Response `200 OK`

```json
{
  "statusCode": 200,
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "referenceNumber": "EV3A9F1C2B",
    "status": 0,
    "visaTypeId": "a1b2c3d4-1111-4562-b3fc-2c963f66afa6",
    "processingOptionId": "b2c3d4e5-2222-4562-b3fc-2c963f66afa6",
    "purposeOfTravel": "Tourism",
    "entryDate": "2026-07-01T00:00:00",
    "exitDate": "2026-07-15T00:00:00",
    "contactFullName": "John Doe",
    "contactPhone": "+1234567890",
    "contactEmail": "john@example.com",
    "contactAddress": "123 Main St",
    "companyName": null,
    "companyPhone": null,
    "companyAddress": null,
    "isUrgentProcessing": false,
    "isMultipleEntry": false,
    "isAirportTransfer": false,
    "isOther": false,
    "notes": null,
    "emergencyContactName": null,
    "emergencyContactPhone": null,
    "emergencyContactRelationship": null,
    "emergencyContactAddress": null,
    "occupationCompanyName": null,
    "occupationJobTitle": null,
    "occupationCompanyPhone": null,
    "occupationCompanyAddress": null,
    "vnStayAddress": null,
    "vnStayPhone": null,
    "vnVisitedLastYear": null,
    "vnVisitDetails": null,
    "vnHasRelatives": null,
    "vnRelativeDetails": null,
    "documentPath": null,
    "createdDateTime": "2026-06-07T10:00:00",
    "modifiedDateTime": "2026-06-07T10:00:00",
    "applicants": [
      {
        "id": "4fb96g75-6828-5673-c4gd-3d074g77bgb7",
        "firstName": "John",
        "lastName": "Doe",
        "nationalityId": "6b7e1a2c-1111-4c1a-9f2b-abc123456789",
        "nationalityName": "American",
        "passportPhotoPath": "uploads/3fa85f64.../0_passport_photo.jpg",
        "portraitPhotoPath": "uploads/3fa85f64.../0_portrait_photo.jpg",
        "documentPath": null,
        "religion": null,
        "phoneInCountry": null,
        "usedOtherPassport": null,
        "otherPassportNumber": null,
        "violatedLaws": null,
        "violationDetails": null
      }
    ],
    "payment": {
      "id": "5gc07h86-7939-6784-d5he-4e185h88chc8",
      "stripeIntentId": "pi_3abc123",
      "amount": 35.00,
      "currency": "usd",
      "status": 0,
      "createdDateTime": "2026-06-07T10:00:00"
    }
  },
  "message": "Application retrieved successfully.",
  "timestamp": "2026-06-09T10:00:00"
}
```

#### Response `404 Not Found`

```json
{
  "statusCode": 404,
  "data": null,
  "message": "Application not found.",
  "timestamp": "2026-06-09T10:00:00"
}
```

---

### POST /api/v1/applications/{id}/document

Upload a visa PDF for an approved application. Replaces any previously stored document. Requires an authenticated admin client.

**Content-Type:** `multipart/form-data`

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string (UUID) | Yes | Application ID |

#### Request Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| file | file | Yes | Visa PDF — `application/pdf` only, max 10 MB |

#### Response `204 No Content`

No response body. `documentPath` on the application record is updated to `documents/{referenceNumber}.pdf`.

#### Error responses

| Scenario | Status | Message |
|---|---|---|
| Application not found | 404 | `"Application '{id}' not found."` |
| Application not in `Approved` status | 422 | `"Document can only be uploaded for Approved applications."` |
| File is not a PDF | 400 | `"Only PDF files are accepted."` |
| No file provided | 400 | `"No file provided."` |
| File exceeds 10 MB | 413 | `"File exceeds the 10 MB limit."` |

---

### POST /api/v1/applications/{id}/applicants/{applicantId}/document

Upload an individual visa PDF for a specific applicant on an approved application. Used for multi-applicant applications where each person requires a separate document. Replaces any previously stored document for that applicant.

**Content-Type:** `multipart/form-data`

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string (UUID) | Yes | Application ID |
| applicantId | string (UUID) | Yes | Applicant ID — must belong to the application |

#### Request Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| file | file | Yes | Visa PDF — `application/pdf` only, max 10 MB |

#### Response `204 No Content`

No response body. `documentPath` on the applicant record is updated to `documents/{referenceNumber}/{firstName}_{lastName}.pdf`.

#### Error responses

| Scenario | Status | Message |
|---|---|---|
| Application not found | 404 | `"Application '{id}' not found."` |
| Applicant not found on this application | 404 | `"Applicant '{applicantId}' not found on this application."` |
| Application not in `Approved` status | 422 | `"Document can only be uploaded for Approved applications."` |
| File is not a PDF | 400 | `"Only PDF files are accepted."` |
| No file provided | 400 | `"No file provided."` |
| File exceeds 10 MB | 413 | `"File exceeds the 10 MB limit."` |

---

### PUT /api/v1/applications/{id}

Replace the contact details and applicant list for an application. Only allowed when status is `Submitted` (`0`) or `RequiresAction` (`4`). Applicants are replaced as a full list — existing applicant records are deleted and new ones are inserted.

**Content-Type:** `application/json`

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string (UUID) | Yes | Application ID |

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| contactFullName | string | Yes | Primary contact full name |
| contactPhone | string | Yes | Primary contact phone |
| contactEmail | string | Yes | Primary contact email |
| contactAddress | string | Yes | Primary contact address |
| companyName | string | No | Sponsoring/host company name in Vietnam. Not enforced server-side — client should require it for Business/Working purposes |
| companyPhone | string | No | Company phone in Vietnam. Not enforced server-side — client should require it for Business/Working purposes |
| companyAddress | string | No | Company address in Vietnam. Not enforced server-side — client should require it for Business/Working purposes |
| entryDate | datetime | Yes | Intended entry date |
| exitDate | datetime | Yes | Intended exit date |
| visaTypeId | string (UUID) | Yes | ID of the selected visa type |
| processingOptionId | string (UUID) | Yes | ID of the selected processing option |
| isUrgentProcessing | boolean | No | Default `false` |
| isMultipleEntry | boolean | No | Default `false` |
| isAirportTransfer | boolean | No | Default `false` |
| isOther | boolean | No | Default `false` |
| notes | string | No | Free-text notes |
| emergencyContactName | string | Conditional | Required only when the shared nationality across `applicants` has `requiresExtraDetails: true` |
| emergencyContactPhone | string | Conditional | Required under the same condition |
| emergencyContactRelationship | string | Conditional | Required under the same condition |
| emergencyContactAddress | string | Conditional | Required under the same condition |
| occupationCompanyName | string | Conditional | Required under the same condition |
| occupationJobTitle | string | Conditional | Required under the same condition |
| occupationCompanyPhone | string | Conditional | Required under the same condition |
| occupationCompanyAddress | string | Conditional | Required under the same condition |
| vnStayAddress | string | Conditional | Required under the same condition |
| vnStayPhone | string | Conditional | Required under the same condition |
| vnVisitedLastYear | string | Conditional | `"yes"` \| `"no"`; required under the same condition |
| vnVisitDetails | string | Conditional | Required under the same condition |
| vnHasRelatives | string | Conditional | `"yes"` \| `"no"`; required under the same condition |
| vnRelativeDetails | string | No | Always optional |
| applicants | array | Yes | Min 1 item — replaces all existing applicants |
| applicants[N].firstName | string | Yes | Applicant first name |
| applicants[N].lastName | string | Yes | Applicant last name |
| applicants[N].nationalityId | string (UUID) | Yes | FK → VisaNationality.Id; rejected with `400` if it doesn't resolve to an existing nationality |
| applicants[N].religion | string | Conditional | Required only when the applicants' shared nationality has `requiresExtraDetails: true` |
| applicants[N].phoneInCountry | string | Conditional | Required under the same condition |
| applicants[N].usedOtherPassport | string | Conditional | `"yes"` \| `"no"`; required under the same condition |
| applicants[N].otherPassportNumber | string | Conditional | Required under the same condition |
| applicants[N].violatedLaws | string | Conditional | `"yes"` \| `"no"`; required under the same condition |
| applicants[N].violationDetails | string | No | Always optional |

#### Response `200 OK`

```json
{
  "statusCode": 200,
  "data": null,
  "message": "Application updated successfully.",
  "timestamp": "2026-06-09T10:00:00"
}
```

#### Response `404 Not Found`

```json
{
  "statusCode": 404,
  "data": null,
  "message": "Application 'id' not found.",
  "timestamp": "2026-06-09T10:00:00"
}
```

#### Response `409 Conflict`

```json
{
  "statusCode": 409,
  "data": null,
  "message": "Application cannot be updated in 'UnderReview' status. Only Submitted or RequiresAction applications may be modified.",
  "timestamp": "2026-06-09T10:00:00"
}
```

#### Response `400 Bad Request`

Returned when the shared nationality across `applicants` has `requiresExtraDetails: true` and a required extra-details field is missing/blank (same validation as `POST /api/v1/applications`):

```json
{
  "statusCode": 400,
  "data": null,
  "message": "Emergency contact full name is required for the selected nationality.",
  "timestamp": "2026-06-09T10:00:00"
}
```

---

### DELETE /api/v1/applications/{id}

Permanently delete an application. Only allowed when status is `Cancelled` (`5`). Cascades to all `Applicants` and `Payment` records in the database, and removes the `uploads/{id}/` directory from disk.

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string (UUID) | Yes | Application ID |

#### Response `200 OK`

```json
{
  "statusCode": 200,
  "data": null,
  "message": "Application deleted successfully.",
  "timestamp": "2026-06-09T10:00:00"
}
```

#### Response `404 Not Found`

```json
{
  "statusCode": 404,
  "data": null,
  "message": "Application 'id' not found.",
  "timestamp": "2026-06-09T10:00:00"
}
```

#### Response `409 Conflict`

```json
{
  "statusCode": 409,
  "data": null,
  "message": "Application cannot be deleted in 'Submitted' status. Only Cancelled applications may be deleted.",
  "timestamp": "2026-06-09T10:00:00"
}
```

---

### GET /api/v1/applications/{id}/payment

Get the payment record for an application.

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string (UUID) | Yes | Application ID |

#### Response `200 OK`

```json
{
  "statusCode": 200,
  "data": {
    "id": "5gc07h86-7939-6784-d5he-4e185h88chc8",
    "stripeIntentId": "pi_3abc123",
    "amount": 35.00,
    "currency": "usd",
    "status": 1,
    "createdDateTime": "2026-06-07T10:00:00"
  },
  "message": "Payment retrieved successfully.",
  "timestamp": "2026-06-09T10:00:00"
}
```

#### Response `404 Not Found`

```json
{
  "statusCode": 404,
  "data": null,
  "message": "Payment not found.",
  "timestamp": "2026-06-09T10:00:00"
}
```

> Returns `404` both when the application ID does not exist and when no payment record is associated with the application.

---

### PATCH /api/v1/applications/{id}/status

Update the status of an application. Cannot be used to transition to `Submitted` (`0`) — that status is set automatically on submission.

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string (UUID) | Yes | Application ID |

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| status | integer | Yes | Target status value (any except `0` — Submitted) |
| reason | string | No | Optional reason/note sent in the status-change email |

```json
{
  "status": 3,
  "reason": "Documents did not meet the requirements."
}
```

#### Response `200 OK`

```json
{
  "statusCode": 200,
  "data": null,
  "message": "Application status updated successfully.",
  "timestamp": "2026-06-09T10:00:00"
}
```

#### Response `400 Bad Request`

```json
{
  "statusCode": 400,
  "data": null,
  "message": "Cannot manually transition to Submitted status.",
  "timestamp": "2026-06-09T10:00:00"
}
```

#### Response `404 Not Found`

```json
{
  "statusCode": 404,
  "data": null,
  "message": "Application 'id' not found.",
  "timestamp": "2026-06-09T10:00:00"
}
```

---

### PATCH /api/v1/applications/{id}/payment-confirm

Confirm that a Stripe payment has been completed for an application. Updates the `Payment` record status to `Succeeded` and the `VisaApplication` status to `UnderReview`.

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string (UUID) | Yes | Application ID |

#### Response `200 OK`

```json
{
  "statusCode": 200,
  "data": {
    "referenceNumber": "EV3A9F1C2B"
  },
  "message": "Payment confirmed successfully.",
  "timestamp": "2026-06-07T10:00:00"
}
```

#### Response `404 Not Found`

```json
{
  "statusCode": 404,
  "data": null,
  "message": "Application not found",
  "timestamp": "2026-06-07T10:00:00"
}
```

---

## 2. Nationality

Base path: `/api/v1/nationality`

---

### GET /api/v1/nationality

Get all nationalities.

#### Response `200 OK`

```json
{
  "statusCode": 200,
  "data": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "origName": "Vietnamese",
      "vietnameseName": "Việt Nam",
      "isEligible": true,
      "exemptionDays": 90,
      "requiresExtraDetails": false
    }
  ],
  "message": "Success",
  "timestamp": "2026-06-06T10:00:00"
}
```

---

### GET /api/v1/nationality/{id}

Get a single nationality by ID.

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string (UUID) | Yes | Nationality ID |

#### Response `200 OK`

```json
{
  "statusCode": 200,
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "origName": "Vietnamese",
    "vietnameseName": "Việt Nam",
    "isEligible": true,
    "exemptionDays": 90,
    "requiresExtraDetails": false
  },
  "message": "Success",
  "timestamp": "2026-06-06T10:00:00"
}
```

#### Response `404 Not Found`

```json
{
  "statusCode": 404,
  "data": null,
  "message": "Nationality not found",
  "timestamp": "2026-06-06T10:00:00"
}
```

---

### POST /api/v1/nationality

Create a new nationality.

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| origName | string | Yes | Name in English |
| vietnameseName | string | Yes | Name in Vietnamese |
| isEligible | boolean | No | Eligible for e-visa (default: `false`) |
| exemptionDays | integer | No | Visa-free days; omit or send `null` for no exemption |
| groupId | string (UUID) | No | FK → NationalityGroup.Id; omit or send `null` to leave ungrouped |
| requiresExtraDetails | boolean | No | When `true`, applicants of this nationality must submit the extra-details fields on `POST /api/v1/applications` (default: `false`) |

```json
{
  "origName": "Vietnamese",
  "vietnameseName": "Việt Nam",
  "isEligible": true,
  "exemptionDays": 90,
  "groupId": null,
  "requiresExtraDetails": false
}
```

#### Response `201 Created`

```json
{
  "statusCode": 201,
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "origName": "Vietnamese",
    "vietnameseName": "Việt Nam",
    "isEligible": true,
    "exemptionDays": null,
    "requiresExtraDetails": false
  },
  "message": "Created successfully",
  "timestamp": "2026-06-06T10:00:00"
}
```

---

### PUT /api/v1/nationality/{id}

Update an existing nationality.

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string (UUID) | Yes | Nationality ID |

#### Request Body

Same schema as `POST /api/v1/nationality`. Send `"exemptionDays": null` to clear an existing exemption.

#### Response `200 OK`

```json
{
  "statusCode": 200,
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "origName": "Vietnamese",
    "vietnameseName": "Việt Nam",
    "isEligible": false,
    "exemptionDays": null,
    "requiresExtraDetails": false
  },
  "message": "Updated successfully",
  "timestamp": "2026-06-06T10:00:00"
}
```

#### Response `404 Not Found`

```json
{
  "statusCode": 404,
  "data": null,
  "message": "Nationality not found",
  "timestamp": "2026-06-06T10:00:00"
}
```

---

### DELETE /api/v1/nationality/{id}

Delete a nationality.

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string (UUID) | Yes | Nationality ID |

#### Response `200 OK`

```json
{
  "statusCode": 200,
  "data": "",
  "message": "Deleted successfully",
  "timestamp": "2026-06-06T10:00:00"
}
```

#### Response `404 Not Found`

```json
{
  "statusCode": 404,
  "data": null,
  "message": "Nationality not found",
  "timestamp": "2026-06-06T10:00:00"
}
```

---

## 3. Nationality Group

Base path: `/api/v1/nationality-group`

A `NationalityGroup` is a named cohort of nationalities (see `VisaNationality.groupId`). Visa Types use groups to flag mandatory review (Restricted Group); Visa Processing options use groups to hard-remove themselves as a choice (Excluded Group). See sections 4 and 5.

---

### GET /api/v1/nationality-group

Get all nationality groups.

**Authorization:** Public

#### Response `200 OK`

```json
{
  "statusCode": 200,
  "data": [
    { "id": "d1e2f3a4-0001-4562-b3fc-2c963f66afa6", "name": "High Risk", "createdDateTime": "2026-06-06T10:00:00", "modifiedDateTime": "2026-06-06T10:00:00" }
  ],
  "message": "Success",
  "timestamp": "2026-06-06T10:00:00"
}
```

---

### GET /api/v1/nationality-group/{id}

Get a single nationality group by ID.

**Authorization:** Public

#### Response `404 Not Found`

```json
{ "statusCode": 404, "data": null, "message": "Nationality group not found", "timestamp": "2026-06-06T10:00:00" }
```

---

### POST /api/v1/nationality-group

Create a new nationality group.

**Authorization:** `Admin` only

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Group display name |

```json
{ "name": "High Risk" }
```

#### Response `201 Created`

Returns the created `NationalityGroup`.

---

### PUT /api/v1/nationality-group/{id}

Update a nationality group's name.

**Authorization:** `Admin` only

Same request schema as `POST`. Returns `404` if `id` doesn't exist.

---

### DELETE /api/v1/nationality-group/{id}

Permanently delete a nationality group.

**Authorization:** `Admin` only

Returns `404` if `id` doesn't exist.

---

## 4. Visa Type

Base path: `/api/v1/visa-type`

---

### GET /api/v1/visa-type

Get all visa types.

#### Response `200 OK`

```json
{
  "statusCode": 200,
  "data": [
    {
      "id": "a1b2c3d4-1111-4562-b3fc-2c963f66afa6",
      "description": "Single Entry",
      "price": 25.00
    }
  ],
  "message": "Success",
  "timestamp": "2026-06-06T10:00:00"
}
```

---

### GET /api/v1/visa-type/{id}

Get a single visa type by ID.

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string (UUID) | Yes | Visa type ID |

#### Response `200 OK`

```json
{
  "statusCode": 200,
  "data": {
    "id": "a1b2c3d4-1111-4562-b3fc-2c963f66afa6",
    "description": "Single Entry",
    "price": 25.00
  },
  "message": "Success",
  "timestamp": "2026-06-06T10:00:00"
}
```

#### Response `404 Not Found`

```json
{
  "statusCode": 404,
  "data": null,
  "message": "Visa type not found",
  "timestamp": "2026-06-06T10:00:00"
}
```

---

### POST /api/v1/visa-type

Create a new visa type.

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| description | string | Yes | Visa type description |
| price | number (decimal) | Yes | Price for this visa type |

```json
{
  "description": "Single Entry",
  "price": 25.00
}
```

#### Response `201 Created`

```json
{
  "statusCode": 201,
  "data": {
    "id": "a1b2c3d4-1111-4562-b3fc-2c963f66afa6",
    "description": "Single Entry",
    "price": 25.00
  },
  "message": "Created successfully",
  "timestamp": "2026-06-06T10:00:00"
}
```

---

### PUT /api/v1/visa-type/{id}

Update an existing visa type.

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string (UUID) | Yes | Visa type ID |

#### Request Body

Same schema as `POST /api/v1/visa-type`.

#### Response `200 OK`

```json
{
  "statusCode": 200,
  "data": {
    "id": "a1b2c3d4-1111-4562-b3fc-2c963f66afa6",
    "description": "Multiple Entry",
    "price": 30.00
  },
  "message": "Updated successfully",
  "timestamp": "2026-06-06T10:00:00"
}
```

#### Response `404 Not Found`

```json
{
  "statusCode": 404,
  "data": null,
  "message": "Visa type not found",
  "timestamp": "2026-06-06T10:00:00"
}
```

---

### DELETE /api/v1/visa-type/{id}

Delete a visa type.

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string (UUID) | Yes | Visa type ID |

#### Response `200 OK`

```json
{
  "statusCode": 200,
  "data": "",
  "message": "Deleted successfully",
  "timestamp": "2026-06-06T10:00:00"
}
```

#### Response `404 Not Found`

```json
{
  "statusCode": 404,
  "data": null,
  "message": "Visa type not found",
  "timestamp": "2026-06-06T10:00:00"
}
```

---

### GET /api/v1/visa-type/{id}/restricted-groups

Get the `NationalityGroup`s flagged as Restricted for this visa type. An applicant whose nationality belongs to one of these groups is submitted with `PendingReview` status for this visa type, unless an Exception covers that (visa type, nationality) pair. Unlike an Excluded Group on Visa Processing, a Restricted Group is never used to filter or hide the visa type itself — the frontend must fetch this list explicitly to know a selection will trigger review.

**Authorization:** Public

#### Response `200 OK`

```json
{
  "statusCode": 200,
  "data": [
    { "id": "d1e2f3a4-0001-4562-b3fc-2c963f66afa6", "name": "High Risk", "createdDateTime": "2026-06-06T10:00:00", "modifiedDateTime": "2026-06-06T10:00:00" }
  ],
  "message": "Success",
  "timestamp": "2026-06-06T10:00:00"
}
```

#### Response `404 Not Found`

```json
{ "statusCode": 404, "data": null, "message": "Visa type not found", "timestamp": "2026-06-06T10:00:00" }
```

---

### POST /api/v1/visa-type/{id}/restricted-groups/{groupId}

Add a `NationalityGroup` as a Restricted Group for this visa type. Idempotent — succeeds if the restriction already exists.

**Authorization:** `Admin` only

#### Response `200 OK`

```json
{ "statusCode": 200, "data": "", "message": "Restricted group added successfully", "timestamp": "2026-06-06T10:00:00" }
```

#### Response `404 Not Found`

```json
{ "statusCode": 404, "data": null, "message": "Visa type or nationality group not found", "timestamp": "2026-06-06T10:00:00" }
```

---

### DELETE /api/v1/visa-type/{id}/restricted-groups/{groupId}

Remove a Restricted Group from this visa type.

**Authorization:** `Admin` only

#### Response `404 Not Found`

```json
{ "statusCode": 404, "data": null, "message": "Restricted group not found", "timestamp": "2026-06-06T10:00:00" }
```

---

### GET /api/v1/visa-type/{id}/exceptions

Get the `VisaNationality` records that have an Exception for this visa type — a specific (VisaType, Nationality) pair that lifts a group restriction for that pair only. Does not carry over to other visa types.

**Authorization:** Public

#### Response `200 OK`

```json
{
  "statusCode": 200,
  "data": [
    { "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6", "origName": "Vietnamese", "vietnameseName": "Việt Nam", "isEligible": true, "exemptionDays": 90, "groupId": "d1e2f3a4-0001-4562-b3fc-2c963f66afa6", "requiresExtraDetails": false }
  ],
  "message": "Success",
  "timestamp": "2026-06-06T10:00:00"
}
```

#### Response `404 Not Found`

```json
{ "statusCode": 404, "data": null, "message": "Visa type not found", "timestamp": "2026-06-06T10:00:00" }
```

---

### POST /api/v1/visa-type/{id}/exceptions

Add an Exception for a nationality on this visa type. Idempotent. The exception doesn't need to correspond to an actual restriction — adding one for a nationality that isn't in a restricted group is allowed and simply has no effect.

**Authorization:** `Admin` only

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| nationalityId | string (UUID) | Yes | FK → VisaNationality.Id |

```json
{ "nationalityId": "3fa85f64-5717-4562-b3fc-2c963f66afa6" }
```

#### Response `200 OK`

```json
{ "statusCode": 200, "data": "", "message": "Exception added successfully", "timestamp": "2026-06-06T10:00:00" }
```

#### Response `404 Not Found`

```json
{ "statusCode": 404, "data": null, "message": "Visa type or nationality not found", "timestamp": "2026-06-06T10:00:00" }
```

---

### DELETE /api/v1/visa-type/{id}/exceptions

Remove a nationality's Exception on this visa type.

**Authorization:** `Admin` only

#### Request Body

Same schema as `POST /api/v1/visa-type/{id}/exceptions`.

#### Response `404 Not Found`

```json
{ "statusCode": 404, "data": null, "message": "Exception not found", "timestamp": "2026-06-06T10:00:00" }
```

---

## 5. Visa Processing

Base path: `/api/v1/visa-processing`

---

### GET /api/v1/visa-processing

Get all visa processing options. When `nationalityId` is supplied, options that have an Excluded Group covering that nationality — with no covering Exception — are removed from the returned list entirely (contrast with Visa Type Restricted Groups, which are never filtered out of `GET /api/v1/visa-type`), and each remaining option's `effectivePrice` reflects that nationality's Nationality Price Override, if any.

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| nationalityId | string (UUID) | No | A single `VisaNationality.Id`. When present, options excluded for this nationality are omitted, and each returned option's `effectivePrice` is resolved for it. When omitted, `effectivePrice` equals `price` for every option (unaffected by any configured overrides) |

#### Response `200 OK` — without `nationalityId`

```json
{
  "statusCode": 200,
  "data": [
    {
      "id": "b2c3d4e5-2222-4562-b3fc-2c963f66afa6",
      "description": "Standard",
      "price": 10.00,
      "effectivePrice": 10.00,
      "minDays": 5,
      "maxDays": 7,
      "isEmergency": false
    }
  ],
  "message": "Success",
  "timestamp": "2026-06-06T10:00:00"
}
```

#### Response `200 OK` — with `?nationalityId=...` and an override configured

```json
{
  "statusCode": 200,
  "data": [
    {
      "id": "b2c3d4e5-2222-4562-b3fc-2c963f66afa6",
      "description": "Standard",
      "price": 10.00,
      "effectivePrice": 8.00,
      "minDays": 5,
      "maxDays": 7,
      "isEmergency": false
    }
  ],
  "message": "Success",
  "timestamp": "2026-06-06T10:00:00"
}
```

#### Response `400 Bad Request`

```json
{
  "statusCode": 400,
  "data": null,
  "message": "Invalid nationalityId 'not-a-guid'.",
  "timestamp": "2026-06-06T10:00:00"
}
```

---

### GET /api/v1/visa-processing/{id}

Get a single visa processing option by ID.

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string (UUID) | Yes | Visa processing ID |

#### Response `200 OK`

```json
{
  "statusCode": 200,
  "data": {
    "id": "b2c3d4e5-2222-4562-b3fc-2c963f66afa6",
    "description": "Standard",
    "price": 10.00,
    "minDays": 5,
    "maxDays": 7,
    "isEmergency": false
  },
  "message": "Success",
  "timestamp": "2026-06-06T10:00:00"
}
```

#### Response `404 Not Found`

```json
{
  "statusCode": 404,
  "data": null,
  "message": "Visa processing not found",
  "timestamp": "2026-06-06T10:00:00"
}
```

---

### POST /api/v1/visa-processing

Create a new visa processing option.

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| description | string | Yes | Processing option description |
| price | number (decimal) | Yes | Price for this processing option |
| minDays | integer | No | Minimum processing days |
| maxDays | integer | No | Maximum processing days |
| isEmergency | boolean | No | Mark as emergency tier (default: `false`) |

```json
{
  "description": "Standard",
  "price": 10.00,
  "isEmergency": false
}
```

#### Response `201 Created`

```json
{
  "statusCode": 201,
  "data": {
    "id": "b2c3d4e5-2222-4562-b3fc-2c963f66afa6",
    "description": "Standard",
    "price": 10.00,
    "minDays": 5,
    "maxDays": 7,
    "isEmergency": false
  },
  "message": "Created successfully",
  "timestamp": "2026-06-06T10:00:00"
}
```

---

### PUT /api/v1/visa-processing/{id}

Update an existing visa processing option.

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string (UUID) | Yes | Visa processing ID |

#### Request Body

Same schema as `POST /api/v1/visa-processing`.

#### Response `200 OK`

```json
{
  "statusCode": 200,
  "data": {
    "id": "b2c3d4e5-2222-4562-b3fc-2c963f66afa6",
    "description": "Express",
    "price": 20.00,
    "minDays": 2,
    "maxDays": 3,
    "isEmergency": false
  },
  "message": "Updated successfully",
  "timestamp": "2026-06-06T10:00:00"
}
```

#### Response `404 Not Found`

```json
{
  "statusCode": 404,
  "data": null,
  "message": "Visa processing not found",
  "timestamp": "2026-06-06T10:00:00"
}
```

---

### DELETE /api/v1/visa-processing/{id}

Delete a visa processing option.

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string (UUID) | Yes | Visa processing ID |

#### Response `200 OK`

```json
{
  "statusCode": 200,
  "data": "",
  "message": "Deleted successfully",
  "timestamp": "2026-06-06T10:00:00"
}
```

#### Response `404 Not Found`

```json
{
  "statusCode": 404,
  "data": null,
  "message": "Visa processing not found",
  "timestamp": "2026-06-06T10:00:00"
}
```

---

### GET /api/v1/visa-processing/{id}/excluded-groups

Get the `NationalityGroup`s flagged as Excluded for this processing option. An applicant whose nationality belongs to one of these groups cannot select this option — it's dropped from `GET /api/v1/visa-processing?nationalityId=...`, and submitting it anyway via `POST /api/v1/applications` is rejected outright with `400` rather than routed to `PendingReview` — unless an Exception covers that (VisaProcessing, Nationality) pair, in which case the option is fully available again. See `GET /api/v1/visa-processing/{id}/exceptions`.

**Authorization:** Public

#### Response `200 OK`

```json
{
  "statusCode": 200,
  "data": [
    { "id": "d1e2f3a4-0001-4562-b3fc-2c963f66afa6", "name": "High Risk", "createdDateTime": "2026-06-06T10:00:00", "modifiedDateTime": "2026-06-06T10:00:00" }
  ],
  "message": "Success",
  "timestamp": "2026-06-06T10:00:00"
}
```

#### Response `404 Not Found`

```json
{ "statusCode": 404, "data": null, "message": "Visa processing not found", "timestamp": "2026-06-06T10:00:00" }
```

---

### POST /api/v1/visa-processing/{id}/excluded-groups/{groupId}

Add a `NationalityGroup` as an Excluded Group for this processing option. Idempotent.

**Authorization:** `Admin` only

#### Response `200 OK`

```json
{ "statusCode": 200, "data": "", "message": "Excluded group added successfully", "timestamp": "2026-06-06T10:00:00" }
```

#### Response `404 Not Found`

```json
{ "statusCode": 404, "data": null, "message": "Visa processing or nationality group not found", "timestamp": "2026-06-06T10:00:00" }
```

---

### DELETE /api/v1/visa-processing/{id}/excluded-groups/{groupId}

Remove an Excluded Group from this processing option.

**Authorization:** `Admin` only

#### Response `404 Not Found`

```json
{ "statusCode": 404, "data": null, "message": "Excluded group not found", "timestamp": "2026-06-06T10:00:00" }
```

---

### GET /api/v1/visa-processing/{id}/exceptions

Get the `VisaNationality` records that have an Exception for this processing option — a specific (VisaProcessing, Nationality) pair that fully lifts an Excluded Group's block for that pair only, as if the exclusion never applied. Does not carry over to other processing options.

**Authorization:** Public

#### Response `200 OK`

```json
{
  "statusCode": 200,
  "data": [
    { "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6", "origName": "Vietnamese", "vietnameseName": "Việt Nam", "isEligible": true, "exemptionDays": 90, "groupId": "d1e2f3a4-0001-4562-b3fc-2c963f66afa6", "requiresExtraDetails": false }
  ],
  "message": "Success",
  "timestamp": "2026-06-06T10:00:00"
}
```

#### Response `404 Not Found`

```json
{ "statusCode": 404, "data": null, "message": "Visa processing not found", "timestamp": "2026-06-06T10:00:00" }
```

---

### POST /api/v1/visa-processing/{id}/exceptions

Add an Exception for a nationality on this processing option. Idempotent. The exception doesn't need to correspond to an actual exclusion — adding one for a nationality that isn't in an excluded group is allowed and simply has no effect.

**Authorization:** `Admin` only

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| nationalityId | string (UUID) | Yes | FK → VisaNationality.Id |

```json
{ "nationalityId": "3fa85f64-5717-4562-b3fc-2c963f66afa6" }
```

#### Response `200 OK`

```json
{ "statusCode": 200, "data": "", "message": "Exception added successfully", "timestamp": "2026-06-06T10:00:00" }
```

#### Response `404 Not Found`

```json
{ "statusCode": 404, "data": null, "message": "Visa processing or nationality not found", "timestamp": "2026-06-06T10:00:00" }
```

---

### DELETE /api/v1/visa-processing/{id}/exceptions

Remove a nationality's Exception on this processing option.

**Authorization:** `Admin` only

#### Request Body

Same schema as `POST /api/v1/visa-processing/{id}/exceptions`.

#### Response `404 Not Found`

```json
{ "statusCode": 404, "data": null, "message": "Exception not found", "timestamp": "2026-06-06T10:00:00" }
```

---

### GET /api/v1/visa-processing/{id}/nationality-prices

Get the Nationality Price Overrides configured for this processing option.

**Authorization:** Public

#### Response `200 OK`

```json
{
  "statusCode": 200,
  "data": [
    {
      "id": "f1a2b3c4-0001-4562-b3fc-2c963f66afa6",
      "visaProcessingId": "b2c3d4e5-2222-4562-b3fc-2c963f66afa6",
      "nationalityId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "price": 8.00,
      "createdDateTime": "2026-06-06T10:00:00",
      "modifiedDateTime": "2026-06-06T10:00:00"
    }
  ],
  "message": "Success",
  "timestamp": "2026-06-06T10:00:00"
}
```

#### Response `404 Not Found`

```json
{ "statusCode": 404, "data": null, "message": "Visa processing not found", "timestamp": "2026-06-06T10:00:00" }
```

---

### POST /api/v1/visa-processing/{id}/nationality-prices

Set the price override for a nationality on this processing option. **Upsert** — if a price is already configured for this (VisaProcessing, Nationality) pair, it is replaced with the new value rather than rejected as a duplicate.

**Authorization:** `Admin` only

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| nationalityId | string (UUID) | Yes | FK → VisaNationality.Id |
| price | number (decimal) | Yes | The overridden price for this nationality |

```json
{ "nationalityId": "3fa85f64-5717-4562-b3fc-2c963f66afa6", "price": 8.00 }
```

#### Response `200 OK`

```json
{ "statusCode": 200, "data": "", "message": "Nationality price saved successfully", "timestamp": "2026-06-06T10:00:00" }
```

#### Response `404 Not Found`

```json
{ "statusCode": 404, "data": null, "message": "Visa processing or nationality not found", "timestamp": "2026-06-06T10:00:00" }
```

---

### DELETE /api/v1/visa-processing/{id}/nationality-prices

Remove a nationality's price override on this processing option, reverting that nationality to the option's default `price`.

**Authorization:** `Admin` only

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| nationalityId | string (UUID) | Yes | FK → VisaNationality.Id |

```json
{ "nationalityId": "3fa85f64-5717-4562-b3fc-2c963f66afa6" }
```

#### Response `404 Not Found`

```json
{ "statusCode": 404, "data": null, "message": "Nationality price not found", "timestamp": "2026-06-06T10:00:00" }
```

---

## 6. Holidays

Base path: `/api/v1/holidays`

---

### GET /api/v1/holidays

Return all public holidays for a given year, ordered by date. Used by the frontend to calculate estimated return dates excluding non-working days.

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| year | integer | Yes | Calendar year (e.g. `2026`) |

#### Response `200 OK`

```json
{
  "statusCode": 200,
  "data": [
    { "date": "2026-01-01T00:00:00", "name": "New Year's Day" },
    { "date": "2026-01-27T00:00:00", "name": "Tết Holiday" }
  ],
  "message": "Holidays retrieved successfully.",
  "timestamp": "2026-06-10T00:00:00"
}
```

Returns an empty array (`[]`) if no holidays are seeded for the requested year.

#### Response `400 Bad Request`

```json
{
  "statusCode": 400,
  "data": null,
  "message": "year query parameter is required.",
  "timestamp": "2026-06-10T00:00:00"
}
```

---

## 7. Auth

Base path: `/api/v1/auth`

---

### POST /api/v1/auth/login

Authenticate with email and password. Returns a JWT bearer token.

**Authorization:** Public

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string | Yes | Admin user email |
| password | string | Yes | Admin user password |

```json
{
  "email": "admin@example.com",
  "password": "YourPassword123!"
}
```

#### Response `200 OK`

```json
{
  "statusCode": 200,
  "data": {
    "token": "eyJhbGci...",
    "expiresAt": "2026-06-12T18:00:00",
    "role": "Admin"
  },
  "message": "Login successful",
  "timestamp": "2026-06-12T10:00:00"
}
```

#### Response `401 Unauthorized`

```json
{
  "statusCode": 401,
  "data": null,
  "message": "Invalid credentials or account is inactive",
  "timestamp": "2026-06-12T10:00:00"
}
```

---

### POST /api/v1/auth/users

Create a new admin user with a specified role.

**Authorization:** `Admin` only

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string | Yes | New user's email address |
| fullName | string | Yes | New user's full name |
| password | string | Yes | Initial password |
| role | string | Yes | `"Admin"` or `"Staff"` |

```json
{
  "email": "staff@example.com",
  "fullName": "Jane Smith",
  "password": "Password123!",
  "role": "Staff"
}
```

#### Response `201 Created`

```json
{
  "statusCode": 201,
  "data": {
    "id": "e452e0f5-8476-4687-8891-a5a6a4d22efe",
    "email": "staff@example.com",
    "fullName": "Jane Smith",
    "role": "Staff",
    "isActive": true
  },
  "message": "User created successfully",
  "timestamp": "2026-06-12T10:00:00"
}
```

#### Response `400 Bad Request`

```json
{
  "statusCode": 400,
  "data": null,
  "message": "Email 'staff@example.com' is already taken.",
  "timestamp": "2026-06-12T10:00:00"
}
```

---

### GET /api/v1/auth/users

List all admin users with their roles and active status.

**Authorization:** `Admin` only

#### Response `200 OK`

```json
{
  "statusCode": 200,
  "data": [
    {
      "id": "e452e0f5-8476-4687-8891-a5a6a4d22efe",
      "email": "admin@example.com",
      "fullName": "Default Admin",
      "role": "Admin",
      "isActive": true
    }
  ],
  "message": "Success",
  "timestamp": "2026-06-12T10:00:00"
}
```

---

### PUT /api/v1/auth/users/{id}

Update a user's full name, role, and/or active status. All fields are optional — only provided fields are updated.

**Authorization:** `Admin` only

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | User ID (ASP.NET Identity string ID) |

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| fullName | string | No | Updated full name |
| role | string | No | `"Admin"` or `"Staff"` |
| isActive | boolean | No | Set to `false` to deactivate (blocks login) |

```json
{
  "role": "Admin",
  "isActive": false
}
```

#### Response `200 OK`

```json
{
  "statusCode": 200,
  "data": {
    "id": "e452e0f5-8476-4687-8891-a5a6a4d22efe",
    "email": "staff@example.com",
    "fullName": "Jane Smith",
    "role": "Admin",
    "isActive": false
  },
  "message": "User updated successfully",
  "timestamp": "2026-06-12T10:00:00"
}
```

#### Response `400 Bad Request`

```json
{
  "statusCode": 400,
  "data": null,
  "message": "Invalid role. Must be 'Admin' or 'Staff'.",
  "timestamp": "2026-06-12T10:00:00"
}
```

#### Response `404 Not Found`

```json
{
  "statusCode": 404,
  "data": null,
  "message": "User not found",
  "timestamp": "2026-06-12T10:00:00"
}
```

---

### DELETE /api/v1/auth/users/{id}

Permanently delete an admin user.

**Authorization:** `Admin` only

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | User ID (ASP.NET Identity string ID) |

#### Response `200 OK`

```json
{
  "statusCode": 200,
  "data": "",
  "message": "User deleted successfully",
  "timestamp": "2026-06-12T10:00:00"
}
```

#### Response `404 Not Found`

```json
{
  "statusCode": 404,
  "data": null,
  "message": "User not found",
  "timestamp": "2026-06-12T10:00:00"
}
```

---

## 8. Categories

Base path: `/api/v1/categories`

---

### GET /api/v1/categories

Return all categories ordered by `createdAt` ascending.

**Authorization:** Public

#### Response `200 OK`

```json
{
  "statusCode": 200,
  "data": [
    {
      "id": "c1d2e3f4-0001-4562-b3fc-2c963f66afa6",
      "name": "Visa Guides",
      "slug": "visa-guides",
      "createdAt": "2026-06-14T08:00:00",
      "updatedAt": "2026-06-14T08:00:00"
    }
  ],
  "message": "Success",
  "timestamp": "2026-06-14T10:00:00"
}
```

---

### POST /api/v1/categories

Create a new category. Slug is auto-generated from `name` if omitted.

**Authorization:** `[Authorize]`

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Category display name |
| slug | string | No | Custom slug; auto-generated from name if absent |

```json
{ "name": "Visa Guides" }
```

#### Response `201 Created`

```json
{
  "statusCode": 201,
  "data": {
    "id": "c1d2e3f4-0001-4562-b3fc-2c963f66afa6",
    "name": "Visa Guides",
    "slug": "visa-guides",
    "createdAt": "2026-06-14T08:00:00",
    "updatedAt": "2026-06-14T08:00:00"
  },
  "message": "Category created successfully",
  "timestamp": "2026-06-14T10:00:00"
}
```

#### Error responses

| Scenario | Status | Message |
|---|---|---|
| `name` missing | 400 | `"Name is required"` |
| Slug collision | 409 | `"Slug already exists"` |
| No valid token | 401 | *(empty body)* |

---

### PUT /api/v1/categories/{id}

Update a category's name and/or slug.

**Authorization:** `[Authorize]`

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string (UUID) | Yes | Category ID |

#### Request Body

Same schema as `POST /api/v1/categories`.

#### Response `200 OK`

```json
{
  "statusCode": 200,
  "data": {
    "id": "c1d2e3f4-0001-4562-b3fc-2c963f66afa6",
    "name": "Visa News",
    "slug": "visa-news",
    "createdAt": "2026-06-14T08:00:00",
    "updatedAt": "2026-06-14T09:00:00"
  },
  "message": "Category updated successfully",
  "timestamp": "2026-06-14T10:00:00"
}
```

#### Error responses

| Scenario | Status | Message |
|---|---|---|
| `name` missing | 400 | `"Name is required"` |
| Unknown `id` | 404 | `"Category not found"` |
| Slug collision | 409 | `"Slug already exists"` |

---

### DELETE /api/v1/categories/{id}

Permanently delete a category. Returns `409` if the category still has posts.

**Authorization:** `[Authorize]`

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string (UUID) | Yes | Category ID |

#### Response `200 OK`

```json
{
  "statusCode": 200,
  "data": "",
  "message": "Category deleted successfully",
  "timestamp": "2026-06-14T10:00:00"
}
```

#### Error responses

| Scenario | Status | Message |
|---|---|---|
| Unknown `id` | 404 | `"Category not found"` |
| Category has posts | 409 | `"Cannot delete category with existing posts"` |

---

## 9. Posts

Base path: `/api/v1/posts`

---

### GET /api/v1/posts

Return a paginated list of posts. Unauthenticated callers see only `published` posts. Authenticated callers may pass `?status=all` to include drafts.

**Authorization:** Public

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| categoryId | string (UUID) | No | Filter to posts belonging to this category |
| status | string | No | Pass `"all"` (authenticated only) to include drafts |
| page | integer | No | Page number (default: `1`, min: `1`) |
| pageSize | integer | No | Items per page (default: `20`, max: `100`) |

#### Response `200 OK`

```json
{
  "statusCode": 200,
  "data": {
    "totalCount": 12,
    "page": 1,
    "pageSize": 20,
    "items": [
      {
        "id": "a1b2c3d4-0002-4562-b3fc-2c963f66afa6",
        "title": "How to Apply for an E-Visa",
        "slug": "how-to-apply-for-an-e-visa",
        "thumbnailUrl": "https://cdn.example.com/thumb.jpg",
        "categoryId": "c1d2e3f4-0001-4562-b3fc-2c963f66afa6",
        "categoryName": "Visa Guides",
        "status": 1,
        "createdAt": "2026-06-14T08:00:00",
        "updatedAt": "2026-06-14T08:00:00"
      }
    ]
  },
  "message": "Posts retrieved successfully.",
  "timestamp": "2026-06-14T10:00:00"
}
```

> Results sorted by `createdAt` descending. `status` values: `0` = Draft, `1` = Published.

---

### GET /api/v1/posts/{slug}

Return a single published post by its slug. Returns `404` for drafts and unknown slugs (intentionally indistinguishable).

**Authorization:** Public

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| slug | string | Yes | Post slug |

#### Response `200 OK`

```json
{
  "statusCode": 200,
  "data": {
    "id": "a1b2c3d4-0002-4562-b3fc-2c963f66afa6",
    "title": "How to Apply for an E-Visa",
    "slug": "how-to-apply-for-an-e-visa",
    "content": "<p>Full HTML content…</p>",
    "thumbnailUrl": "https://cdn.example.com/thumb.jpg",
    "categoryId": "c1d2e3f4-0001-4562-b3fc-2c963f66afa6",
    "category": {
      "id": "c1d2e3f4-0001-4562-b3fc-2c963f66afa6",
      "name": "Visa Guides",
      "slug": "visa-guides",
      "createdAt": "2026-06-14T08:00:00",
      "updatedAt": "2026-06-14T08:00:00"
    },
    "status": 1,
    "createdAt": "2026-06-14T08:00:00",
    "updatedAt": "2026-06-14T08:00:00"
  },
  "message": "Success",
  "timestamp": "2026-06-14T10:00:00"
}
```

#### Response `404 Not Found`

```json
{
  "statusCode": 404,
  "data": null,
  "message": "Post not found",
  "timestamp": "2026-06-14T10:00:00"
}
```

---

### POST /api/v1/posts

Create a new post. Slug is auto-generated from `title` if omitted; a numeric suffix is appended on collision (e.g. `my-post-2`).

**Authorization:** `[Authorize]`

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| title | string | Yes | Post title |
| content | string | Yes | Post body (HTML allowed) |
| categoryId | string (UUID) | Yes | Must reference an existing category |
| slug | string | No | Custom slug; auto-generated if absent |
| thumbnailUrl | string | No | URL of the post thumbnail image |
| status | integer | No | `0` Draft (default) · `1` Published |

```json
{
  "title": "How to Apply for an E-Visa",
  "content": "<p>Step-by-step instructions…</p>",
  "categoryId": "c1d2e3f4-0001-4562-b3fc-2c963f66afa6"
}
```

#### Response `201 Created`

```json
{
  "statusCode": 201,
  "data": {
    "id": "a1b2c3d4-0002-4562-b3fc-2c963f66afa6",
    "title": "How to Apply for an E-Visa",
    "slug": "how-to-apply-for-an-e-visa",
    "content": "<p>Step-by-step instructions…</p>",
    "thumbnailUrl": null,
    "categoryId": "c1d2e3f4-0001-4562-b3fc-2c963f66afa6",
    "category": {
      "id": "c1d2e3f4-0001-4562-b3fc-2c963f66afa6",
      "name": "Visa Guides",
      "slug": "visa-guides",
      "createdAt": "2026-06-14T08:00:00",
      "updatedAt": "2026-06-14T08:00:00"
    },
    "status": 0,
    "createdAt": "2026-06-14T08:00:00",
    "updatedAt": "2026-06-14T08:00:00"
  },
  "message": "Post created successfully",
  "timestamp": "2026-06-14T10:00:00"
}
```

#### Error responses

| Scenario | Status | Message |
|---|---|---|
| `title`, `content`, or `categoryId` missing | 400 | `"Title is required"` / `"Content is required"` / `"CategoryId is required"` |
| `categoryId` does not exist | 400 | `"Category not found"` |
| `status` not `0` or `1` | 400 | `"Invalid status value"` |
| Explicit slug collision | 409 | `"Slug already exists"` |

---

### PUT /api/v1/posts/{id}

Replace all fields on an existing post. Slug is re-generated from `title` if omitted.

**Authorization:** `[Authorize]`

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string (UUID) | Yes | Post ID |

#### Request Body

Same schema as `POST /api/v1/posts`.

#### Response `200 OK`

```json
{
  "statusCode": 200,
  "data": {
    "id": "a1b2c3d4-0002-4562-b3fc-2c963f66afa6",
    "title": "How to Apply for an E-Visa",
    "slug": "how-to-apply-for-an-e-visa",
    "content": "<p>Updated content…</p>",
    "thumbnailUrl": null,
    "categoryId": "c1d2e3f4-0001-4562-b3fc-2c963f66afa6",
    "category": {
      "id": "c1d2e3f4-0001-4562-b3fc-2c963f66afa6",
      "name": "Visa Guides",
      "slug": "visa-guides",
      "createdAt": "2026-06-14T08:00:00",
      "updatedAt": "2026-06-14T08:00:00"
    },
    "status": 0,
    "createdAt": "2026-06-14T08:00:00",
    "updatedAt": "2026-06-14T09:00:00"
  },
  "message": "Post updated successfully",
  "timestamp": "2026-06-14T10:00:00"
}
```

#### Error responses

| Scenario | Status | Message |
|---|---|---|
| `title`, `content`, or `categoryId` missing | 400 | *(field-specific message)* |
| `categoryId` does not exist | 400 | `"Category not found"` |
| `status` not `0` or `1` | 400 | `"Invalid status value"` |
| Unknown `id` | 404 | `"Post not found"` |
| Slug collision | 409 | `"Slug already exists"` |

---

### DELETE /api/v1/posts/{id}

Permanently delete a post.

**Authorization:** `[Authorize]`

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string (UUID) | Yes | Post ID |

#### Response `200 OK`

```json
{
  "statusCode": 200,
  "data": "",
  "message": "Post deleted successfully",
  "timestamp": "2026-06-14T10:00:00"
}
```

#### Response `404 Not Found`

```json
{
  "statusCode": 404,
  "data": null,
  "message": "Post not found",
  "timestamp": "2026-06-14T10:00:00"
}
```

---

### PATCH /api/v1/posts/{id}/status

Publish or unpublish a post without editing the full record.

**Authorization:** `[Authorize]`

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string (UUID) | Yes | Post ID |

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| status | integer | Yes | `0` = Draft, `1` = Published |

```json
{ "status": 1 }
```

#### Response `200 OK`

```json
{
  "statusCode": 200,
  "data": {
    "id": "a1b2c3d4-0002-4562-b3fc-2c963f66afa6",
    "title": "How to Apply for an E-Visa",
    "slug": "how-to-apply-for-an-e-visa",
    "content": "<p>Full HTML content…</p>",
    "thumbnailUrl": null,
    "categoryId": "c1d2e3f4-0001-4562-b3fc-2c963f66afa6",
    "category": {
      "id": "c1d2e3f4-0001-4562-b3fc-2c963f66afa6",
      "name": "Visa Guides",
      "slug": "visa-guides",
      "createdAt": "2026-06-14T08:00:00",
      "updatedAt": "2026-06-14T08:00:00"
    },
    "status": 1,
    "createdAt": "2026-06-14T08:00:00",
    "updatedAt": "2026-06-14T09:00:00"
  },
  "message": "Post status updated successfully",
  "timestamp": "2026-06-14T10:00:00"
}
```

#### Error responses

| Scenario | Status | Message |
|---|---|---|
| `status` not `0` or `1` | 400 | `"Invalid status value"` |
| Unknown `id` | 404 | `"Post not found"` |

