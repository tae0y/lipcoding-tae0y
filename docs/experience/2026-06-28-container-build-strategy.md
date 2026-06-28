# 컨테이너 빌드 전략 — 로컬 빌드 vs ACR Tasks vs CI/CD (2026-06-28)

재구현 배포 과정에서 컨테이너 이미지 빌드 방식의 트레이드오프를 정리한다.

## 배경

`scripts/deploy-aca.sh`는 로컬 Docker 빌드 후 ACR에 푸시하는 방식을 채택하고 있다.
배포 속도 최적화 관점에서 다른 방식과 비교했다.

## 세 가지 방식 비교

### 1. 로컬 빌드 + ACR 푸시 (현재 방식)

```bash
docker build --platform linux/amd64 -t <acr>.azurecr.io/app:tag .
docker push <acr>.azurecr.io/app:tag
```

- **장점**: 레이어 캐시 활용 → 재빌드 빠름. 특히 무거운 레이어(Node.js + Copilot CLI 설치 등)에서 효과적.
- **단점**: 로컬 Docker 데몬 필요. M 시리즈 맥에서 `--platform linux/amd64` 필수(크로스 컴파일). 업로드 대역폭 소모.

### 2. ACR Tasks (`az acr build`)

```bash
az acr build --registry <acr> --image app:tag --file Dockerfile .
```

- **장점**: 로컬 Docker 불필요. Azure 네트워크 내 빌드·저장 일괄 처리. 플랫폼 걱정 없음.
- **단점**: 레이어 캐시 없음 → 매 빌드마다 `npm ci` + Copilot CLI 설치 (~5–10분). 소스 전체를 Azure에 업로드해야 함.
- **이 프로젝트의 실제 경험**: Dockerfile에 `@github/copilot` CLI 글로벌 설치가 포함돼 있어 ACR Tasks 빌드가 느렸음. 대회 당일 로컬 빌드로 전환한 이유.

### 3. GitHub Actions CI/CD (업계 표준)

```yaml
- uses: docker/build-push-action@v5
  with:
    cache-from: type=gha
    cache-to: type=gha,mode=max
    push: true
    tags: <acr>.azurecr.io/app:${{ github.sha }}
```

- **장점**: `main` 푸시마다 자동 빌드·배포. GitHub Actions 캐시(GHA)로 로컬 수준 속도. 재현성 보장. 개발자 로컬 환경 불필요.
- **단점**: 초기 워크플로 + OIDC(Federated Identity) 설정 필요. 이 프로젝트엔 아직 없음.

## 판단 기준 요약

| 상황 | 권장 방식 |
|---|---|
| 무거운 레이어 + 빠른 반복 | 로컬 빌드 + 푸시 |
| 로컬 Docker 없이 빠른 일회성 배포 | ACR Tasks |
| 팀 협업 / 자동화 / 재현성 | GitHub Actions + GHA 캐시 |
| 단일 명령 배포 (IaC 포함) | `azd up` (내부 ACR Tasks → 캐시 없음 주의) |

## 이 프로젝트의 현실적 선택

- 개인 프로젝트 + 배포 빈도 낮음 → **로컬 빌드 현재 방식 유지 합리적**.
- `azure.yaml`이 있어 `azd up` 경로도 가능하지만, azd도 내부적으로 ACR Tasks를 사용하므로 캐시 이슈 동일.
- 자동화가 필요해지면 GitHub Actions + GHA 캐시가 첫 번째 선택지.

## 관련 파일

- [scripts/deploy-aca.sh](../../scripts/deploy-aca.sh) — 현재 배포 스크립트 (로컬 빌드 방식)
- [Dockerfile](../../Dockerfile) — 무거운 레이어의 원인: Node 20 + `@github/copilot` CLI
- [azure.yaml](../../azure.yaml) — azd 경로 진입점
