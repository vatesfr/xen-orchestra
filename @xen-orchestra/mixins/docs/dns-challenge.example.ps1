# Example script for DNS-01 challenge automation with xo-server.
#
# Usage:
#   1. Copy this file: Copy-Item dns-challenge.example.ps1 dns-challenge.ps1
#   2. Edit the "TODO" section below to call your DNS provider's API
#   3. Run it before or alongside xo-server
#
# Requirements: PowerShell 5+

$ChallengeFile = 'C:\xo-server\dns-challenge.json'
$DoneFile = "$ChallengeFile.done"
$ChallengeDir = Split-Path $ChallengeFile
$ChallengeBasename = Split-Path -Leaf $ChallengeFile

# Wait for the challenge file to appear.
# Uses a polling loop so the script works even if xo-server writes the file
# before this script's watcher is established.
while (-not (Test-Path $ChallengeFile)) {
    $watcher = New-Object System.IO.FileSystemWatcher $ChallengeDir
    $watcher.Filter = $ChallengeBasename
    $watcher.EnableRaisingEvents = $true
    # WaitForChanged returns after the event or after the timeout (ms)
    $null = $watcher.WaitForChanged('Created,Changed', 2000)
    $watcher.Dispose()
}

$challenge = Get-Content $ChallengeFile | ConvertFrom-Json
$domain = $challenge.domain
$value = $challenge.value

# TODO: call your DNS provider's API to create the TXT record.
#
# The record to create:
#   Type:  TXT
#   Name:  $domain  (e.g. _acme-challenge.my.domain.net)
#   Value: $value   (the ACME key authorization token)
#
# Example with a fictional provider:
#   Invoke-RestMethod -Method Post `
#     -Headers @{ Authorization = "Bearer YOUR_API_TOKEN" } `
#     -Body (@{ name = $domain; value = $value } | ConvertTo-Json) `
#     -Uri "https://api.your-dns-provider.com/v1/txt-records"

Write-Host "TXT record created for $domain — waiting for propagation if needed"

# TODO (optional): sleep here if your DNS provider has slow propagation.
# Let's Encrypt may fail validation if the record hasn't propagated yet.
# Start-Sleep -Seconds 60

# Signal xo-server that the DNS record is ready.
New-Item -ItemType File $DoneFile | Out-Null
