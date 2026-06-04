param(
  [string]$ProjectId = "foundry-26fa9",
  [string]$Region = "us-central1",
  [string]$ServiceName = "foundry-api"
)

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$backend = Join-Path $root "backend"
$envFile = Join-Path $backend ".env"

if (!(Test-Path $envFile)) {
  throw "Missing backend/.env. Create it from backend/.env.example and set production values first."
}

function Get-EnvValue([string]$Key) {
  $line = (Select-String -Path $envFile -Pattern "^$([regex]::Escape($Key))=" | Select-Object -First 1).Line
  if (!$line) { return "" }
  return $line.Substring($Key.Length + 1).Trim()
}

function Set-SecretValue([string]$Name, [string]$Value) {
  if ([string]::IsNullOrWhiteSpace($Value)) {
    throw "Secret $Name cannot be empty."
  }

  $Value | gcloud secrets create $Name --data-file=- --project $ProjectId 2>$null
  if ($LASTEXITCODE -ne 0) {
    $Value | gcloud secrets versions add $Name --data-file=- --project $ProjectId
  }
}

$envVars = @{}
Get-Content $envFile | ForEach-Object {
  $line = $_.Trim()
  if (!$line -or $line.StartsWith("#")) { return }
  $idx = $line.IndexOf("=")
  if ($idx -lt 1) { return }
  $key = $line.Substring(0, $idx).Trim()
  $value = $line.Substring($idx + 1).Trim()
  if ([string]::IsNullOrWhiteSpace($value)) { return }
  if ($key -in @(
    "OPENROUTER_API_KEY",
    "OPENROUTER_API_KEYS",
    "OLLAMA_API_KEY",
    "FIREBASE_SERVICE_ACCOUNT_JSON",
    "GOOGLE_APPLICATION_CREDENTIALS"
  )) { return }
  $envVars[$key] = $value
}

$envVars["CORS_ORIGINS"] = "https://foundry-26fa9.web.app,https://foundry-26fa9.firebaseapp.com"
$envVars["GOOGLE_CLOUD_PROJECT"] = $ProjectId
$envVars["USE_MEMORY_DB"] = "false"
$envVars["USE_FIRESTORE_DB"] = "true"

# Use an alternate delimiter because CORS_ORIGINS intentionally contains commas.
$setEnvVars = "^@^" + (($envVars.GetEnumerator() | Sort-Object Key | ForEach-Object { "$($_.Key)=$($_.Value)" }) -join "@")

Write-Host "Enabling required Google APIs..."
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com secretmanager.googleapis.com firestore.googleapis.com --project $ProjectId --quiet
if ($LASTEXITCODE -ne 0) {
  throw "Google API enablement failed. Make sure billing is enabled for project $ProjectId, then rerun this script."
}

$databaseName = "(default)"
$existingFirestore = gcloud firestore databases describe --database $databaseName --project $ProjectId --format "value(name)" 2>$null
if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($existingFirestore)) {
  Write-Host "Creating Firestore database in Native mode..."
  gcloud firestore databases create --database $databaseName --location "nam5" --project $ProjectId --quiet
  if ($LASTEXITCODE -ne 0) {
    throw "Firestore database creation failed. Create the default Firestore database in Firebase/Google Cloud, then rerun."
  }
}

Write-Host "Creating/updating OpenRouter secrets..."
$openRouterKeys = Get-EnvValue "OPENROUTER_API_KEYS"
$openRouterKey = Get-EnvValue "OPENROUTER_API_KEY"
if (![string]::IsNullOrWhiteSpace($openRouterKey)) {
  $openRouterSecretValue = $openRouterKey
  $openRouterSecretName = "foundry-openrouter-api-key"
  $openRouterSecretEnv = "OPENROUTER_API_KEY"
} elseif (![string]::IsNullOrWhiteSpace($openRouterKeys)) {
  $openRouterSecretValue = $openRouterKeys
  $openRouterSecretName = "foundry-openrouter-api-keys"
  $openRouterSecretEnv = "OPENROUTER_API_KEYS"
} else {
  throw "OPENROUTER_API_KEY or OPENROUTER_API_KEYS is required in backend/.env."
}
Set-SecretValue $openRouterSecretName $openRouterSecretValue

$secretBindings = @("$openRouterSecretEnv=$openRouterSecretName`:latest")

$ollamaApiKey = Get-EnvValue "OLLAMA_API_KEY"
if (![string]::IsNullOrWhiteSpace($ollamaApiKey)) {
  Write-Host "Creating/updating Ollama secret..."
  Set-SecretValue "foundry-ollama-api-key" $ollamaApiKey
  $secretBindings += "OLLAMA_API_KEY=foundry-ollama-api-key`:latest"
}

$firebaseServiceAccountJson = Get-EnvValue "FIREBASE_SERVICE_ACCOUNT_JSON"
if (![string]::IsNullOrWhiteSpace($firebaseServiceAccountJson)) {
  Write-Host "Creating/updating Firebase service account secret..."
  Set-SecretValue "foundry-firebase-service-account-json" $firebaseServiceAccountJson
  $secretBindings += "FIREBASE_SERVICE_ACCOUNT_JSON=foundry-firebase-service-account-json`:latest"
}

Write-Host "Deploying $ServiceName to Cloud Run..."
gcloud run deploy $ServiceName `
  --source $backend `
  --project $ProjectId `
  --region $Region `
  --allow-unauthenticated `
  --set-env-vars $setEnvVars `
  --set-secrets ($secretBindings -join ",") `
  --quiet

$url = gcloud run services describe $ServiceName --project $ProjectId --region $Region --format "value(status.url)"
Write-Host "Cloud Run URL: $url"
Write-Host "Next:"
Write-Host "  `$env:REACT_APP_BACKEND_URL='$url'"
Write-Host "  npm run build --prefix frontend"
Write-Host "  firebase deploy --only hosting"
Write-Host "  `$env:BACKEND_URL='$url'; npm run qa:smoke:ai"
