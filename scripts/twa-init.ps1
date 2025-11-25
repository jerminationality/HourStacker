# Initialize a Trusted Web Activity project using Bubblewrap
# Provide the hosted PWA manifest URL (Bubblewrap expects https URLs, not local files).

param(
  [string]$ManifestUrl = "https://hour-stacker.vercel.app/manifest.json",
  [string]$TargetDirectory = "android"
)

if ($ManifestUrl -notmatch '^https?://') {
  Write-Error "ManifestUrl must be an https:// URL Bubblewrap can fetch."
  exit 1
}

# Install bubblewrap if needed and init project
npx --yes @bubblewrap/cli init --manifest "$ManifestUrl" --directory "$TargetDirectory"
