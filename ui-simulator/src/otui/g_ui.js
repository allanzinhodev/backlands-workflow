export const g_ui = {
  rootElement: null,

  init(rootId) {
    this.rootElement = document.getElementById(rootId);
    if (!this.rootElement) {
      console.error(`Root element #${rootId} not found!`);
    }
  },

  displayUI(widget) {
    if (this.rootElement) {
      this.rootElement.appendChild(widget.element);
    }
  },

  clearUI() {
    if (this.rootElement) {
      this.rootElement.innerHTML = '';
    }
  }
};
