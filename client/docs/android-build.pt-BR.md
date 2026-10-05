# Compilar o APK Android no Windows

O build por linha de comando usa `android/CMakeLists.txt` e
`build_android.ps1`. O projeto antigo do Visual Studio continua em `android/`.

## Ferramentas

- Android SDK com uma plataforma instalada e Android Build Tools (aapt, d8,
  zipalign e apksigner).
- JDK; o script usa por padrão o `jbr` do Android Studio.
- CMake e Ninja no PATH, ou instalados com o Visual Studio.
- NDK r25c, com suporte a `std::filesystem`, e as bibliotecas pré-compiladas
  de `android_libs.7z`.

Baixe o [NDK r25c oficial](https://dl.google.com/android/repository/android-ndk-r25c-windows.zip)
e extraia em `client/build/`, formando `build/android-ndk-r25c/`.
O SDK e o JDK já instalados pelo Android Studio podem ser aproveitados.

## Build

Na pasta `client`, execute:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\build_android.ps1
```

Se necessário, informe os caminhos com `-Sdk`, `-Ndk`, `-JavaHome`, `-CMake`
e `-Ninja`. Use `-Jobs 4` para limitar o paralelismo.

O script extrai as dependências, compila `libotclientv8.so`, gera `data.zip`,
compila a Activity Java, gera o DEX, empacota, alinha, assina e verifica o APK.
Não precisa abrir Android Studio nem Visual Studio.

Saída: `build/android/AstraClient-arm64-debug.apk`.

Esta configuração é ARM64, Android 9/API 28 ou superior, com OpenGL ES 2.
O código nativo é otimizado em Release, mas o APK usa uma chave de teste local
em `build/android/debug.keystore`. Guarde essa chave para instalar atualizações
com a mesma assinatura. Este fluxo não gera pacote para publicação na Play Store.

Os assets vêm de `init.lua`, `data/`, `modules/`, `layouts/` e `mods/`, incluindo
os DAT/SPR locais. Para atualizar apenas assets e Java depois de compilar o
código nativo, use `-SkipNative`.

## Instalar

Com depuração USB habilitada e o aparelho autorizado:

```powershell
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" install -r .\build\android\AstraClient-arm64-debug.apk
```

Configure o endereço do servidor em `init.lua` antes de empacotar.
`127.0.0.1` no aparelho aponta para o próprio aparelho. Para testes por USB
com um servidor local, `adb reverse tcp:7171 tcp:7171` encaminha a porta de
login; a porta de jogo também precisa ser encaminhada, e o endereço anunciado
pelo servidor deve ser acessível pelo aparelho.

O APK precisa ser testado no aparelho para validar toque, teclado, renderização
e conexão. A verificação de assinatura não substitui esse teste.
