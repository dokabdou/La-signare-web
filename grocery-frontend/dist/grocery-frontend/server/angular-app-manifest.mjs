
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
    'index.csr.html': {size: 562, hash: '3575894c9ccfca87a169688fc9bc041ba7b78f3d20a2c48ea8e36cd2896c6728', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 964, hash: 'c096e5f0642cafd63116c35a822450acf0c14c3613c8ffa9393d5fd748296e01', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'styles-OZJ7YZ3C.css': {size: 3634, hash: 'S1m4GjPIu20', text: () => import('./assets-chunks/styles-OZJ7YZ3C_css.mjs').then(m => m.default)}
  },
};
