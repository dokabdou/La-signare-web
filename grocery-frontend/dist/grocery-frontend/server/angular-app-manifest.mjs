
export default {
  bootstrap: () => import('./main.server.mjs').then(m => m.default),
  inlineCriticalCss: true,
  baseHref: '/',
  locale: undefined,
  routes: [
  {
    "renderMode": 0,
    "route": "/"
  },
  {
    "renderMode": 0,
    "route": "/category/*"
  },
  {
    "renderMode": 0,
    "route": "/product/*"
  },
  {
    "renderMode": 0,
    "route": "/checkout"
  },
  {
    "renderMode": 0,
    "route": "/admin"
  },
  {
    "renderMode": 0,
    "route": "/new-arrivals"
  },
  {
    "renderMode": 0,
    "route": "/best-sellers"
  },
  {
    "renderMode": 0,
    "route": "/account"
  },
  {
    "renderMode": 0,
    "route": "/all-products"
  },
  {
    "renderMode": 0,
    "redirectTo": "/",
    "route": "/**"
  }
],
  entryPointToBrowserMapping: undefined,
  assets: {
    'index.csr.html': {size: 562, hash: '2b0452b3341c6ae468e30ef81ea76896e8d7cc16a1e4baf7c8f92ec28cdaa605', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 964, hash: '6601e36f166fa20a14622bb9ad5e79ae3c033f1b3f4c9bd7aba12a58fd994f57', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'styles-E572QYRC.css': {size: 2931, hash: 'SKutz51pZPk', text: () => import('./assets-chunks/styles-E572QYRC_css.mjs').then(m => m.default)}
  },
};
