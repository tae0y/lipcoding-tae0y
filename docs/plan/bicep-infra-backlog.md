# Bicep 인프라 개선 백로그

> 작성: 2026-06-28  
> 참고: [Azure Quickstart Best Practices](https://github.com/Azure/azure-quickstart-templates/blob/master/1-CONTRIBUTION-GUIDE/best-practices.md), [todo-python-mongo-aca](https://github.com/Azure-Samples/todo-python-mongo-aca), [openai-chat-app-quickstart](https://github.com/Azure-Samples/openai-chat-app-quickstart)

현재 `infra/` 코드를 GitHub Azure Samples의 표준 패턴과 비교한 결과. 보안·유지보수·관찰가능성 순으로 우선순위를 부여.

---

## P0 — 보안

### B-01: Azure OpenAI Keyless 인증 전환 (`disableLocalAuth: true`)

**현재**: `listKeys()`로 API 키를 뽑아 Key Vault에 저장 → Container App이 KV 참조로 API 키 사용.  
**모범 사례**: `disableLocalAuth: true` 설정 + Container App UAMI에 `Cognitive Services OpenAI User` 역할 부여 → API 키 자체를 없앰.

```bicep
// resources.bicep
resource aoaiAccount ... = {
  properties: {
    disableLocalAuth: true   // ← 추가
    ...
  }
}

// Cognitive Services OpenAI User role
var cogOpenAiUserRoleId = '5e0bd9bd-7b93-4f28-af87-19fc36ad61bd'
resource openAiRoleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(aoaiAccount.id, uami.id, cogOpenAiUserRoleId)
  scope: aoaiAccount
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', cogOpenAiUserRoleId)
    principalId: uami.properties.principalId
    principalType: 'ServicePrincipal'
  }
}
```

앱 측: `AZURE_OPENAI_API_KEY` 환경변수 제거, SDK를 `DefaultAzureCredential`로 교체.

**효과**: KV에 AOAI 키 자체가 존재하지 않음 → 키 유출 표면 제거.

---

### B-02: `dependsOn` 명시적 선언 제거

**현재**: `containerApp` 리소스에 `dependsOn: [acrPullAssignment, kvSecretsUserAssignment, aoaiSecret, ...]` 명시.  
**모범 사례**: Bicep은 symbolic reference로 암묵적 의존성을 자동 추적하므로, 같은 템플릿 내 리소스에 대해 `dependsOn`은 대부분 불필요.  
예외: 역할 할당처럼 **참조가 없지만 순서가 필요한** 케이스는 `dependsOn` 유지.

```bicep
// 제거 대상 — aoaiSecret, passphraseSecret, sessionSecretKv는
// secretRef 경유라 직접 참조가 없지만, KV 시크릿이 존재해야 배포가 성공함
// → 이 케이스는 dependsOn 유지가 올바름 (아래 B-02는 코드 리뷰 시 재확인)
```

실제 제거 가능 여부는 배포 테스트 후 확인 필요. 현재 코드는 안전을 위해 유지도 허용.

---

## P1 — 관찰가능성

### B-03: Application Insights 추가

**현재**: Log Analytics Workspace만 존재. 분산 추적, 실시간 스트림, 실패 분석 불가.  
**모범 사례**: Azure Samples 표준 `monitoring` 모듈 = Log Analytics + Application Insights 쌍.

```bicep
resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: '${appName}-appi'
  location: location
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logAnalytics.id
  }
}
```

Container App 환경변수에 `APPLICATIONINSIGHTS_CONNECTION_STRING` 추가.  
FastAPI 앱은 `opencensus-ext-azure` 또는 `azure-monitor-opentelemetry` 연동.

---

### B-04: Container App에 Readiness / Startup Probe 추가

**현재**: `Liveness` probe만 정의. 콜드스타트 시 트래픽이 들어와 502 발생 가능.  
**모범 사례**: Startup → Readiness → Liveness 세 가지 probe 분리.

```bicep
probes: [
  {
    type: 'Startup'
    httpGet: { path: '/health', port: 8000 }
    initialDelaySeconds: 5
    periodSeconds: 5
    failureThreshold: 12   // 최대 60초 스타트업 허용
  }
  {
    type: 'Readiness'
    httpGet: { path: '/health', port: 8000 }
    periodSeconds: 10
  }
  {
    type: 'Liveness'
    httpGet: { path: '/health', port: 8000 }
    initialDelaySeconds: 15
    periodSeconds: 30
  }
]
```

---

## P2 — 유지보수성

### B-05: `abbreviations.json` 도입 및 리소스 네이밍 표준화

**현재**: `kv${...}`, `acr${...}`, `aoai${...}` 등 임의 접두어를 main/resources 양쪽에 분산 하드코딩.  
**모범 사례**: Azure 공식 약어 파일(`abbreviations.json`)을 `infra/` 에 두고 `loadJsonContent`로 참조.

```bicep
// main.bicep
var abbrs = loadJsonContent('./abbreviations.json')
var resourceToken = toLower(uniqueString(subscription().id, environmentName, location))

var acrName     = take('${abbrs.containerRegistryRegistries}${resourceToken}', 50)
var keyVaultName = take('${abbrs.keyVaultVaults}${resourceToken}', 24)
```

공식 abbreviations.json: [Azure Samples todo-python-mongo-aca](https://github.com/Azure-Samples/todo-python-mongo-aca/blob/main/infra/abbreviations.json)

**효과**: 리소스 이름이 Azure CAF 네이밍 규칙 자동 준수, main↔modules 간 중복 선언 제거.

---

### B-06: 파라미터 중복 선언 제거 (main → resources pass-through)

**현재**: `aoaiModelName`, `aoaiModelVersion`, `aoaiDeployment`, `aoaiCapacity`, `aoaiApiVersion`이 `main.bicep`과 `resources.bicep` 양쪽에 동일하게 선언됨.  
**모범 사례**: main에서 선언, resources에는 `param`으로 받아서 사용. 중복 `@description`과 constraint 제거.

현재 resources.bicep의 파라미터 중 main.bicep에서 그대로 pass-through되는 것들 → resources.bicep에서는 `@description` 생략 또는 최소화 가능.

---

### B-07: AVM(Azure Verified Modules) 점진적 도입 검토

**현재**: 모든 리소스를 직접 정의.  
**모범 사례**: Azure Samples 최신 템플릿은 공개 Bicep 레지스트리의 검증된 모듈을 사용.

```bicep
// 예시: Key Vault를 AVM으로 교체
module keyVault 'br/public:avm/res/key-vault/vault:0.11.0' = {
  name: 'keyvault'
  scope: rg
  params: {
    name: keyVaultName
    enableRbacAuthorization: true
    enableSoftDelete: true
    ...
  }
}
```

- 장점: API 버전 자동 관리, WAF 정렬 파라미터 내장, 린트 통과.
- 단점: 레지스트리 의존성 추가, 파라미터 인터페이스 변경 필요.
- 권장 순서: Log Analytics → Key Vault → Managed Identity (복잡도 낮은 것부터).

---

### B-08: 리소스 속성 정렬 순서 통일

**모범 사례** (ARM best-practices.md 기준):

```bicep
@description(...)
resource foo '...' = {
  name: ...
  location: ...
  sku: ...
  kind: ...
  identity: ...
  tags: ...       // ← 현재 일부 리소스에서 앞에 위치
  properties: ...
}
```

현재 `logAnalytics`, `caEnv`에서 `tags` 없음(main의 tags가 pass-through되지 않음) → `tags: tags` 추가도 함께 권장.

---

## P3 — 확장성 (필요 시)

### B-09: OpenAI 리소스 별도 리소스 그룹/구독 지원

**모범 사례**: `openai-chat-app-quickstart`는 `openAiResourceGroupName` 파라미터로 AOAI를 별도 RG에 두고 `existing` 참조. 쿼터가 부족한 구독에서 기존 계정 공유 가능.

```bicep
param openAiResourceGroupName string = ''
resource openAiResourceGroup 'Microsoft.Resources/resourceGroups@2021-04-01' existing = if (!empty(openAiResourceGroupName)) {
  name: !empty(openAiResourceGroupName) ? openAiResourceGroupName : rg.name
}
```

현재 `createAoai=false` 로직은 이미 partial 지원이나, 별도 RG 참조는 미지원.

---

### B-10: Log Analytics sharedKey 방식 → workspace resource ID 방식 전환

**현재**: `logAnalytics.listKeys().primarySharedKey`를 Container Apps Environment에 직접 주입.  
**추세**: Container Apps Environment는 `workspaceResourceId` 단독 지정으로 shared key 불필요한 방향으로 API가 발전 중.

```bicep
// 현재
logAnalyticsConfiguration: {
  customerId: logAnalytics.properties.customerId
  sharedKey: logAnalytics.listKeys().primarySharedKey
}

// 대안 (API 버전 확인 후 적용)
// daprAIConnectionString or workspaceId 단독 참조로 이동 가능 여부 확인 필요
```

---

## 요약 우선순위 표

| ID | 항목 | 우선순위 | 공수 | 효과 |
|---|---|---|---|---|
| B-01 | AOAI Keyless 인증 (`disableLocalAuth`) | P0 | 중 | 키 유출 표면 제거 |
| B-03 | Application Insights 추가 | P1 | 소 | 운영 가시성 확보 |
| B-04 | Startup/Readiness Probe | P1 | 소 | 콜드스타트 502 방지 |
| B-05 | abbreviations.json 네이밍 표준화 | P2 | 소 | CAF 준수, 중복 제거 |
| B-06 | 파라미터 중복 제거 | P2 | 소 | 유지보수성 |
| B-07 | AVM 도입 | P2 | 대 | 장기 유지보수성 |
| B-08 | 리소스 속성 정렬 + tags 보완 | P2 | 소 | 일관성 |
| B-09 | AOAI 별도 RG 지원 | P3 | 중 | 쿼터 공유 시나리오 |
| B-10 | Log Analytics sharedKey 제거 | P3 | 소 | 비밀 표면 축소 |
| B-02 | `dependsOn` 정리 | P0 | 소 | 코드 정확성 |
