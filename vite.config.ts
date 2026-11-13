import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { publicAssetPlugin } from './scripts/public-assets.js';
export default defineConfig(({command}) => {
 const edition=process.env.SITE_EDITION;
 if(command==='build' && !['cn','global'].includes(edition??''))throw Error('Production build requires SITE_EDITION=cn|global.');
 if(edition && !['cn','global'].includes(edition))throw Error('Invalid SITE_EDITION.');
 return { define: {'import.meta.env.VITE_SITE_EDITION':JSON.stringify(edition??'global')}, plugins: [react(), publicAssetPlugin()], build: { outDir: 'dist/client' }, server: { proxy: { '/api': 'http://127.0.0.1:3000', '/socket.io': { target: 'http://127.0.0.1:3000', ws: true } } } }; });
