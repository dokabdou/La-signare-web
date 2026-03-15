
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
    'index.csr.html': {size: 562, hash: '52a59dc1b166a06dbf37597b458a3d62ad6856b28c0b6d71a1cb92ec34392ef2', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 964, hash: '50f57ec8eacb8d674850c2be69b6074a61935a03578f387363c2f7d0411491d7', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'styles-E572QYRC.css': {size: 2931, hash: 'SKutz51pZPk', text: () => import('./assets-chunks/styles-E572QYRC_css.mjs').then(m => m.default)}
  },
};
