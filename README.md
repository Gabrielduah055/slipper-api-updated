# Slipper API backend

This Express backend serves the public storefront and the administrator dashboard. Customers do not sign in. Administrator routes require a Firebase Authentication ID token and explicit membership in the backend allowlist.

## Environment

Copy `.env.example` to `.env` and configure the existing database and Cloudinary variables plus these required administrator-authentication variables:

```dotenv
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
ADMIN_EMAILS=
```

`ADMIN_EMAILS` is a comma-separated allowlist. Matching is exact after trimming whitespace and lowercasing each address. A Firebase account is not an administrator unless its verified token contains an email in this list.

For a local `.env`, store the private key on one line with escaped newlines, for example `FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n"`. The backend converts each literal `\\n` to a newline. On Render, add the same value as a secret environment variable; either paste the multiline key supported by Render or use the escaped `\\n` form. Never log these values.

Do not download a service-account JSON file into this repository. Service-account files and real `.env` files must never be committed.

Every normal startup, including local development and production, fails with a clear error when any required authentication variable is missing. Tests inject a mock Firebase verifier into the real mounted middleware and need no Firebase credentials.

## Route access

| Access | Routes |
| --- | --- |
| Public customer | `GET /`, `GET /api/product`, `GET /api/product/categories`, `GET /api/product/:id`, `POST /api/customers`, `POST /api/orders` |
| Administrator | Product create/update/delete; customer list/detail/update/delete; order list/detail/status update |
| Removed | `POST /api/admin/login` (the backend no longer accepts administrator passwords or issues custom JWTs) |

No payment-provider callback or webhook route currently exists in this repository. Consequently none was changed or placed behind Firebase. Any future callback/webhook must remain outside Firebase middleware and retain the provider's signature or shared-secret verification.

Send a Firebase ID token to every administrator endpoint using exactly:

```http
Authorization: Bearer <firebase-id-token>
```

HTTP `401` means the header/token is missing, malformed, invalid, expired, or could not be verified. HTTP `403` means Firebase verified the user, but the token has no email or its email is absent from `ADMIN_EMAILS`.

## Postman/manual testing

Postman cannot obtain a Firebase Email/Password ID token from this backend because the old login endpoint has been removed.

Method A — call the Firebase Authentication REST API:

```http
POST https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={{FIREBASE_WEB_API_KEY}}
Content-Type: application/json

{
  "email": "{{ADMIN_EMAIL}}",
  "password": "{{ADMIN_PASSWORD}}",
  "returnSecureToken": true
}
```

Save the response's `idToken` as the Postman variable `FIREBASE_ID_TOKEN`, then send `Authorization: Bearer {{FIREBASE_ID_TOKEN}}` to a protected backend endpoint.

Method B — after frontend Firebase integration, inspect the signed-in Angular Firebase user and copy its current ID token into the same Postman variable.

Use this test matrix:

| Case | Request | Expected |
| --- | --- | --- |
| No token | Protected endpoint without `Authorization` | `401` |
| Malformed scheme | `Authorization: Token abc` | `401` |
| Invalid token | `Authorization: Bearer invalid-token` | `401` |
| Approved Firebase user | Valid token whose email is in `ADMIN_EMAILS` | Endpoint success |
| Unapproved Firebase user | Valid token whose email is absent from `ADMIN_EMAILS` | `403` |
| Public route | `GET /api/product/categories`, no token | `200` |
| Callback/webhook | Use the provider route once one exists | Provider verification response, never a Firebase `401` |

Do not commit Postman values containing administrator passwords, API keys, or ID tokens.

## Existing administrator documents

The application schema no longer stores or verifies administrator passwords. The migration is never run during application startup and uses MongoDB `$unset` to remove only the legacy `password` field.

Back up the intended database first. Confirm `MONGODB_URI` targets the correct environment, test the migration against that intended environment, and run the dry-run before applying it. Neither command prints password values.

Dry-run:

```shell
npm run migration:admin-passwords:dry-run
```

Apply only after reviewing the dry-run count and backup:

```shell
npm run migration:admin-passwords:apply -- --confirm=REMOVE_LEGACY_ADMIN_PASSWORDS
```

The confirmation suffix is mandatory. The migration does not delete administrator documents or change usernames, emails, roles, timestamps, or other fields.
