# Auth Concepts — Passphrase + Signed Cookie Session

A study document on the single-user authentication (2.1) for Tteoolim. Actual code paths are in
[backend/app/auth.py](../../backend/app/auth.py), [backend/app/main.py](../../backend/app/main.py),
[backend/app/config.py](../../backend/app/config.py), and the frontend in
[frontend/src/screens/LoginScreen.tsx](../../frontend/src/screens/LoginScreen.tsx).

## Big Picture — What Problem Does This Solve

A single-user app deployed at a public URL. The goal is **minimal-invasive auth** that prevents
random visitors from reading my data or triggering Azure OpenAI calls (incurring costs) on my behalf.
Multi-user management, role separation, and heavy auth were intentionally not introduced.

## 5 Concepts That Are Easy to Confuse

| Concept | One-line definition | In this app |
|------|-----------|-----------|
| Authentication | Proving "who you are" | Passphrase match |
| Authorization | Deciding "what you can do" | Single user so effectively all-or-nothing |
| Shared secret | Server and person share the same secret | `APP_PASSPHRASE` — one value |
| Session | How login state is maintained across requests | Signed cookie with `authed` flag |
| Sign vs Encrypt | Sign = tamper-proof (content visible), Encrypt = content hidden | **Sign only** |

## Three State Persistence Approaches Compared

The key question is how to remember login state. There are generally three approaches:

| Approach | Server storage | Verification method | This app |
|------|-----------|-----------|-------|
| Server-side session store | session ID → DB/Redis record | Look up via cookie session ID | ❌ |
| Signed cookie (stateless) | None | Recompute cookie signature to verify | ✅ |
| Token (JWT etc.) | None | Verify signature/expiry claims, usually in `Authorization` header | ❌ (conceptually similar) |

This app uses **signed cookies**. The server stores nothing; all state is inside the cookie.
Conceptually similar to JWT, but it's Starlette `SessionMiddleware`'s `itsdangerous` signature
(not JWT format), and it's sent as a cookie, not a header.

## Full Flow for One Login

```text
1) User enters passphrase (LoginScreen)
      → POST /api/auth/login  { passphrase }

2) Backend verifies (auth.verify_passphrase)
      → constant-time comparison with hmac.compare_digest
      → on match: request.session["authed"] = True

3) SessionMiddleware serializes session dict to cookie
      {"authed": true}  →  base64(JSON)  →  + HMAC signature (SESSION_SECRET)
      →  Set-Cookie: workmem_session=<payload>.<signature>

4) All subsequent requests
      → browser attaches cookie automatically
      → auth_gate middleware checks request.session["authed"]
      → if absent: 401 {"message": "Authentication required"}
```

Verification code is simple:

```python
# backend/app/auth.py
def verify_passphrase(candidate: str) -> bool:
    secret = config.APP_PASSPHRASE
    if not secret:
        return False
    return hmac.compare_digest(candidate.encode("utf-8"), secret.encode("utf-8"))
```

`hmac.compare_digest` instead of `==` is for **timing attack mitigation**. A regular comparison
stops at the first mismatched character, making response time microscopically different — an
attacker can recover the secret character by character from that difference. Constant-time
comparison always takes the same time for equal-length inputs.

## Gate Is Allowlist-Based

Route protection happens in one place — middleware:

```python
# backend/app/main.py
@app.middleware("http")
async def auth_gate(request, call_next):
    if (
        auth.is_auth_enabled()
        and request.method != "OPTIONS"
        and auth.is_protected_path(request.url.path)
        and not request.session.get(auth.SESSION_KEY)
    ):
        return JSONResponse({"message": "Authentication required"}, status_code=401)
    return await call_next(request)
```

Protected path determination is in [is_protected_path()](../../backend/app/auth.py):

- Blocked: `/health/ai`, and all `/api/*` **except** login/logout/session endpoints.
- Allowed through: static SPA (`/`, assets), `/health`, `/api/auth/{login,logout,session}`.

The static page (empty shell) is accessible to anyone, but actual data and AI features require login.

## Middleware Order Pitfall (Practical Lesson)

For `auth_gate` to read `request.session`, `SessionMiddleware` must **first** parse the cookie
and populate the session. In Starlette/FastAPI, `add_middleware` means **the last one added is
the outermost layer (receives requests first)**.

```python
# SessionMiddleware added last → runs at the outermost layer → auth_gate can read session
app.add_middleware(
    SessionMiddleware,
    secret_key=config.SESSION_SECRET,
    session_cookie="workmem_session",
    https_only=config.SESSION_HTTPS_ONLY,
    same_site="strict",
)
```

Reversing this order causes `auth_gate` to see an empty session and always return 401.

## Cookie Security Attributes

| Attribute | Value | Threat blocked |
|------|----|-----------|
| `HttpOnly` | on | Cookie theft via JS (`document.cookie`) → XSS mitigation |
| `Secure` (`https_only`) | prod on / local off | Eavesdropping on plaintext HTTP |
| `SameSite` | `strict` | Cookie not sent with cross-site requests → CSRF mitigation |
| Signature (`SESSION_SECRET`) | required | Cookie forgery (fabricating `authed:true`) |

`Secure` is disabled locally because local is `http://localhost` — `Secure` cookies are not
transmitted over http, preventing login entirely. Hence `SESSION_HTTPS_ONLY=0` for local (same for tests).

## Distinguishing Two Secrets

A commonly confused point. This auth has **two separate secrets**:

| Secret | Role | Who holds it |
|------|------|-----------|
| `APP_PASSPHRASE` | The key to open the door (human enters) | User |
| `SESSION_SECRET` | The anti-forgery stamp on the issued pass | Server |

- The passphrase **does not go into the cookie**. It is checked at login time only, then discarded.
- The cookie contains only `{"authed": true}` as a boolean (not secret → exposure is fine; signature prevents forgery).
- Regenerating `SESSION_SECRET` on redeploy invalidates all existing cookies, requiring everyone to log in again.
  Inject a fixed value if stable sessions are needed ([config.py](../../backend/app/config.py)).

## On/Off Switch

When `APP_PASSPHRASE` is empty, auth is **disabled** (open mode).

```python
def is_auth_enabled() -> bool:
    return bool(config.APP_PASSPHRASE)
```

- Local/test: unset → app opens directly without login screen (convenient).
- Production: must be set → full lock. In deployment, this value is stored in Key Vault secret
  `app-passphrase` and injected via Managed Identity (2.3).

## Limitations and Extension Points

- **Single user, single secret**: no user distinction, password rotation, or account lockout.
- **No hash storage**: passphrase is stored and compared as plaintext (Key Vault handles storage security).
  Multi-user expansion would require a user model + hashed storage.
- **No expiry**: session expiry (e.g. 12 hours) is not configured. If needed, add a timestamp
  to the session and check in the gate.

## One-Line Summary

Passphrase = "who" (key the human enters); `SESSION_SECRET` = "anti-forgery stamp" (server seal).
The server stores no session; a single signed cookie maintains login state statelessly.
