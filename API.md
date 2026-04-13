# Authentication API

Base path: `/api/v1`

All JSON bodies use `Content-Type: application/json`.

---

## POST `/api/v1/auth/signup`

Creates a user account and returns a JWT you can send on later requests (header: `Authorization: Bearer <token>`).

### Request body

| Field      | Type   | Required | Rules |
|-----------|--------|----------|--------|
| `username`| string | yes      | 2–50 characters, unique |
| `email`   | string | yes      | Valid email format, unique |
| `password`| string | yes      | Minimum 8 characters |
| `role`    | string | no       | `"user"` or `"artist"` (default: `user`) |

### Flow (what happens in code)

1. **Route** (`src/routes/auth.routes.js`) — `POST /signup` → signup controller.
2. **Controller** (`signup` in `src/controllers/auth.controller.js`) — Thin HTTP layer: no business rules beyond calling validation + service.
3. **Validator** (`validateSignupBody` in `src/validators/auth.validator.js`) — Checks types, lengths, email shape, optional `role`. Throws `AppError` with code `VALIDATION_ERROR` if invalid.
4. **Service** (`registerUser` in `src/services/auth.service.js`) — Checks duplicate email/username, hashes password via `hashPassword` (`src/utils/password.util.js`), creates the document with Mongoose (`src/models/user.model.js`), builds JWT via `signAccessToken` (`src/utils/token.util.js`).
5. **Response** — `201` with `{ success: true, data: { user, accessToken } }`.

### Success response (`201`)

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "username": "jane",
      "email": "jane@example.com",
      "role": "user",
      "createdAt": "..."
    },
    "accessToken": "<jwt>"
  }
}
```

### Error cases

- **400** — Validation failed (`VALIDATION_ERROR`).
- **409** — Email or username already used (`EMAIL_TAKEN`, `USERNAME_TAKEN`, or Mongo duplicate key).
- **500** — Unexpected server error (`INTERNAL_ERROR`).

---

## POST `/api/v1/auth/login`

Authenticates with email + password and returns the same token payload shape as signup.

### Request body

| Field      | Type   | Required |
|-----------|--------|----------|
| `email`   | string | yes      |
| `password`| string | yes      |

### Flow

1. **Route** — `POST /login` → `login` on the auth controller.
2. **Controller** (`login` in `src/controllers/auth.controller.js`) — Calls `validateLoginBody` then `loginUser`.
3. **Validator** (`validateLoginBody`) — Ensures non-empty email/password and basic email format.
4. **Service** (`loginUser` in `src/services/auth.service.js`) — Loads user with `.select('+password')` (password is hidden by default on the schema), compares with `comparePassword`, issues JWT. Does not reveal whether email or password was wrong (same error message).
5. **Response** — `200` with `{ success: true, data: { user, accessToken } }`.

### Success response (`200`)

Same `data` shape as signup.

### Error cases

- **400** — Validation (`VALIDATION_ERROR`).
- **401** — Wrong email or password (`INVALID_CREDENTIALS`).

---

## POST `/api/v1/auth/logout`

Logs out the currently authenticated user. This API is stateless: server does not store tokens, so client should remove the token after this call.

### Headers

| Header | Required | Value |
|--------|----------|-------|
| `Authorization` | yes | `Bearer <accessToken>` |

### Flow

1. **Route** — `POST /logout` with `requireAuth` middleware.
2. **Middleware** (`src/middlewares/auth.middleware.js`) — Validates bearer token and sets `req.user`.
3. **Controller** (`logout` in `src/controllers/auth.controller.js`) — Calls `logoutUser` service.
4. **Service** (`logoutUser` in `src/services/auth.service.js`) — Returns success message.

### Success response (`200`)

```json
{
  "success": true,
  "data": {
    "message": "User logged out successfully"
  }
}
```

### Error cases

- **401** — Missing/invalid token (`UNAUTHORIZED`).

---

## DELETE `/api/v1/auth/account`

Deletes the currently authenticated user's account.

### Headers

| Header | Required | Value |
|--------|----------|-------|
| `Authorization` | yes | `Bearer <accessToken>` |

### Flow

1. **Route** — `DELETE /account` with `requireAuth`.
2. **Middleware** — Resolves token and attaches `req.user.id`.
3. **Controller** (`deleteAccount`) — Validates auth context and calls service.
4. **Service** (`deleteUserAccount`) — Deletes user by authenticated id.

### Success response (`200`)

```json
{
  "success": true,
  "data": {
    "message": "Account deleted successfully"
  }
}
```

### Error cases

- **401** — Missing/invalid token (`UNAUTHORIZED`).
- **404** — User not found (`USER_NOT_FOUND`).

---

## POST `/api/v1/media/upload`

Uploads an image to ImageKit, saves metadata in MongoDB, and returns the stored record.

### Content type

Use `multipart/form-data`.

### Form fields

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `file` | image file | yes | Max 10 MB |
| `title` | string | yes | Media title |
| `description` | string | yes | Media description |

### Success response (`201`)

```json
{
  "success": true,
  "data": {
    "message": "File uploaded successfully",
    "media": {
      "id": "...",
      "title": "Profile banner",
      "description": "Homepage hero asset",
      "name": "banner.png",
      "url": "https://ik.imagekit.io/...",
      "thumbnail": "https://ik.imagekit.io/.../tr:w-300,h-300/...",
      "createdAt": "..."
    }
  }
}
```

### Error cases

- **400** — Missing or invalid `title`, `description`, or `file` (`VALIDATION_ERROR`).
- **409** — Duplicate media record in DB (`DUPLICATE_MEDIA`).
- **500** — Upload or server error (`INTERNAL_ERROR`).

---

## GET `/api/v1/media`

Returns all uploaded media records from MongoDB (latest first).

### Success response (`200`)

```json
{
  "success": true,
  "data": {
    "media": [
      {
        "id": "...",
        "title": "Profile banner",
        "description": "Homepage hero asset",
        "name": "banner.png",
        "url": "https://ik.imagekit.io/...",
        "thumbnail": "https://ik.imagekit.io/.../tr:w-300,h-300/...",
        "createdAt": "...",
        "updatedAt": "..."
      }
    ]
  }
}
```

### Error cases

- **500** — Server error (`INTERNAL_ERROR`).

---

## GET `/api/v1/health`

Simple liveness check: `{ "success": true, "data": { "status": "ok" } }`.

---

## Project layout (auth-related)

| Path | Role |
|------|------|
| `src/routes/auth.routes.js` | Maps URLs to controller methods |
| `src/controllers/auth.controller.js` | Parses request, calls service, sets status + JSON |
| `src/services/auth.service.js` | Signup/login rules, DB + tokens |
| `src/validators/auth.validator.js` | Input rules for auth bodies |
| `src/models/user.model.js` | User schema |
| `src/utils/password.util.js` | Bcrypt hash/compare |
| `src/utils/token.util.js` | JWT signing |
| `src/middlewares/errorHandler.js` | Consistent JSON errors |
| `src/errors/AppError.js` | Typed operational errors |

---

## Environment variables

See `.env.example`: `MONGODB_URI`, `JWT_SECRET`, `PORT`, `IMAGEKIT_PUBLIC_KEY`, `IMAGEKIT_PRIVATE_KEY`, `IMAGEKIT_URL_ENDPOINT`. Access tokens expire after **7 days** (set in `src/utils/token.util.js`, not env).

If `JWT_SECRET` is unset and `NODE_ENV` is not `production`, the server starts with a **development-only** default and logs a warning. Production **must** set `JWT_SECRET`.
