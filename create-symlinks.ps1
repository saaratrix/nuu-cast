param(
    [string]$NuufetchBase = (Join-Path $PSScriptRoot "..\nuufetch")
)

$NuucastBase = $PSScriptRoot

# Each item is: @("target path in Project A", "source path in Project B")
$Links = @(
    @("nuuwatch-files", "frontend/modules/local"),
    @("nuuwatch-files", "src/components"),
    @("",     "nuufetch")
)

$NuucastBase = [System.IO.Path]::GetFullPath($NuucastBase)
$NuufetchBase = [System.IO.Path]::GetFullPath($NuufetchBase)

foreach ($Link in $Links) {
    $SourcePrefix = $Link[0]
    $RelativePath = $Link[1]

    $Target = [System.IO.Path]::GetFullPath(
        [System.IO.Path]::Combine($NuucastBase, $SourcePrefix, $RelativePath)
    )

    $Source = [System.IO.Path]::GetFullPath(
        [System.IO.Path]::Combine($NuufetchBase, $RelativePath)
    )

    try {
        New-Item -ItemType SymbolicLink -Path $Target -Target $Source -ErrorAction Stop | Out-Null
        Write-Host "Linked: $Target -> $Source"
    }
    catch {
        Write-Host "Skipping: $Target"
    }
}
