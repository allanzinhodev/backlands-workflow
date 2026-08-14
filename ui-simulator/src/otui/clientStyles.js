// Carrega os estilos REAIS do cliente.
//
// A escolha aqui e deliberada: em vez de reescrever os estilos em JS (que vira copia que
// desatualiza), o simulador le os mesmos arquivos .otui que o AstraClient le. Se alguem mexer em
// 10-buttons.otui no repo do cliente, o simulador muda junto.
//
// A ordem importa: um estilo so pode herdar de um ja definido, e o cliente carrega em ordem
// alfabetica de nome de arquivo (client_styles/styles.lua:17-19). Por isso os prefixos numericos.

import vars from '../../../client/data/styles/0-vars.otui?raw';
import buttons from '../../../client/data/styles/10-buttons.otui?raw';
import checkboxes from '../../../client/data/styles/10-checkboxes.otui?raw';
import comboboxes from '../../../client/data/styles/10-comboboxes.otui?raw';
import items from '../../../client/data/styles/10-items.otui?raw';
import labels from '../../../client/data/styles/10-labels.otui?raw';
import panels from '../../../client/data/styles/10-panels.otui?raw';
import progressbars from '../../../client/data/styles/10-progressbars.otui?raw';
import separators from '../../../client/data/styles/10-separators.otui?raw';
import textedits from '../../../client/data/styles/10-textedits.otui?raw';
import windows from '../../../client/data/styles/10-windows.otui?raw';
import miniwindow from '../../../client/data/styles/30-miniwindow.otui?raw';
import entergame from '../../../client/data/styles/40-entergame.otui?raw';
import healthinfo from '../../../client/data/styles/40-healthinfo.otui?raw';
import inventory from '../../../client/data/styles/40-inventory.otui?raw';
import container from '../../../client/data/styles/40-container.otui?raw';

export const CLIENT_STYLE_FILES = [
  ['0-vars.otui', vars],
  ['10-buttons.otui', buttons],
  ['10-checkboxes.otui', checkboxes],
  ['10-comboboxes.otui', comboboxes],
  ['10-items.otui', items],
  ['10-labels.otui', labels],
  ['10-panels.otui', panels],
  ['10-progressbars.otui', progressbars],
  ['10-separators.otui', separators],
  ['10-textedits.otui', textedits],
  ['10-windows.otui', windows],
  ['30-miniwindow.otui', miniwindow],
  ['40-entergame.otui', entergame],
  ['40-healthinfo.otui', healthinfo],
  ['40-inventory.otui', inventory],
  ['40-container.otui', container],
];

export function loadClientStyles(g_ui) {
  // $var-cip-font e usado por ~30 estilos mas nao e definido em nenhum .otui do cliente: o
  // getOTUIVar devolve string vazia e o widget cai na fonte default. Resolvemos explicitamente
  // para bater com o visual real em vez de deixar o literal vazar para o CSS.
  g_ui.setGlobal('var-cip-font', 'verdana-11px-antialised');

  const failures = [];
  for (const [name, source] of CLIENT_STYLE_FILES) {
    try {
      g_ui.importStyles(source, name);
    } catch (error) {
      failures.push({ name, error: error.message });
      console.warn(`[otui] falha ao importar ${name}: ${error.message}`);
    }
  }
  return failures;
}
