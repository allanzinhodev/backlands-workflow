param(
    [string]$Sdk = "$env:LOCALAPPDATA\Android\Sdk",
    [string]$Ndk = "$PSScriptRoot\build\android-ndk-r25c",
    [string]$CMake,
    [string]$Ninja,
    [string]$JavaHome = 'C:\Program Files\Android\Android Studio\jbr',
    [int]$Jobs = 4,
    [switch]$SkipNative
)
$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$out = Join-Path $root 'build\android'
$native = Join-Path $out ('native-' + (Split-Path $Ndk -Leaf))
function Run([string]$Tool, [string[]]$Arguments) {
    # Windows PowerShell can treat compiler warnings on stderr as errors.
    # A native tool's exit code determines whether its command succeeded.
    $ErrorActionPreference = 'Continue'
    & $Tool @Arguments
    if ($LASTEXITCODE -ne 0) { throw "$Tool failed (exit $LASTEXITCODE)" }
}
function FindTool([string]$Name, [string]$Explicit) {
    if ($Explicit -and (Test-Path -LiteralPath $Explicit)) { return $Explicit }
    $command = Get-Command $Name -ErrorAction SilentlyContinue
    if ($command) { return $command.Source }
    $found = Get-ChildItem 'C:\Program Files\Microsoft Visual Studio' -Filter $Name -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($found) { return $found.FullName }
    throw "Tool missing: $Name. Supply its path as a script parameter."
}
$env:JAVA_HOME = $JavaHome
$env:PATH = "$JavaHome\bin;$env:PATH"
$tools = Get-ChildItem "$Sdk\build-tools" -Directory | Sort-Object { [version]$_.Name } -Descending | Select-Object -First 1
$platform = Get-ChildItem "$Sdk\platforms" -Directory | Where-Object { Test-Path "$($_.FullName)\android.jar" } | Sort-Object { [double]($_.Name -replace '^android-', '') } -Descending | Select-Object -First 1
# Platform directory names can contain a minor version (for example android-37.0).
if (-not $platform) { throw "No Android SDK platform found in $Sdk" }
if (-not $tools) { throw "No Android Build Tools found in $Sdk" }
$androidJar = Join-Path $platform.FullName 'android.jar'
foreach ($dir in @($out, "$out\classes", "$out\dex", "$out\generated", "$out\assets")) {
    New-Item -ItemType Directory -Force $dir | Out-Null
}
if (-not $SkipNative) {
    if (-not (Test-Path "$Ndk\build\cmake\android.toolchain.cmake")) { throw "NDK missing at $Ndk. Extract android-ndk-r25c-windows.zip into client/build, or pass -Ndk." }
    $CMake = FindTool 'cmake.exe' $CMake
    $Ninja = FindTool 'ninja.exe' $Ninja
    $deps = Join-Path $root 'build\android-deps'
    if (-not (Test-Path "$deps\lib64\libluajit.a")) {
        New-Item -ItemType Directory -Force $deps | Out-Null
        Run 'tar.exe' @('-xf', "$root\android_libs.7z", '-C', $deps)
    }
    Run $CMake @('-S', "$root\android", '-B', $native, '-G', 'Ninja', "-DCMAKE_MAKE_PROGRAM=$Ninja", "-DCMAKE_TOOLCHAIN_FILE=$Ndk/build/cmake/android.toolchain.cmake", '-DANDROID_ABI=arm64-v8a', '-DANDROID_PLATFORM=android-28', '-DANDROID_STL=c++_static', '-DCMAKE_BUILD_TYPE=Release')
    Run $CMake @('--build', $native, '--parallel', "$Jobs")
}
if (-not (Test-Path "$native\libotclientv8.so")) { throw 'Native library has not been built.' }
Copy-Item "$native\libotclientv8.so" "$out\libotclientv8.so" -Force
Run "$Ndk\toolchains\llvm\prebuilt\windows-x86_64\bin\llvm-strip.exe" @('--strip-unneeded', "$out\libotclientv8.so")
Push-Location $root
try { & "$root\create_android_assets.ps1" } finally { Pop-Location }
Copy-Item "$root\android\otclientv8\assets\data.zip" "$out\assets\data.zip" -Force
$manifest = [xml](Get-Content "$root\android\otclientv8\AndroidManifest.xml")
$ns = 'http://schemas.android.com/apk/res/android'
$manifest.manifest.'uses-sdk'.SetAttribute('minSdkVersion', $ns, '28')
$manifest.manifest.application.SetAttribute('extractNativeLibs', $ns, 'true')
$manifest.manifest.application.activity.SetAttribute('exported', $ns, 'true')
$manifest.Save("$out\AndroidManifest.xml")
$unsigned = "$out\unsigned.apk"
Run "$($tools.FullName)\aapt.exe" @('package', '-f', '-m', '-M', "$out\AndroidManifest.xml", '-S', "$root\android\otclientv8\res", '-A', "$out\assets", '-I', $androidJar, '-J', "$out\generated", '-F', $unsigned)
$sources = @(Get-ChildItem "$root\android\otclientv8\src", "$out\generated" -Filter '*.java' -Recurse | ForEach-Object FullName)
Run "$JavaHome\bin\javac.exe" (@('-encoding', 'UTF-8', '-source', '8', '-target', '8', '-classpath', $androidJar, '-d', "$out\classes") + $sources)
$classes = @(Get-ChildItem "$out\classes" -Filter '*.class' -Recurse | ForEach-Object FullName)
Run "$($tools.FullName)\d8.bat" (@('--lib', $androidJar, '--min-api', '28', '--output', "$out\dex") + $classes)
Add-Type -AssemblyName System.IO.Compression.FileSystem
Add-Type -AssemblyName System.IO.Compression
$zip = [IO.Compression.ZipFile]::Open($unsigned, [IO.Compression.ZipArchiveMode]::Update)
try {
    [IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, "$out\libotclientv8.so", 'lib/arm64-v8a/libotclientv8.so') | Out-Null
    foreach ($dex in Get-ChildItem "$out\dex" -Filter '*.dex') {
        [IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $dex.FullName, $dex.Name) | Out-Null
    }
} finally { $zip.Dispose() }
$key = "$out\debug.keystore"
if (-not (Test-Path $key)) {
    Run "$JavaHome\bin\keytool.exe" @('-genkeypair', '-keystore', $key, '-storepass', 'android', '-keypass', 'android', '-alias', 'androiddebugkey', '-keyalg', 'RSA', '-keysize', '2048', '-validity', '10000', '-dname', 'CN=Android Debug,O=Android,C=US')
}
Run "$($tools.FullName)\zipalign.exe" @('-f', '4', $unsigned, "$out\aligned.apk")
$apk = "$out\AstraClient-arm64-debug.apk"
Run "$($tools.FullName)\apksigner.bat" @('sign', '--ks', $key, '--ks-pass', 'pass:android', '--key-pass', 'pass:android', '--out', $apk, "$out\aligned.apk")
Run "$($tools.FullName)\apksigner.bat" @('verify', '--verbose', $apk)
Write-Host "APK: $apk"
