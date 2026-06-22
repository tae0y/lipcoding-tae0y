using './main.bicep'

// ── 필수 파라미터 ─────────────────────────────────────────────────────────────
// acrName: 전역 고유해야 함. 소문자+숫자 5-50자.
param acrName = 'lipcoding<YOUR_SUFFIX>'   // ← 변경 필요

// containerImage: ACR 빌드 후 채워짐 (scripts/deploy-aca.sh 가 자동 설정)
param containerImage = 'lipcoding<YOUR_SUFFIX>.azurecr.io/lipcoding-api:latest'

// ── Azure OpenAI (2.8: IaC 관리) ──────────────────────────────────────────────
// createAoai=true → 이 배포가 AOAI 계정+gpt-4o 배포를 생성/관리하고, 키는 bicep 이
// listKeys()로 Key Vault(aoai-api-key)에 직접 흘린다. 배포자 수동 키 주입 불필요.
// 기존 계정명 재사용 시 같은 RG 에서 멱등 흡수(신규 쿼터 불필요).
param createAoai      = true
param aoaiAccountName = 'aoai-lipcoding-tae0yp'
param aoaiDeployment  = 'gpt-4o'
param aoaiModelName   = 'gpt-4o'
param aoaiModelVersion = '2024-11-20'
param aoaiCapacity    = 30
param aoaiApiVersion  = '2024-10-21'

// ── 인증/세션 (2.1) ───────────────────────────────────────────────────────────
// 환경변수로 주입 — 파일에 직접 쓰지 말 것. 2.3: bicep 이 이 값을 Key Vault 시크릿
// (app-passphrase/session-secret)으로 보관하고, Container App 은 UAMI 로 참조한다.
param appPassphrase = readEnvironmentVariable('APP_PASSPHRASE')
param sessionSecret = readEnvironmentVariable('SESSION_SECRET')

// ── 선택 파라미터 ─────────────────────────────────────────────────────────────
param location      = 'eastus2'
param minReplicas   = 1    // 1 = Always On (콜드스타트 없음), 0 = 비용 절감
