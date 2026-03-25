
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
    'index.csr.html': {size: 562, hash: '0e2e35cf31efef68fd191aae8858f47522835f65466970ef39915af3c19104f3', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 964, hash: '28fb16651641b37633c431d842869f3c5d48366b60019b934b7b4ba5d86f6841', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'styles-OZJ7YZ3C.css': {size: 3634, hash: 'S1m4GjPIu20', text: () => import('./assets-chunks/styles-OZJ7YZ3C_css.mjs').then(m => m.default)}
  },
};
