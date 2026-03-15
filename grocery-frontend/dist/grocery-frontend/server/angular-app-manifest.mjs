
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
    'index.csr.html': {size: 562, hash: 'fc12fe600bca2e12fce4455c01c03e8d8d124c50592577e9dfb2f3fef06fd519', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 964, hash: 'd42e19ede813aa2302d97874e816aae6b07c857524ee7152f210593ea1c86d53', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'styles-E572QYRC.css': {size: 2931, hash: 'SKutz51pZPk', text: () => import('./assets-chunks/styles-E572QYRC_css.mjs').then(m => m.default)}
  },
};
