# Build the Android App Bundle using Bubblewrap

# Ensure the Android project exists (run twa-init.ps1 first)
if (!(Test-Path android)) {
  Write-Error "Android project not found. Run scripts/twa-init.ps1 first."
  exit 1
}

# Run Bubblewrap commands from the android project directory so it can find twa-manifest.json
Push-Location android

try {
  # Update the project from manifest (optional but recommended)
  npx --yes @bubblewrap/cli update

  # Build release bundle
  npx --yes @bubblewrap/cli build --release
}
finally {
  Pop-Location
}

Write-Host "\nIf successful, your AAB should be at: android/app/build/outputs/bundle/release/app-release.aab"
