
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
    'index.csr.html': {size: 562, hash: '7997580b9333ea8069e66b7f6ecbbd8a0721cd4af9c7dbdf28d3700779f7d345', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 964, hash: '877788c53991825008bd6ced5f3c1b6b9f65361989eb295f627965db24b76e38', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'styles-E572QYRC.css': {size: 2931, hash: 'SKutz51pZPk', text: () => import('./assets-chunks/styles-E572QYRC_css.mjs').then(m => m.default)}
  },
};
