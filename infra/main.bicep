targetScope = 'subscription'

// ─────────────────────────────────────────────────────────────────────────────
// Working Memory Inbox — azd entry point (subscription scope)
//
// Creates resource group and delegates all resource provisioning to
// ./modules/resources.bicep.  Required by `azd provision`.
// ─────────────────────────────────────────────────────────────────────────────

@description('azd environment name — used for naming and the azd-env-name tag')
param environmentName string

@description('Deployment region')
param location string

@description('Create Azure OpenAI account via IaC. false = reference existing account by name')
param createAoai bool = true

@description('Azure OpenAI account name (globally unique custom subdomain). Leave empty to auto-generate.')
param aoaiAccountName string = ''

@description('Azure OpenAI deployment name')
param aoaiDeployment string = 'gpt-5-mini'

@description('Azure OpenAI model name')
param aoaiModelName string = 'gpt-5-mini'

@description('Azure OpenAI model version')
param aoaiModelVersion string = '2025-08-07'

@description('Azure OpenAI TPM capacity (1000 TPM units)')
@minValue(1)
@maxValue(50)
param aoaiCapacity int = 30

@description('Azure OpenAI API version')
param aoaiApiVersion string = '2025-04-01-preview'

@description('Single-user auth passphrase (stored in Key Vault)')
@secure()
param appPassphrase string

@description('Session cookie signing key (stored in Key Vault)')
@secure()
param sessionSecret string

@description('Min container replicas (0 = scale-to-zero, 1 = always-on)')
@minValue(0)
@maxValue(3)
param minReplicas int = 1

// ── Derived names ─────────────────────────────────────────────────────────────

var tags = { 'azd-env-name': environmentName }
var resourceSuffix = take(uniqueString(subscription().id, environmentName, location), 6)

// ACR: alphanumeric only, 5–50 chars
var acrName = take('acr${replace(toLower(environmentName), '-', '')}${resourceSuffix}', 50)

// Key Vault: 3–24 chars, start with letter
var keyVaultName = take('kv${replace(toLower(environmentName), '-', '')}${resourceSuffix}', 24)

// Azure OpenAI: use explicit param if provided, otherwise auto-generate unique name
var resolvedAoaiAccountName = empty(aoaiAccountName)
  ? 'aoai${take(replace(toLower(environmentName), '-', ''), 8)}${resourceSuffix}'
  : aoaiAccountName

// ── Resource group ────────────────────────────────────────────────────────────

resource rg 'Microsoft.Resources/resourceGroups@2023-07-01' = {
  name: 'rg-${environmentName}'
  location: location
  tags: tags
}

// ── Resources module ──────────────────────────────────────────────────────────

module resources './modules/resources.bicep' = {
  name: 'resources'
  scope: rg
  params: {
    appName: environmentName
    location: location
    tags: tags
    acrName: acrName
    keyVaultName: keyVaultName
    createAoai: createAoai
    aoaiAccountName: resolvedAoaiAccountName
    aoaiDeployment: aoaiDeployment
    aoaiModelName: aoaiModelName
    aoaiModelVersion: aoaiModelVersion
    aoaiCapacity: aoaiCapacity
    aoaiApiVersion: aoaiApiVersion
    appPassphrase: appPassphrase
    sessionSecret: sessionSecret
    minReplicas: minReplicas
  }
}

// ── Outputs — UPPERCASE names become azd env vars ────────────────────────────

output AZURE_RESOURCE_GROUP string = rg.name
output AZURE_CONTAINER_REGISTRY_ENDPOINT string = resources.outputs.acrLoginServer
output AZURE_KEY_VAULT_NAME string = resources.outputs.keyVaultName
output API_URL string = resources.outputs.appUrl
output SERVICE_API_IDENTITY_PRINCIPAL_ID string = resources.outputs.identityPrincipalId
