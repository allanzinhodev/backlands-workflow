import { describe, it, expect, beforeEach, vi } from 'vitest';
import { g_ui } from '../src/otui/g_ui.js';
import { registerCoreWidgets } from '../src/otui/widgets.js';
import { loadClientStyles } from '../src/otui/clientStyles.js';
import { EnterGame } from '../src/modules/client_entergame/entergame.js';
import { g_settings } from '../src/game/g_settings.js';

// Este teste monta a tela a partir do entergame.otui REAL do AstraClient. Se o arquivo do cliente
// mudar de forma incompativel, e aqui que aparece.

function mountRoot() {
  document.body.innerHTML = '<div id="ui-root"></div>';
  const root = document.getElementById('ui-root');
  Object.defineProperty(root, 'clientWidth', { value: 1024, configurable: true });
  Object.defineProperty(root, 'clientHeight', { value: 768, configurable: true });
  return g_ui.init('ui-root');
}

describe('estilos do cliente', () => {
  beforeEach(() => {
    g_ui.registry.styles.clear();
    g_ui.registry.unique.clear();
    g_ui.registry.globals.clear();
    registerCoreWidgets(g_ui);
  });

  it('importa todos os arquivos de estilo do cliente sem erro', () => {
    const failures = loadClientStyles(g_ui);
    expect(failures).toEqual([]);
  });

  it('resolve a heranca em cadeia ate o estilo base', () => {
    loadClientStyles(g_ui);
    // EnterGameWindow < StaticMainWindow < StaticWindow < Window < UIWindow
    const style = g_ui.registry.getStyle('EnterGameWindow');
    expect(style).not.toBeNull();
    expect(style.luaClass).toBe('UIWindow');
    // size vem do proprio 40-entergame.otui
    expect(style.get('size').value).toBe('280 231');
    // image-source vem la de Window, tres niveis acima
    expect(style.get('image-source').value).toBe('/images/ui/popupwindow');
    // e o padding-top tambem
    expect(style.get('padding-top').value).toBe('35');
  });

  it('resolve $var- pelas variaveis globais de 0-vars.otui', () => {
    loadClientStyles(g_ui);
    expect(g_ui.registry.resolveVars('$var-text-cip-color')).toBe('#c0c0c0');
    // var-cip-font nao existe em nenhum .otui do cliente; resolvemos explicitamente
    expect(g_ui.registry.resolveVars('$var-cip-font')).toBe('verdana-11px-antialised');
  });

  it('le os blocos de estado do Button na ordem de declaracao', () => {
    loadClientStyles(g_ui);
    const style = g_ui.registry.getStyle('Button');
    const states = style.childNodes().filter((c) => c.tag.startsWith('$')).map((c) => c.tag);
    expect(states).toEqual(['$hover !disabled', '$pressed', '$on', '$checked', '$disabled']);
  });
});

describe('tela de login', () => {
  let enterGame;

  beforeEach(() => {
    g_ui.registry.styles.clear();
    g_ui.registry.unique.clear();
    g_ui.registry.globals.clear();
    registerCoreWidgets(g_ui);
    mountRoot();
    loadClientStyles(g_ui);
    g_settings.clear();
    enterGame = new EnterGame({ onLogin: () => ({ ok: true }) });
    enterGame.create();
  });

  it('monta a janela a partir do entergame.otui do cliente', () => {
    expect(enterGame.window).not.toBeNull();
    expect(enterGame.window.styleName).toBe('EnterGameWindow');
    expect(enterGame.window.rect.w).toBe(280);
    expect(enterGame.window.rect.h).toBe(231);
  });

  it('encontra os campos por id, como o entergame.lua faz', () => {
    expect(enterGame.accountEdit).not.toBeNull();
    expect(enterGame.passwordEdit).not.toBeNull();
    expect(enterGame.tokenEdit).not.toBeNull();
    expect(enterGame.loginButton).not.toBeNull();
    expect(enterGame.rememberEmailBox).not.toBeNull();
    expect(enterGame.rememberPasswordBox).not.toBeNull();
  });

  it('usa input do tipo password no campo de senha', () => {
    expect(enterGame.passwordEdit.input.type).toBe('password');
    expect(enterGame.accountEdit.input.type).toBe('text');
  });

  it('respeita max-length declarado no otui', () => {
    expect(enterGame.accountEdit.input.maxLength).toBe(49);
    expect(enterGame.tokenEdit.input.maxLength).toBe(6);
  });

  it('preenche o seletor de servidor com a tabela Servers', () => {
    expect(enterGame.serverSelector.options.map((o) => o.text)).toEqual(['LocalTestServ']);
    expect(enterGame.serverSelector.getCurrentOption().data.port).toBe(7171);
  });

  it('senha vazia nao tenta logar e nao mostra erro (fiel ao performLogin)', () => {
    const onLogin = vi.fn();
    enterGame.onLogin = onLogin;
    enterGame.accountEdit.setText('1');
    enterGame.passwordEdit.setText('');
    enterGame.doLogin();
    expect(onLogin).not.toHaveBeenCalled();
    expect(document.querySelector('.otui-modal')).toBeNull();
  });

  it('abre o box "Connecting to login server..." ao logar', () => {
    enterGame.accountEdit.setText('1');
    enterGame.passwordEdit.setText('1');
    enterGame.doLogin();
    const modal = document.querySelector('.otui-modal');
    expect(modal).not.toBeNull();
    expect(modal.textContent).toContain('Connecting to login server...');
  });

  it('chama onLogin com as credenciais depois do delay', async () => {
    vi.useFakeTimers();
    const onLogin = vi.fn(() => ({ ok: true }));
    enterGame.onLogin = onLogin;
    enterGame.accountEdit.setText('god');
    enterGame.passwordEdit.setText('god');
    enterGame.doLogin();
    vi.advanceTimersByTime(500);
    expect(onLogin).toHaveBeenCalledTimes(1);
    const credentials = onLogin.mock.calls[0][0];
    expect(credentials.account).toBe('god');
    expect(credentials.password).toBe('god');
    expect(credentials.server.port).toBe(7171);
    expect(enterGame.isVisible()).toBe(false);
    vi.useRealTimers();
  });

  it('mostra "Login Error" quando o servidor recusa', async () => {
    vi.useFakeTimers();
    enterGame.onLogin = () => ({ ok: false, error: 'Account name or password is not correct.' });
    enterGame.accountEdit.setText('god');
    enterGame.passwordEdit.setText('errada');
    enterGame.doLogin();
    vi.advanceTimersByTime(500);
    const modal = document.querySelector('.otui-modal');
    expect(modal.textContent).toContain('Login Error');
    expect(modal.textContent).toContain('not correct');
    // o client limpa a senha quando o erro e de credencial
    expect(enterGame.passwordEdit.getText()).toBe('');
    vi.useRealTimers();
  });

  it('bloqueia o login quando os assets 8.60 nao estao carregados', () => {
    enterGame.assetsReady = () => 'Please place the Tibia 8.60 asset files in data/things/860';
    enterGame.accountEdit.setText('1');
    enterGame.passwordEdit.setText('1');
    enterGame.doLogin();
    const modal = document.querySelector('.otui-modal');
    expect(modal.textContent).toContain('Tibia 8.60 asset files');
  });

  it('lembra a conta quando "Remember Email" esta marcado', () => {
    vi.useFakeTimers();
    enterGame.rememberEmailBox.setChecked(true);
    enterGame.accountEdit.setText('god');
    enterGame.passwordEdit.setText('god');
    enterGame.doLogin();
    vi.advanceTimersByTime(500);
    expect(g_settings.get('account')).toBe('god');
    vi.useRealTimers();
  });
});
