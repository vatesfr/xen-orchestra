'use strict'

const t = require('tap')

const parseUrl = require('./dist/_parseUrl.js').default

const data = {
  'xcp.company.lan': {
    hostname: 'xcp.company.lan',
    pathname: '/',
    protocol: 'https:',
  },
  '[::1]': {
    hostname: '::1',
    pathname: '/',
    protocol: 'https:',
  },
  'http://username:password@xcp.company.lan': {
    auth: 'username:password',
    hostname: 'xcp.company.lan',
    password: 'password',
    pathname: '/',
    protocol: 'http:',
    username: 'username',
  },
  'https://username@xcp.company.lan': {
    auth: 'username',
    hostname: 'xcp.company.lan',
    pathname: '/',
    protocol: 'https:',
    username: 'username',
  },
}

t.test('invalid url', function (t) {
  t.throws(() => parseUrl(''))
  t.end()
})

for (const url of Object.keys(data)) {
  t.test(url, function (t) {
    const parsed = parseUrl(url)
    for (const key of Object.keys(parsed)) {
      if (parsed[key] === undefined) {
        delete parsed[key]
      }
    }

    t.same(parsed, data[url])
    t.end()
  })
}
