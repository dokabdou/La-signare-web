
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
    'index.csr.html': {size: 562, hash: '2cbd0dbd0822c7f1c7e5f70fa39398ee542bc50ecfbebd4dfca722dc120cd59c', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 964, hash: 'e5825abb6063d3547133e7bb5a6a576f9407512167f7a156d5c9ee924b31484e', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'styles-OZJ7YZ3C.css': {size: 3634, hash: 'S1m4GjPIu20', text: () => import('./assets-chunks/styles-OZJ7YZ3C_css.mjs').then(m => m.default)}
  },
};
