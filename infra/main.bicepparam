using './main.bicep'

// ── 필수 파라미터 ─────────────────────────────────────────────────────────────
// acrName: 전역 고유해야 함. 소문자+숫자 5-50자.
param acrName = 'lipcoding<YOUR_SUFFIX>'   // ← 변경 필요

// containerImage: ACR 빌드 후 채워짐 (scripts/deploy-aca.sh 가 자동 설정)
param containerImage = 'lipcoding<YOUR_SUFFIX>.azurecr.io/lipcoding-api:latest'

// ── Azure OpenAI (기존 리소스) ────────────────────────────────────────────────
param aoaiEndpoint    = 'https://aoai-lipcoding-tae0yp.openai.azure.com/'
param aoaiApiKey      = readEnvironmentVariable('AZURE_OPENAI_API_KEY')  // 환경변수로 주입 — 파일에 직접 쓰지 말 것
param aoaiDeployment  = 'gpt-4o'
param aoaiApiVersion  = '2024-10-21'

// ── 인증/세션 (2.1) ───────────────────────────────────────────────────────────
// 환경변수로 주입 — 파일에 직접 쓰지 말 것. 2.3: bicep 이 이 값을 Key Vault 시크릿
// (app-passphrase/session-secret)으로 보관하고, Container App 은 UAMI 로 참조한다.
param appPassphrase = readEnvironmentVariable('APP_PASSPHRASE')
param sessionSecret = readEnvironmentVariable('SESSION_SECRET')

// ── 선택 파라미터 ─────────────────────────────────────────────────────────────
param location      = 'eastus2'
param minReplicas   = 1    // 1 = Always On (콜드스타트 없음), 0 = 비용 절감
