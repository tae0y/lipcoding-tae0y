// ─────────────────────────────────────────────────────────────────────────────
// Working Memory Inbox — Azure Container Apps 인프라
//
// 생성 리소스:
//   1. Azure Container Registry (ACR)  — 이미지 저장소
//   2. Log Analytics Workspace         — Container Apps 로그 백엔드
//   3. Container Apps Environment      — 앱 실행 환경
//   4. Container App                   — 실제 앱 (FastAPI + SPA)
//
// 전제:
//   - Azure OpenAI 리소스는 이미 존재함 → aoaiEndpoint/aoaiKey 로 주입
//   - Microsoft.App, Microsoft.OperationalInsights 공급자 등록 필요
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

@description('컨테이너 이미지 (예: myacr.azurecr.io/lipcoding-api:latest)')
param containerImage string

@description('Azure OpenAI 엔드포인트 URL')
param aoaiEndpoint string

@description('Azure OpenAI API 키')
@secure()
param aoaiApiKey string

@description('Azure OpenAI 배포명 (예: gpt-4o)')
param aoaiDeployment string = 'gpt-4o'

@description('Azure OpenAI API 버전')
param aoaiApiVersion string = '2024-10-21'

@description('최소 레플리카 수 (0 = 스케일-투-제로, 1 = 콜드스타트 없음)')
@minValue(0)
@maxValue(3)
param minReplicas int = 1

// ─────────────────────────────────────────────────────────────────────────────
// 1. Azure Container Registry
// ─────────────────────────────────────────────────────────────────────────────

resource acr 'Microsoft.ContainerRegistry/registries@2023-07-01' = {
  name: acrName
  location: location
  sku: { name: 'Basic' }
  properties: {
    adminUserEnabled: true
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Log Analytics Workspace
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
// 3. Container Apps Environment
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
// 4. Container App
// ─────────────────────────────────────────────────────────────────────────────

resource containerApp 'Microsoft.App/containerApps@2024-03-01' = {
  name: '${appName}-api'
  location: location
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
          username: acr.name
          passwordSecretRef: 'acr-password'
        }
      ]
      secrets: [
        {
          name: 'acr-password'
          value: acr.listCredentials().passwords[0].value
        }
        {
          name: 'aoai-api-key'
          value: aoaiApiKey
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
