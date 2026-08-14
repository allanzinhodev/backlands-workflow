// Tela de login.
//
// O layout NAO e reescrito aqui: o modulo carrega o proprio entergame.otui do AstraClient e deixa
// o runtime OTUI montar a arvore. O que este arquivo faz e o que o entergame.lua faz -- ligar os
// widgets por id ao comportamento.
//
// Comportamentos que vieram da leitura do entergame.lua e que sao facilmente perdidos numa
// reimplementacao "de memoria":
//   - senha vazia NAO mostra erro: o performLogin simplesmente retorna (entergame.lua:682-684)
//   - o loadBox e um box com Cancel, texto 'Connecting to login server...' (entergame.lua:797)
//   - erro de login abre 'Login Error' e, no Ok, mostra a tela de novo (entergame.lua:828-835)
//   - sem os assets 8.60 carregados o login nem tenta (ensureThingsLoaded, entergame.lua:686-689)

import entergameOtui from '../../../../client/modules/client_entergame/entergame.otui?raw';
import { g_ui } from '../../otui/g_ui.js';
import { displayErrorBox, displayCancelBox } from '../messagebox.js';
import { g_settings } from '../../game/g_settings.js';

// Espelha a tabela Servers do client/init.lua.
export const SERVERS = {
  LocalTestServ: {
    name: 'LocalTestServ',
    host: '127.0.0.1',
    port: 7171,
    version: 860,
  },
};

export class EnterGame {
  constructor({ onLogin, assetsReady = () => null } = {}) {
    this.onLogin = onLogin;
    this.assetsReady = assetsReady;
    this.window = null;
    this.loadBox = null;
    this.loginTimer = null;
  }

  create(parent) {
    this.window = g_ui.loadUI(entergameOtui, parent || g_ui.rootWidget, 'entergame.otui');

    this.accountEdit = this.window.recursiveGetChildById('accountNameTextEdit');
    this.passwordEdit = this.window.recursiveGetChildById('accountPasswordTextEdit');
    this.tokenEdit = this.window.recursiveGetChildById('accountTokenTextEdit');
    this.loginButton = this.window.recursiveGetChildById('loginButton');
    this.serverSelector = this.window.recursiveGetChildById('serverSelector');
    this.rememberEmailBox = this.window.recursiveGetChildById('rememberEmailBox');
    this.rememberPasswordBox = this.window.recursiveGetChildById('rememberPasswordBox');
    this.serverInfoLabel = this.window.recursiveGetChildById('serverInfoLabel');

    // O painel de servidor customizado so aparece com ALLOW_CUSTOM_SERVERS; no init.lua e false.
    const customPanel = this.window.recursiveGetChildById('customServerSelectorPanel');
    if (customPanel) customPanel.setVisible(false);

    if (this.serverSelector) {
      for (const server of Object.values(SERVERS)) {
        this.serverSelector.addOption(server.name, server);
      }
    }

    if (this.serverInfoLabel) {
      const server = Object.values(SERVERS)[0];
      this.serverInfoLabel.setText(`${server.host}:${server.port} (${server.version})`);
    }

    if (this.loginButton) this.loginButton.on('click', () => this.doLogin());
    if (this.passwordEdit) this.passwordEdit.on('enter', () => this.doLogin());
    if (this.accountEdit) this.accountEdit.on('enter', () => this.doLogin());

    this.restoreSettings();
    return this.window;
  }

  restoreSettings() {
    const account = g_settings.get('account', '');
    const password = g_settings.get('password', '');
    if (account && this.accountEdit) {
      this.accountEdit.setText(account);
      if (this.rememberEmailBox) this.rememberEmailBox.setChecked(true);
    }
    if (password && this.passwordEdit) {
      this.passwordEdit.setText(password);
      if (this.rememberPasswordBox) this.rememberPasswordBox.setChecked(true);
    }
  }

  getAccount() {
    return this.accountEdit ? this.accountEdit.getText() : '';
  }

  getPassword() {
    return this.passwordEdit ? this.passwordEdit.getText() : '';
  }

  doLogin() {
    if (this.loginTimer) return;

    const account = this.getAccount();
    const password = this.getPassword();
    const token = this.tokenEdit ? this.tokenEdit.getText() : '';

    // Fiel ao performLogin: senha vazia retorna sem dizer nada.
    if (password === '') return;

    const assetsError = this.assetsReady();
    if (assetsError) {
      this.onError(assetsError);
      return;
    }

    if (this.rememberEmailBox && this.rememberEmailBox.isChecked()) {
      g_settings.set('account', account);
    } else {
      g_settings.remove('account');
    }
    if (this.rememberPasswordBox && this.rememberPasswordBox.isChecked()) {
      g_settings.set('password', password);
    } else {
      g_settings.remove('password');
    }

    this.loadBox = displayCancelBox('Please wait', 'Connecting to login server...');
    this.loadBox.onCancel = () => {
      this.loadBox = null;
      if (this.loginTimer) {
        clearTimeout(this.loginTimer);
        this.loginTimer = null;
      }
      this.show();
    };

    const server = this.serverSelector && this.serverSelector.getCurrentOption()
      ? this.serverSelector.getCurrentOption().data
      : Object.values(SERVERS)[0];

    this.loginTimer = setTimeout(() => {
      this.loginTimer = null;
      this.finishLogin({ account, password, token, server });
    }, 450);
  }

  finishLogin(credentials) {
    if (this.loadBox) {
      this.loadBox.destroy();
      this.loadBox = null;
    }
    const result = this.onLogin ? this.onLogin(credentials) : { ok: true };
    if (result && result.ok === false) {
      this.onLoginError(result.error || 'Account name or password is not correct.');
      return;
    }
    this.hide();
  }

  onError(message) {
    if (this.loadBox) {
      this.loadBox.destroy();
      this.loadBox = null;
    }
    const box = displayErrorBox('Login Error', message);
    box.onOk = () => this.show();
  }

  onLoginError(message) {
    this.onError(message);
    if (this.passwordEdit) this.passwordEdit.setText('');
  }

  show() {
    if (this.window) this.window.setVisible(true);
    if (this.accountEdit) this.accountEdit.focus();
  }

  hide() {
    if (this.window) this.window.setVisible(false);
  }

  isVisible() {
    return this.window ? this.window.visible : false;
  }
}
