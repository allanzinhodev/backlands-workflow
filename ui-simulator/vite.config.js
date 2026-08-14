import { defineConfig } from 'vite';
import path from 'path';
import fs from 'fs';

const CLIENT_IMAGES = path.resolve(__dirname, '../client/data/images');

// Os PNGs de UI vivem no repositorio do cliente, fora da raiz do Vite. Em vez de copiar 2000
// arquivos, servimos a pasta como /client-images/ -- e o mesmo caminho que os .otui usam
// (/images/ui/button), so trocando o prefixo.
function clientImagesPlugin() {
  return {
    name: 'backlands-client-images',
    configureServer(server) {
      server.middlewares.use('/client-images', (req, res, next) => {
        const relative = decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '');
        const file = path.join(CLIENT_IMAGES, relative);
        if (!file.startsWith(CLIENT_IMAGES) || !fs.existsSync(file)) return next();
        const ext = path.extname(file).toLowerCase();
        const types = { '.png': 'image/png', '.jpg': 'image/jpeg', '.gif': 'image/gif' };
        res.setHeader('Content-Type', types[ext] || 'application/octet-stream');
        fs.createReadStream(file).pipe(res);
      });
    },
  };
}

export default defineConfig({
  plugins: [clientImagesPlugin()],
  server: {
    fs: {
      allow: ['..'],
    },
  },
  resolve: {
    alias: {
      '@images': CLIENT_IMAGES,
      '@src': path.resolve(__dirname, 'src'),
    },
  },
});
