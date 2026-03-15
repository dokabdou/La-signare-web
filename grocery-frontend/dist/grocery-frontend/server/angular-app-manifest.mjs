
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
    'index.csr.html': {size: 562, hash: '1638d280460ea11d2976f4a4dd68f78c7ca4fee56ac66656d68238ba5ea67538', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 964, hash: 'e5b738d57fb7024dfd2c3f1f3fed1b06938ffddad71f1356b3774c1edb08c2c2', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'styles-E572QYRC.css': {size: 2931, hash: 'SKutz51pZPk', text: () => import('./assets-chunks/styles-E572QYRC_css.mjs').then(m => m.default)}
  },
};
