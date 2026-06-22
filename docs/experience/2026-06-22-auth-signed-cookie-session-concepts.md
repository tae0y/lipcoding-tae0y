# 인증·세션 개념 정리 — 패스프레이즈 + 서명 쿠키

「떠올림」의 단일 사용자 인증(2.1)을 공부용으로 정리한 문서입니다. 실제 코드 경로는
[backend/app/auth.py](../../backend/app/auth.py), [backend/app/main.py](../../backend/app/main.py),
[backend/app/config.py](../../backend/app/config.py)이고, 프론트는
[frontend/src/screens/LoginScreen.tsx](../../frontend/src/screens/LoginScreen.tsx)입니다.

## 큰 그림 — 무엇을 푸는 문제인가

공개 URL로 배포된 단일 사용자 앱입니다. 목표는 "지나가는 사람이 내 데이터를 읽거나, 내
명의로 Azure OpenAI를 호출(비용 유발)하지 못하게" 막는 **최소 침습 인증**입니다. 다중
사용자·역할 관리 같은 무거운 인증은 의도적으로 도입하지 않았습니다.

## 헷갈리기 쉬운 개념 5가지

| 개념 | 한 줄 정의 | 이 앱에서 |
|------|-----------|-----------|
| 인증(Authentication) | "누구인가"를 증명 | 패스프레이즈 일치 |
| 인가(Authorization) | "무엇을 할 수 있는가"를 결정 | 단일 사용자라 사실상 all-or-nothing |
| Shared secret | 서버와 사람이 같은 비밀을 공유 | `APP_PASSPHRASE` 하나 |
| 세션(Session) | 로그인 상태를 요청 간에 유지하는 방법 | 서명 쿠키에 `authed` 플래그 |
| 서명(sign) vs 암호화(encrypt) | 서명=위조 방지(내용은 보임), 암호화=내용 가림 | **서명만** 함 |

## 세 가지 상태 보존 방식 비교

로그인 상태를 어떻게 기억하느냐가 핵심입니다. 보통 세 갈래가 있습니다.

| 방식 | 서버 저장 | 검증 방법 | 이 앱 |
|------|-----------|-----------|-------|
| 서버측 세션 저장소 | 세션ID → DB/Redis 레코드 | 쿠키의 세션ID로 조회 | ❌ |
| 서명 쿠키(stateless) | 없음 | 쿠키 서명만 재계산해 검증 | ✅ |
| 토큰(JWT 등) | 없음 | 서명/만료 클레임 검증, 보통 `Authorization` 헤더 | ❌(개념만 유사) |

이 앱은 **서명 쿠키** 방식입니다. 서버는 아무것도 저장하지 않고, 상태가 전부 쿠키 안에
들어 있습니다. JWT와 개념은 닮았지만 JWT 포맷이 아니라 Starlette `SessionMiddleware`가
쓰는 `itsdangerous` 서명이고, 헤더가 아니라 쿠키로 전달됩니다.

## 로그인 한 번의 전체 흐름

```text
1) 사람이 패스프레이즈 입력 (LoginScreen)
      → POST /api/auth/login  { passphrase }

2) 백엔드 검증 (auth.verify_passphrase)
      → hmac.compare_digest 로 상수시간 비교
      → 일치하면  request.session["authed"] = True

3) SessionMiddleware 가 세션 dict 를 쿠키로 직렬화
      {"authed": true}  →  base64(JSON)  →  + HMAC 서명(SESSION_SECRET)
      →  Set-Cookie: workmem_session=<payload>.<signature>

4) 이후 모든 요청
      → 브라우저가 쿠키 자동 첨부
      → auth_gate 미들웨어가 request.session["authed"] 확인
      → 없으면 401 {"message": "인증이 필요합니다"}
```

검증 코드는 단순합니다.

```python
# backend/app/auth.py
def verify_passphrase(candidate: str) -> bool:
    secret = config.APP_PASSPHRASE
    if not secret:
        return False
    return hmac.compare_digest(candidate.encode("utf-8"), secret.encode("utf-8"))
```

`==` 대신 `hmac.compare_digest`를 쓰는 이유는 **타이밍 공격 완화**입니다. 일반 비교는
틀린 글자가 나오는 즉시 멈춰 응답 시간이 미세하게 달라지는데, 그 차이로 비밀을 한 글자씩
복원하는 공격이 가능합니다. 상수시간 비교는 길이가 같으면 항상 같은 시간을 씁니다.

## 게이트는 allowlist 방식

라우트 보호는 미들웨어 한 곳에서 합니다.

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
        return JSONResponse({"message": "인증이 필요합니다"}, status_code=401)
    return await call_next(request)
```

보호 대상 판정은 [is_protected_path()](../../backend/app/auth.py)에 있습니다.

- 막는 것: `/health/ai`, 그리고 `/api/*` 중 로그인·로그아웃·세션조회를 **뺀** 전부.
- 통과: 정적 SPA(`/`, 에셋), `/health`, `/api/auth/{login,logout,session}`.

즉 정적 페이지(빈 껍데기)는 누구나 받지만, 실제 데이터·AI 기능은 로그인해야 열립니다.

## 미들웨어 순서 함정 (실전 교훈)

`auth_gate`가 `request.session`을 읽으려면 `SessionMiddleware`가 **먼저** 쿠키를 풀어
세션을 채워줘야 합니다. Starlette/FastAPI에서 `add_middleware`는 **나중에 추가한 것이 가장
바깥층(요청을 먼저 받는 층)**입니다.

```python
# SessionMiddleware 를 마지막에 추가 → 가장 바깥에서 실행 → auth_gate 가 세션을 읽을 수 있음
app.add_middleware(
    SessionMiddleware,
    secret_key=config.SESSION_SECRET,
    session_cookie="workmem_session",
    https_only=config.SESSION_HTTPS_ONLY,
    same_site="strict",
)
```

순서를 반대로 두면 `auth_gate`가 빈 세션을 보고 항상 401을 내는 함정에 빠집니다.

## 쿠키 보안 속성

| 속성 | 값 | 막는 위협 |
|------|----|-----------|
| `HttpOnly` | on | JS(`document.cookie`)로 쿠키 탈취 → XSS 완화 |
| `Secure` (`https_only`) | prod on / 로컬 off | 평문 HTTP 전송 도청 |
| `SameSite` | `strict` | 다른 사이트發 요청에 쿠키 미첨부 → CSRF 완화 |
| 서명(`SESSION_SECRET`) | 필수 | 쿠키 위변조(가짜 `authed:true` 생성) |

`Secure`를 로컬에서 끄는 이유: 로컬은 `http://localhost`라 `Secure` 쿠키가 아예 전송되지
않아 로그인이 안 됩니다. 그래서 `SESSION_HTTPS_ONLY=0`으로 둡니다(테스트도 동일).

## 두 개의 비밀을 구분하기

자주 헷갈리는 지점입니다. 이 인증에는 **별개의 비밀 두 개**가 있습니다.

| 비밀 | 역할 | 누가 쥐나 |
|------|------|-----------|
| `APP_PASSPHRASE` | 문을 여는 열쇠(사람이 입력) | 사용자 |
| `SESSION_SECRET` | 발급된 출입증의 위조 방지 도장 | 서버 |

- 패스프레이즈는 **쿠키에 들어가지 않습니다.** 로그인 그 순간만 검증하고 버립니다.
- 쿠키엔 `{"authed": true}`라는 불리언만 들어갑니다(비밀 아님 → 노출돼도 무방, 서명이
  위조를 막음).
- `SESSION_SECRET`을 재배포 때 새로 생성하면 기존 쿠키 서명이 전부 무효가 되어 모두
  재로그인해야 합니다. 안정적 세션 유지가 필요하면 고정값을 주입합니다([config.py](../../backend/app/config.py)).

## 켜고 끄는 스위치

`APP_PASSPHRASE`가 비어 있으면 인증이 **꺼집니다**(개방 모드).

```python
def is_auth_enabled() -> bool:
    return bool(config.APP_PASSPHRASE)
```

- 로컬/테스트: 미설정 → 로그인 화면 없이 바로 본 앱(편의).
- prod 배포: 반드시 설정 → 전체 잠금. 배포 시 이 값은 Key Vault 시크릿
  `app-passphrase`로 보관되고 Managed Identity로 주입됩니다(2.3).

## 한계와 확장 포인트

- **단일 사용자·단일 비밀**: 사용자 구분, 비밀번호 회전, 계정 잠금이 없습니다.
- **해시 저장 아님**: 패스프레이즈를 bcrypt 등으로 해싱하지 않고 평문 시크릿으로 보관·평문
  비교합니다(Key Vault가 저장 보안을 담당). 다중 사용자로 키우려면 사용자 모델 + 해시
  저장이 별도로 필요합니다.
- **만료 없음**: 세션 자체 만료(예: 12시간)는 설정하지 않았습니다. 필요하면 세션에
  타임스탬프를 넣고 게이트에서 검사하는 방식으로 확장할 수 있습니다.

## 한 줄 요약

패스프레이즈 = "누가"(사람이 입력하는 열쇠), `SESSION_SECRET` = "위조 방지"(서버 도장).
서버는 세션을 저장하지 않고, 서명된 쿠키 하나로 로그인 상태를 stateless하게 유지합니다.
</content>
</invoke>
