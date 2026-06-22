# Working Memory Inbox 배포 가이드 (Azure)

이 문서는 「떠올림(Working Memory Inbox)」을 **로컬 → 로컬 컨테이너 → Azure** 순서로
실행·배포해 테스트하는 방법을 설명한다. 앱 구조와 SDK 사용 배경은
[architecture.md](architecture.md)를, 인프라 구성 상세는 [infra/main.bicep](../infra/main.bicep)와
[scripts/deploy-aca.sh](../scripts/deploy-aca.sh)를 참고한다.

스택: FastAPI + SQLite 백엔드가 빌드된 Vite SPA를 **단일 오리진**으로 서빙한다.
Azure에서는 **Container Apps + ACR + Key Vault + User-Assigned Managed Identity** 로 배포된다.

## 사전 준비

- [Azure CLI](https://learn.microsoft.com/cli/azure/install-azure-cli) (`az`)
- [Docker](https://docs.docker.com/get-docker/)
- [uv](https://docs.astral.sh/uv/) (백엔드 실행/테스트), [Node.js 20+](https://nodejs.org/) (프론트 빌드)
- **Azure OpenAI** — `createAoai=true`(기본)이면 이 배포가 AOAI 계정과 `gpt-4o`
  배포를 IaC 로 생성·관리하고, API 키는 `listKeys()`로 Key Vault 에 자동 주입한다.
  기존 계정을 그대로 쓰려면 [infra/main.bicepparam](../infra/main.bicepparam)에서
  `createAoai=false`로 두고 `aoaiAccountName`을 기존 계정명으로 맞춘다(동명 계정은 멱등 흡수).

## 리포지토리 루트 잡기

1. 리포지토리 루트를 변수로 잡는다.

    ```bash
    # bash/zsh
    REPOSITORY_ROOT=$(git rev-parse --show-toplevel)
    cd "$REPOSITORY_ROOT"
    ```

## 환경변수

앱이 읽는 주요 환경변수다. 로컬에서는 리포지토리 루트의 `.env`(gitignore됨)에 두고,
Azure 배포에서는 셸 환경변수로 주입한다(아래 각 절 참고).

| 변수 | 필수 | 설명 |
|------|------|------|
| `AZURE_OPENAI_ENDPOINT` | ● | Azure OpenAI 엔드포인트 URL |
| `AZURE_OPENAI_API_KEY` | ● | Azure OpenAI API 키 |
| `AZURE_OPENAI_DEPLOYMENT` | ● | 모델 배포명 (예: `gpt-4o`) |
| `AZURE_OPENAI_API_VERSION` | | API 버전 (기본 `2024-10-21`) |
| `APP_PASSPHRASE` | △ | 단일 사용자 로그인 비밀. **설정 시 인증 활성화**, 미설정 시 개방 모드 |
| `SESSION_SECRET` | | 세션 쿠키 서명 키. 미설정 시 자동 생성(재시작 시 세션 무효화) |
| `SKIP_COPILOT_SDK` | | `1`이면 Copilot SDK 경로를 건너뛰고 Azure 직접 호출/휴리스틱 폴백 사용 |
| `ENABLE_DOCS` | | `1`이면 `/docs` 노출(기본 off) |
| `SESSION_HTTPS_ONLY` | | 로컬 http 테스트는 `0`, prod(HTTPS)는 `1`(기본) |

## 로컬 머신에서 실행

1. 리포지토리 루트에 `.env`를 만든다(키는 직접 입력, 커밋 금지).

    ```bash
    # bash/zsh — $REPOSITORY_ROOT/.env
    cat > "$REPOSITORY_ROOT/.env" <<'EOF'
    AZURE_OPENAI_ENDPOINT={{AZURE_OPENAI_ENDPOINT}}
    AZURE_OPENAI_API_KEY={{AZURE_OPENAI_API_KEY}}
    AZURE_OPENAI_DEPLOYMENT=gpt-4o
    AZURE_OPENAI_API_VERSION=2024-10-21
    SKIP_COPILOT_SDK=1
    SESSION_HTTPS_ONLY=0
    EOF
    ```

    > **NOTE**: 로컬에는 Copilot CLI GitHub 인증이 없을 수 있다. `SKIP_COPILOT_SDK=1`로
    > 두면 같은 Azure OpenAI 모델을 직접 호출하는 2순위 경로로 동작한다(엔드투엔드 확인 가능).

1. 프론트엔드(Vite)를 빌드해 `backend/static`으로 산출한다.

    ```bash
    # bash/zsh
    bash "$REPOSITORY_ROOT/scripts/build.sh"
    ```

1. 백엔드를 실행한다. FastAPI가 빌드된 SPA를 같은 오리진으로 서빙한다.

    ```bash
    # bash/zsh
    cd "$REPOSITORY_ROOT/backend"
    uv run uvicorn app.main:app --reload
    ```

1. 웹 브라우저에서 `http://localhost:8000`을 열어 아이디어를 입력한다.

    > **NOTE**: 프론트엔드를 따로 핫리로드로 개발하려면 백엔드(8000)와 별개로
    > `cd frontend && npm ci && npm run dev`(`http://localhost:5173`)를 띄운다.
    > CORS는 5173/127.0.0.1:5173을 기본 허용한다.

## 로컬 컨테이너에서 실행

배포와 동일한 이미지를 로컬에서 검증한다.

1. 리포지토리 루트인지 확인한다.

    ```bash
    cd "$REPOSITORY_ROOT"
    ```

1. 컨테이너 이미지를 빌드한다([Dockerfile](../Dockerfile) — 프론트 빌드 + FastAPI 런타임 멀티스테이지).

    ```bash
    # bash/zsh
    docker build --platform linux/amd64 -f Dockerfile -t lipcoding:latest .
    ```

1. `.env`를 주입해 실행한다.

    ```bash
    # bash/zsh
    docker run --rm -p 8000:8000 --env-file "$REPOSITORY_ROOT/.env" lipcoding:latest
    ```

1. 웹 브라우저에서 `http://localhost:8000`을 연다.

    > **NOTE**: 이미지에는 Copilot CLI가 포함되지만 GitHub 인증은 없다. SDK 경로가 비면
    > Azure 직접 호출로 폴백한다. 확실히 하려면 `.env`에 `SKIP_COPILOT_SDK=1`을 둔다.

## Azure에 배포

[scripts/deploy-aca.sh](../scripts/deploy-aca.sh) 한 번으로 리소스 공급자 등록 → 리소스 그룹/ACR
생성 → 이미지 빌드·푸시 → Azure OpenAI·Key Vault·Managed Identity 포함 Bicep 배포 →
헬스체크까지 수행한다.

1. Azure에 로그인하고 구독을 선택한다.

    ```bash
    # bash/zsh
    az login
    az account set --subscription {{AZURE_SUBSCRIPTION_ID}}
    ```

1. 배포에 필요한 환경변수를 설정한다. `APP_PASSPHRASE`는 **반드시** 지정한다(공개 배포 인증).

    ```bash
    # bash/zsh
    export APP_PASSPHRASE={{LOGIN_PASSPHRASE}}
    # 선택: 안정적 세션 유지가 필요하면 직접 주입(미지정 시 자동 생성)
    # export SESSION_SECRET=$(openssl rand -base64 32)
    # 선택: 모델 배포명이 gpt-4o가 아니면 지정
    # export AZURE_OPENAI_DEPLOYMENT={{DEPLOYMENT_NAME}}
    ```

    > **NOTE**: Azure OpenAI API 키는 더 이상 수동으로 주입하지 않는다. bicep 이 AOAI
    > 계정에서 `listKeys()`로 가져와 Key Vault 시크릿(`aoai-api-key`)에 채운다(2.8).
    > 기존 AOAI 계정을 그대로 쓰려면 [infra/main.bicepparam](../infra/main.bicepparam)에서
    > `createAoai=false` 로 두고 `aoaiAccountName`을 맞춘다.

    > **NOTE**: ACR 이름(`ACR_NAME`), 리소스 그룹(`RG`), 위치(`LOCATION`)도 환경변수로
    > 덮어쓸 수 있다. 미지정 시 각각 자동 생성/`rg-lipcoding`/`eastus2`를 쓴다.

1. 배포 스크립트를 실행한다.

    ```bash
    # bash/zsh
    bash "$REPOSITORY_ROOT/scripts/deploy-aca.sh"
    ```

    완료되면 앱 URL(`appUrl`)과 FQDN이 출력되고 `/health` 헬스체크가 수행된다.

    > **NOTE**: 처음 배포에서는 RBAC 권한 전파 지연으로 Key Vault 참조 검증이 한 번
    > 실패할 수 있다. 같은 명령을 **다시 실행**하면 멱등하게 성공한다.

1. 출력된 앱 URL을 브라우저에서 열고, `APP_PASSPHRASE`로 로그인해 아이디어 캡처를 테스트한다.

    ```bash
    # bash/zsh — 배포 후 헬스 확인
    curl -sf https://{{APP_FQDN}}/health        # 기본 헬스
    curl -sf https://{{APP_FQDN}}/health/ai      # Azure OpenAI 왕복 확인
    ```

## 정리(Clean up)

테스트가 끝나면 리소스 그룹을 통째로 삭제한다.

```bash
# bash/zsh
az group delete -n {{RESOURCE_GROUP}} --yes --no-wait
```

> **NOTE**: Key Vault 와 Azure OpenAI 계정은 소프트 삭제가 켜져 있다. 같은 이름으로 즉시
> 재생성하려면 `az keyvault purge -n {{KEY_VAULT_NAME}}` 및 `az cognitiveservices account
> purge -g {{RESOURCE_GROUP}} -n {{AOAI_ACCOUNT_NAME}} -l {{LOCATION}}`로 완전 삭제한다
> (배포 출력의 `keyVaultName`·`aoaiAccountName` 참고).
