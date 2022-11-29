import { shouldProxy } from './_shouldProxy.mjs'
import t from 'tap'

const ensureArray = v => (v === undefined ? [] : Array.isArray(v) ? v : [v])

;[
  {
    no_proxy: null,
    ok: 'example.org',
  },
  {
    no_proxy: '*',
    nok: 'example.org',
  },
  {
    no_proxy: 'example.org, example.com',
    nok: ['example.org', 'example.org:1024', 'example.com'],
    ok: 'example.net',
  },

  {
    no_proxy: ['example.org', '.example.org'],
    nok: ['example.org', 'example.org:1024', 'sub.example.org'],
    ok: 'example.com',
  },
  // {
  //   no_proxy: 'example.org:1024',
  //   nok: ['example.org:1024', 'sub.example.org:1024'],
  //   ok: ['example.com', 'example.org'],
  // },
  {
    no_proxy: '[::1]',
    nok: ['[::1]', '[::1]:1024'],
    ok: ['[::2]', '[0::1]'],
  },
].forEach(({ no_proxy: noProxies, ok, nok }) => {
  for (const no_proxy of ensureArray(noProxies)) {
    const opts = { no_proxy }
    t.test(String(no_proxy), function (t) {
      ok = ensureArray(ok)
      if (ok.length !== 0) {
        t.test('should proxy', t => {
          for (const host of ok) {
            t.equal(shouldProxy(host, opts), true, host)
          }
          t.end()
        })
      }
      nok = ensureArray(nok)
      if (nok.length !== 0) {
        t.test('should not proxy', t => {
          for (const host of nok) {
            t.equal(shouldProxy(host, opts), false, host)
          }
          t.end()
        })
      }
      t.end()
    })
  }
})
