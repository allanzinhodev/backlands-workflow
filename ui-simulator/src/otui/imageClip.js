// Recorte de sprite sheet.
//
// Por que isto existe: 'image-clip' aparece 759 vezes nos .otui e 'image-border' 192 -- e quando os
// dois aparecem juntos o CSS nao resolve, porque border-image-source nao aceita recorte e nao existe
// border-image-position. Entao o recorte precisa ser materializado.
//
// Sem image-border o caso e trivial (background-position negativo) e nao passa por aqui.

const sliceCache = new Map();
const imageCache = new Map();

export function loadImage(src) {
  if (imageCache.has(src)) return imageCache.get(src);
  const promise = new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`nao consegui carregar a imagem: ${src}`));
    img.src = src;
  });
  imageCache.set(src, promise);
  return promise;
}

/**
 * Recorta (x, y, w, h) de `src` e devolve um data URI PNG, com cache.
 * O cache nao e opcional: cada estado ($hover/$pressed/$on) e um recorte diferente do mesmo PNG.
 */
export async function clipToDataURL(src, x, y, w, h) {
  const key = `${src}|${x}|${y}|${w}|${h}`;
  if (sliceCache.has(key)) return sliceCache.get(key);

  const promise = (async () => {
    const img = await loadImage(src);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    // image-smooth default e false no client: sem isso todo sprite 8.60 sai borrado.
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, x, y, w, h, 0, 0, w, h);
    return canvas.toDataURL('image/png');
  })();

  sliceCache.set(key, promise);
  return promise;
}

export function clearImageCaches() {
  sliceCache.clear();
  imageCache.clear();
}
