# Initialize a Trusted Web Activity project using Bubblewrap
# Edit twa/twa-manifest.json first, then run this script.

param(
  [string]$ManifestPath = "twa/twa-manifest.json"
)

if (!(Test-Path $ManifestPath)) {
  Write-Error "Manifest not found: $ManifestPath"
  exit 1
}

# Install bubblewrap if needed and init project
npx --yes @bubblewrap/cli init --manifest "$ManifestPath"
