// Estilo das janelas do HUD.
//
// O MiniWindow real (30-miniwindow.otui) traz scrollbar, botoes de lock/minimize/close e um
// MiniWindowContents com layout proprio -- uma arvore que o simulador ainda nao exercita. Este
// estilo fica com o que importa visualmente: a mesma textura de fundo 9-slice (/images/ui/miniwindow),
// a mesma faixa de titulo e o mesmo padding.

export const HUD_STYLES = `
MiniWindowLike < UIWindow
  font: verdana-11px-antialised
  color: #909090
  size: 174 120
  text-offset: 0 2
  text-align: top
  image-source: /images/ui/miniwindow
  image-border: 4
  image-border-top: 20
  padding-top: 24
  padding-left: 4
  padding-right: 4
  padding-bottom: 4
`;
