# Kenney City Kit Commercial + Industrial (CC0) → curated office / commercial / factory GLBs
$ErrorActionPreference = 'Stop'
$proj = Resolve-Path (Join-Path $PSScriptRoot '..')
$dst = Join-Path $proj 'public\models\buildings'
$commZip = Join-Path $proj 'public\models\_kenney_city-kit-commercial.zip'
$indZip = Join-Path $proj 'public\models\_kenney_city-kit-industrial.zip'
$commExtract = Join-Path $proj 'public\models\_kenney_extract'
$indExtract = Join-Path $proj 'public\models\_kenney_ind_extract'

Write-Host 'Downloading Kenney City Kit (Commercial)...'
curl.exe -sL -o $commZip 'https://kenney.nl/media/pages/assets/city-kit-commercial/a742d900eb-1753115042/kenney_city-kit-commercial_2.1.zip'
Write-Host 'Downloading Kenney City Kit (Industrial)...'
curl.exe -sL -o $indZip 'https://kenney.nl/media/pages/assets/city-kit-industrial/5fcb837741-1750838303/kenney_city-kit-industrial_1.0.zip'

foreach ($z in @($commZip, $indZip)) {
  if ((Get-Item $z).Length -lt 100000) { throw "Download failed: $z" }
}

if (Test-Path $commExtract) { Remove-Item -Recurse -Force $commExtract }
if (Test-Path $indExtract) { Remove-Item -Recurse -Force $indExtract }
Expand-Archive -Path $commZip -DestinationPath $commExtract -Force
Expand-Archive -Path $indZip -DestinationPath $indExtract -Force

$commSrc = Join-Path $commExtract 'Models\GLB format'
$indSrc = Join-Path $indExtract 'Models\GLB format'
New-Item -ItemType Directory -Force -Path $dst | Out-Null

Get-ChildItem $dst -Filter '*.glb' | Remove-Item -Force

$sky = @('building-skyscraper-a','building-skyscraper-b','building-skyscraper-c','building-skyscraper-d','building-skyscraper-e')
foreach ($n in $sky) { Copy-Item (Join-Path $commSrc "$n.glb") (Join-Path $dst "$n.glb") -Force }

Copy-Item (Join-Path $commSrc 'low-detail-building-wide-a.glb') (Join-Path $dst 'commercial-wide-a.glb') -Force
Copy-Item (Join-Path $commSrc 'low-detail-building-wide-b.glb') (Join-Path $dst 'commercial-wide-b.glb') -Force
foreach ($n in @('j','k','l','m','n')) {
  Copy-Item (Join-Path $commSrc "low-detail-building-$n.glb") (Join-Path $dst "office-block-$n.glb") -Force
}

Get-ChildItem (Join-Path $indSrc 'building-*.glb') | ForEach-Object {
  Copy-Item $_.FullName (Join-Path $dst "industrial-$($_.BaseName).glb") -Force
}

Copy-Item (Join-Path $commExtract 'License.txt') (Join-Path $dst 'LICENSE-kenney.txt') -Force
"@ Kenney City Kit Commercial 2.1 + Industrial 1.0 (CC0)`n$(Get-Content (Join-Path $dst 'LICENSE-kenney.txt') -Raw)" | Set-Content (Join-Path $dst 'LICENSE-kenney.txt')

Write-Host "Copied $((Get-ChildItem $dst -Filter '*.glb').Count) building GLBs (skyscrapers, commercial blocks, factories)."
