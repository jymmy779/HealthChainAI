Get-ChildItem -Path "src" -Recurse -Include *.jsx,*.js | Where-Object { (Get-Content $_.FullName) -match '</write_to_file>' } | ForEach-Object {
    Write-Host "Fixing: $($_.FullName)"
    $content = Get-Content $_.FullName -Raw
    $content = $content -replace '</write_to_file>\s*$', ''
    Set-Content $_.FullName -Value $content -NoNewline
}
Write-Host "Done fixing files"