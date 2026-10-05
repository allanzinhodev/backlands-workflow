$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
Add-Type -AssemblyName System.IO.Compression
$root = $PSScriptRoot
$destination = Join-Path $root 'android\otclientv8\assets\data.zip'
$temporary = "$destination.tmp"
New-Item -ItemType Directory -Force (Split-Path $destination) | Out-Null
$output = [IO.File]::Open($temporary, [IO.FileMode]::Create, [IO.FileAccess]::Write, [IO.FileShare]::None)
$archive = New-Object IO.Compression.ZipArchive($output, [IO.Compression.ZipArchiveMode]::Create)
try {
    foreach ($name in @('init.lua', 'data', 'modules', 'layouts', 'mods')) {
        $files = Get-ChildItem (Join-Path $root $name) -Recurse -File
        foreach ($file in $files) {
            $relative = $file.FullName.Substring($root.Length + 1).Replace('\', '/')
            $entry = $archive.CreateEntry($relative, [IO.Compression.CompressionLevel]::Fastest)
            # Allow assets to be read while a desktop client has them open.
            $input = [IO.File]::Open($file.FullName, [IO.FileMode]::Open, [IO.FileAccess]::Read, [IO.FileShare]::ReadWrite)
            try {
                $entryStream = $entry.Open()
                try { $input.CopyTo($entryStream) } finally { $entryStream.Dispose() }
            } finally { $input.Dispose() }
        }
    }
} finally { $archive.Dispose(); $output.Dispose() }
Move-Item -LiteralPath $temporary -Destination $destination -Force
