// ─────────────────────────────────────────────────────────────────────────────
// Working Memory Inbox — Azure Container Apps 인프라
//
// 생성 리소스:
//   1. User-Assigned Managed Identity  — KV 시크릿 읽기 + ACR 이미지 풀 인증
//   2. Azure Container Registry (ACR)  — 이미지 저장소 (admin 비밀 비활성, MI 풀)
//   3. Key Vault                       — 앱 시크릿 보관 (RBAC 권한 모델)
//   4. Log Analytics Workspace         — Container Apps 로그 백엔드
//   5. Container Apps Environment      — 앱 실행 환경
//   6. Container App                   — 실제 앱 (FastAPI + SPA)
//
// 시크릿 흐름 (2.3 Key Vault화):
//   - aoai-api-key / app-passphrase / session-secret → Key Vault 에 보관.
//   - Container App 은 평문 시크릿이 아니라 UAMI 로 Key Vault 를 참조(keyVaultUrl).
//   - ACR 풀은 admin password 대신 UAMI 의 AcrPull 역할로 수행.
//
// 전제:
//   - Azure OpenAI 리소스는 이미 존재함 → aoaiEndpoint/aoaiApiKey 로 주입
//   - Microsoft.App, Microsoft.OperationalInsights, Microsoft.KeyVault 공급자 등록 필요
//   - 배포 주체(사람)는 KV 시크릿 기록 권한 필요 → scripts/deploy-aca.sh 가
//     배포 전 RG 범위 'Key Vault Secrets Officer' 역할을 부여한다.
// ─────────────────────────────────────────────────────────────────────────────

@description('앱 이름 접두어 (소문자·숫자·하이픈, 최대 16자)')
@maxLength(16)
param appName string = 'lipcoding'

@description('배포 지역')
param location string = resourceGroup().location

@description('ACR 이름 (전역 고유, 소문자·숫자만, 5-50자)')
@minLength(5)
@maxLength(50)
param acrName string

@description('Key Vault 이름 (전역 고유, 3-24자, 영문자로 시작). 미지정 시 자동 생성')
@maxLength(24)
param keyVaultName string = take('kv${appName}${uniqueString(resourceGroup().id)}', 24)

@description('컨테이너 이미지 (예: myacr.azurecr.io/lipcoding-api:latest)')
param containerImage string

@description('Azure OpenAI 엔드포인트 URL')
param aoaiEndpoint string

@description('Azure OpenAI API 키 (Key Vault 시크릿으로 보관)')
@secure()
param aoaiApiKey string

@description('Azure OpenAI 배포명 (예: gpt-4o)')
param aoaiDeployment string = 'gpt-4o'

@description('Azure OpenAI API 버전')
param aoaiApiVersion string = '2024-10-21'

@description('단일 사용자 인증 패스프레이즈 (Key Vault 시크릿으로 보관)')
@secure()
param appPassphrase string

@description('세션 쿠키 서명 키 (Key Vault 시크릿으로 보관, 안정값 주입 시 재시작 후 세션 유지)')
@secure()
param sessionSecret string

@description('최소 레플리카 수 (0 = 스케일-투-제로, 1 = 콜드스타트 없음)')
@minValue(0)
@maxValue(3)
param minReplicas int = 1

// ── 내장 역할 정의 ID ─────────────────────────────────────────────────────────
var acrPullRoleId = '7f951dda-4ed3-4680-a7ca-43fe172d538d'          // AcrPull
var kvSecretsUserRoleId = '4633458b-17de-408a-b874-0445c86b69e6'    // Key Vault Secrets User

// ─────────────────────────────────────────────────────────────────────────────
// 1. User-Assigned Managed Identity
// ─────────────────────────────────────────────────────────────────────────────

resource uami 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: '${appName}-identity'
  location: location
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Azure Container Registry (admin 비밀 비활성 → MI 풀)
// ─────────────────────────────────────────────────────────────────────────────

resource acr 'Microsoft.ContainerRegistry/registries@2023-07-01' = {
  name: acrName
  location: location
  sku: { name: 'Basic' }
  properties: {
    adminUserEnabled: false
  }
}

resource acrPullAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(acr.id, uami.id, acrPullRoleId)
  scope: acr
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', acrPullRoleId)
    principalId: uami.properties.principalId
    principalType: 'ServicePrincipal'
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Key Vault (RBAC 권한 모델) + 앱 시크릿
// ─────────────────────────────────────────────────────────────────────────────

resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: keyVaultName
  location: location
  properties: {
    tenantId: subscription().tenantId
    sku: { family: 'A', name: 'standard' }
    enableRbacAuthorization: true
    enableSoftDelete: true
    softDeleteRetentionInDays: 7
    publicNetworkAccess: 'Enabled'
  }
}

resource kvSecretsUserAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(keyVault.id, uami.id, kvSecretsUserRoleId)
  scope: keyVault
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', kvSecretsUserRoleId)
    principalId: uami.properties.principalId
    principalType: 'ServicePrincipal'
  }
}

resource aoaiSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'aoai-api-key'
  properties: {
    value: aoaiApiKey
  }
}

resource passphraseSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'app-passphrase'
  properties: {
    value: appPassphrase
  }
}

resource sessionSecretKv 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'session-secret'
  properties: {
    value: sessionSecret
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Log Analytics Workspace
// ─────────────────────────────────────────────────────────────────────────────

resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2022-10-01' = {
  name: '${appName}-logs'
  location: location
  properties: {
    sku: { name: 'PerGB2018' }
    retentionInDays: 30
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Container Apps Environment
// ─────────────────────────────────────────────────────────────────────────────

resource caEnv 'Microsoft.App/managedEnvironments@2024-03-01' = {
  name: '${appName}-env'
  location: location
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logAnalytics.properties.customerId
        sharedKey: logAnalytics.listKeys().primarySharedKey
      }
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. Container App
// ─────────────────────────────────────────────────────────────────────────────

resource containerApp 'Microsoft.App/containerApps@2024-03-01' = {
  name: '${appName}-api'
  location: location
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${uami.id}': {}
    }
  }
  properties: {
    environmentId: caEnv.id
    configuration: {
      ingress: {
        external: true
        targetPort: 8000
        transport: 'auto'
        allowInsecure: false
      }
      registries: [
        {
          server: acr.properties.loginServer
          identity: uami.id
        }
      ]
      secrets: [
        {
          name: 'aoai-api-key'
          keyVaultUrl: '${keyVault.properties.vaultUri}secrets/aoai-api-key'
          identity: uami.id
        }
        {
          name: 'app-passphrase'
          keyVaultUrl: '${keyVault.properties.vaultUri}secrets/app-passphrase'
          identity: uami.id
        }
        {
          name: 'session-secret'
          keyVaultUrl: '${keyVault.properties.vaultUri}secrets/session-secret'
          identity: uami.id
        }
      ]
    }
    template: {
      containers: [
        {
          name: '${appName}-api'
          image: containerImage
          resources: {
            cpu: json('0.5')
            memory: '1.0Gi'
          }
          env: [
            { name: 'AZURE_OPENAI_ENDPOINT',    value: aoaiEndpoint }
            { name: 'AZURE_OPENAI_API_KEY',      secretRef: 'aoai-api-key' }
            { name: 'AZURE_OPENAI_DEPLOYMENT',   value: aoaiDeployment }
            { name: 'AZURE_OPENAI_API_VERSION',  value: aoaiApiVersion }
            { name: 'APP_PASSPHRASE',            secretRef: 'app-passphrase' }
            { name: 'SESSION_SECRET',            secretRef: 'session-secret' }
            { name: 'SESSION_HTTPS_ONLY',        value: '1' }
            { name: 'ENABLE_DOCS',               value: '0' }
            { name: 'SKIP_COPILOT_SDK',          value: '0' }
            { name: 'PORT',                      value: '8000' }
          ]
          probes: [
            {
              type: 'Liveness'
              httpGet: { path: '/health', port: 8000 }
              initialDelaySeconds: 15
              periodSeconds: 30
            }
          ]
        }
      ]
      scale: {
        minReplicas: minReplicas
        maxReplicas: 3
        rules: [
          {
            name: 'http-scaling'
            http: { metadata: { concurrentRequests: '20' } }
          }
        ]
      }
    }
  }
  dependsOn: [
    acrPullAssignment
    kvSecretsUserAssignment
    aoaiSecret
    passphraseSecret
    sessionSecretKv
  ]
}

// ─────────────────────────────────────────────────────────────────────────────
// Outputs
// ─────────────────────────────────────────────────────────────────────────────

@description('Container App의 공개 FQDN')
output appFqdn string = containerApp.properties.configuration.ingress.fqdn

@description('앱 URL')
output appUrl string = 'https://${containerApp.properties.configuration.ingress.fqdn}'

@description('ACR 로그인 서버')
output acrLoginServer string = acr.properties.loginServer

@description('Key Vault 이름')
output keyVaultName string = keyVault.name

@description('User-Assigned Managed Identity 리소스 ID')
output identityId string = uami.id
