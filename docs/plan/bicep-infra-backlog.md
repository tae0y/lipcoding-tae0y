# Bicep Infrastructure Improvement Backlog

> Created: 2026-06-28
> References: [Azure Quickstart Best Practices](https://github.com/Azure/azure-quickstart-templates/blob/master/1-CONTRIBUTION-GUIDE/best-practices.md), [todo-python-mongo-aca](https://github.com/Azure-Samples/todo-python-mongo-aca), [openai-chat-app-quickstart](https://github.com/Azure-Samples/openai-chat-app-quickstart)

Results of comparing the current `infra/` code against standard patterns from GitHub Azure Samples.
Prioritized in order of: security → observability → maintainability.

---

## P0 — Security

### B-01: Azure OpenAI Keyless Authentication (`disableLocalAuth: true`)

**Current**: API key extracted via `listKeys()`, stored in Key Vault → Container App reads it via KV reference.
**Best practice**: Set `disableLocalAuth: true` + grant Container App UAMI the `Cognitive Services OpenAI User` role → eliminate the API key entirely.

```bicep
// resources.bicep
resource aoaiAccount ... = {
  properties: {
    disableLocalAuth: true   // <- add this
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

App side: remove `AZURE_OPENAI_API_KEY` env var, replace SDK with `DefaultAzureCredential`.

**Effect**: AOAI key does not exist in KV at all → key leakage surface eliminated.

---

### B-02: Remove Explicit `dependsOn` Declarations

**Current**: `containerApp` resource has `dependsOn: [acrPullAssignment, kvSecretsUserAssignment, aoaiSecret, ...]` explicitly.
**Best practice**: Bicep tracks implicit dependencies via symbolic references automatically; `dependsOn` is mostly unnecessary for resources in the same template.
Exception: role assignments where **order is required but there is no reference** — keep `dependsOn` for those.

```bicep
// Candidates for removal — aoaiSecret, passphraseSecret, sessionSecretKv have no direct
// reference (via secretRef), but the KV secret must exist for deployment to succeed
// → this case is correct to keep dependsOn (review B-02 during code review)
```

Whether actual removal is safe must be confirmed after a deployment test. The current code is acceptable to keep for safety.

---

## P1 — Observability

### B-03: Add Application Insights

**Current**: Only Log Analytics Workspace exists. No distributed tracing, real-time stream, or failure analysis.
**Best practice**: Azure Samples standard `monitoring` module = Log Analytics + Application Insights pair.

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

Add `APPLICATIONINSIGHTS_CONNECTION_STRING` to Container App environment variables.
FastAPI app integrates via `opencensus-ext-azure` or `azure-monitor-opentelemetry`.

---

### B-04: Add Readiness / Startup Probes to Container App

**Current**: Only `Liveness` probe defined. Traffic hitting the app during cold start can cause 502s.
**Best practice**: Separate Startup → Readiness → Liveness into three distinct probes.

```bicep
probes: [
  {
    type: 'Startup'
    httpGet: { path: '/health', port: 8000 }
    initialDelaySeconds: 5
    periodSeconds: 5
    failureThreshold: 12   // allow up to 60s startup
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

## P2 — Maintainability

### B-05: Introduce `abbreviations.json` and Standardize Resource Naming

**Current**: Arbitrary prefixes like `kv${...}`, `acr${...}`, `aoai${...}` hardcoded in both main and resources.
**Best practice**: Place the official Azure abbreviations file (`abbreviations.json`) in `infra/` and reference via `loadJsonContent`.

```bicep
// main.bicep
var abbrs = loadJsonContent('./abbreviations.json')
var resourceToken = toLower(uniqueString(subscription().id, environmentName, location))

var acrName      = take('${abbrs.containerRegistryRegistries}${resourceToken}', 50)
var keyVaultName = take('${abbrs.keyVaultVaults}${resourceToken}', 24)
```

Official abbreviations.json: [Azure Samples todo-python-mongo-aca](https://github.com/Azure-Samples/todo-python-mongo-aca/blob/main/infra/abbreviations.json)

**Effect**: Resource names automatically comply with Azure CAF naming conventions; eliminates duplicate declarations between main↔modules.

---

### B-06: Remove Duplicate Parameter Declarations (main → resources pass-through)

**Current**: `aoaiModelName`, `aoaiModelVersion`, `aoaiDeployment`, `aoaiCapacity`, `aoaiApiVersion`
are declared identically in both `main.bicep` and `resources.bicep`.
**Best practice**: Declare in main, receive in resources as `param`. Remove duplicate `@description` and constraints.

Parameters in resources.bicep that are pass-throughs from main.bicep → can omit or minimize `@description` in resources.bicep.

---

### B-07: Evaluate Gradual AVM (Azure Verified Modules) Adoption

**Current**: All resources defined inline.
**Best practice**: Latest Azure Samples templates use verified modules from the public Bicep registry.

```bicep
// Example: replace Key Vault with AVM
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

- Pros: automatic API version management, WAF-aligned parameters built-in, passes lint.
- Cons: adds registry dependency, requires parameter interface changes.
- Recommended order: Log Analytics → Key Vault → Managed Identity (start with lowest complexity).

---

### B-08: Standardize Resource Property Ordering

**Best practice** (per ARM best-practices.md):

```bicep
@description(...)
resource foo '...' = {
  name: ...
  location: ...
  sku: ...
  kind: ...
  identity: ...
  tags: ...       // <- currently placed first in some resources
  properties: ...
}
```

`logAnalytics` and `caEnv` currently have no `tags` (main's tags are not passed through) → also recommended to add `tags: tags`.

---

## P3 — Scalability (as needed)

### B-09: Support OpenAI Resource in a Separate Resource Group / Subscription

**Best practice**: `openai-chat-app-quickstart` uses an `openAiResourceGroupName` parameter to place AOAI in a separate RG and reference it via `existing`. Enables sharing an existing account when quota is limited in a subscription.

```bicep
param openAiResourceGroupName string = ''
resource openAiResourceGroup 'Microsoft.Resources/resourceGroups@2021-04-01' existing = if (!empty(openAiResourceGroupName)) {
  name: !empty(openAiResourceGroupName) ? openAiResourceGroupName : rg.name
}
```

The current `createAoai=false` logic already provides partial support, but separate RG references are not supported.

---

### B-10: Migrate Log Analytics from sharedKey to workspace Resource ID

**Current**: `logAnalytics.listKeys().primarySharedKey` is injected directly into the Container Apps Environment.
**Trend**: The Container Apps Environment API is evolving toward `workspaceResourceId` alone, eliminating the need for a shared key.

```bicep
// Current
logAnalyticsConfiguration: {
  customerId: logAnalytics.properties.customerId
  sharedKey: logAnalytics.listKeys().primarySharedKey
}

// Alternative (verify API version before applying)
// Check if daprAIConnectionString or workspaceId alone can replace the above
```

---

## Summary Priority Table

| ID | Item | Priority | Effort | Effect |
|---|---|---|---|---|
| B-01 | AOAI Keyless auth (`disableLocalAuth`) | P0 | Medium | Eliminates key leakage surface |
| B-03 | Add Application Insights | P1 | Small | Operational visibility |
| B-04 | Startup/Readiness Probe | P1 | Small | Prevents cold-start 502s |
| B-05 | abbreviations.json naming standard | P2 | Small | CAF compliance, removes duplication |
| B-06 | Remove duplicate parameters | P2 | Small | Maintainability |
| B-07 | AVM adoption | P2 | Large | Long-term maintainability |
| B-08 | Resource property ordering + tags | P2 | Small | Consistency |
| B-09 | AOAI separate RG support | P3 | Medium | Quota sharing scenario |
| B-10 | Remove Log Analytics sharedKey | P3 | Small | Reduces secret surface |
| B-02 | Clean up `dependsOn` | P0 | Small | Code correctness |
