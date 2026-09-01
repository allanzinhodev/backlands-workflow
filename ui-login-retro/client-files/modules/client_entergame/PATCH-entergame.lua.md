# Patch do entergame.lua — 3 funcoes

O `entergame.lua` tem 34 KB e nao vou reescrever. Sao **tres** mexidas cirurgicas.
Numeros de linha conferidos em `allanzinhodev/backlands-client@main`.

## 1. Renomear o toggle atual e criar o do email

`chooseTextMode()` esta na **linha 939**. Ela hoje age no campo de senha. Deixe-a como
esta e adicione a irma logo depois:

```lua
  function chooseTextModeEmail()
    local edit = enterGame:getChildById('accountNameTextEdit')
    edit:setTextHidden(not edit:isTextHidden())
  end
```

Se `chooseTextMode()` nao usar `isTextHidden()` e sim uma flag propria, espelhe o mesmo
padrao dela — o importante e que cada campo tenha o **seu** estado, nao um compartilhado.

> `setTextHidden` so respeita o argumento com o fix em
> `src/framework/ui/uitextedit.cpp`. Sem ele o olho mascara e nao revela. Mexer em `src/`
> **exige recompilar**.

## 2. Auto login

Adicione, perto de `chooseButtonVisibility()` (**linha 954**):

```lua
  function chooseAutoLogin()
    local box = enterGame:getChildById('autoLoginBox')
    if box:isChecked() then
      enterGame:getChildById('rememberEmailBox'):setChecked(true)
      enterGame:getChildById('rememberPasswordBox'):setChecked(true)
    end
    g_settings.set('auto-login', box:isChecked())
    g_settings.save()
    chooseButtonVisibility()
  end
```

No fim do `EnterGame.init()` (ou onde ele carrega `remember-email`):

```lua
  enterGame:getChildById('autoLoginBox'):setChecked(g_settings.getBoolean('auto-login', false))

  if g_settings.getBoolean('auto-login', false)
     and enterGame:getChildById('accountNameTextEdit'):getText() ~= ''
     and enterGame:getChildById('accountPasswordTextEdit'):getText() ~= ''
     and not G.autoLoginFired then
    G.autoLoginFired = true            -- dispara UMA vez por sessao
    scheduleEvent(function() EnterGame.doLogin() end, 200)
  end
```

## 3. Dois links em vez de um

`openPlataform(self)` recebe o widget. Ela ja distingue por `id`, ou por texto — confira.
A arvore nova manda `clickSitePassword` e `clickSiteEmail`. Garanta o segundo caso:

```lua
  -- dentro de openPlataform(widget)
  local id = widget:getId()
  if id == 'clickSiteEmail' then
    g_platform.openUrl(g_settings.get('forgot-email-url', '<sua url>'))
    return
  end
```

## 4. O que **nao** precisa mexer

- `EnterGame.onGoogleClick()` (**linha 1136**) fica no arquivo, sem chamador. Nao remova
  agora: se o botao voltar, esta la. Codigo morto sem custo de runtime.
- `accountTokenTextEdit` continua existindo (invisivel). As linhas **707** e **739** o leem
  e continuam funcionando — `clearText()` e `getText()` retornam vazio, o que e o
  comportamento correto para uma conta sem 2FA.
- `serverSelector`, `serverHostTextEdit`, `clientVersionSelector`: widgets mantidos com
  `on: false`. `EnterGame.onServerChange()` segue resolvendo.

## 5. Verificar

```bash
node tools/otui-lint.js client/modules/client_entergame/entergame.otui
vcpkg/packages/luajit_x64-windows-static/tools/luajit/luajit.exe \
  tools/lua-syntax.lua client/modules/client_entergame/entergame.lua
powershell -File tools/ui-shot.ps1 -Out shot.png
```

- [ ] Os dois olhos mascaram **e revelam**, independentes.
- [ ] Auto login dispara uma vez; desmarcar e reabrir nao dispara.
- [ ] Os dois links abrem URLs diferentes.
- [ ] Login funciona sem token (conta sem 2FA) e com token via outro fluxo.
- [ ] Nada no log sobre `accountTokenTextEdit` ou `serverSelector` nulos.
