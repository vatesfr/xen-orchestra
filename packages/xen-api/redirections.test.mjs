import { after, before, test } from 'node:test'
import { createServer } from 'node:http'
import { request } from 'undici'
import { strict as assert } from 'node:assert'

import { Xapi } from './index.mjs'

const MAX_REDIRECTIONS = 3

function listen(requestListener) {
  const server = createServer(requestListener)
  return new Promise(resolve => {
    server.listen(0, '127.0.0.1', () => resolve(server))
  })
}

function url(server, pathname = '/') {
  const { address, port } = server.address()
  return `http://${address}:${port}${pathname}`
}

let dispatcher, master, slave

before(async () => {
  // the pool master: answers the resource, and a chain of redirections used to
  // check that the limit is enforced
  master = await listen((req, res) => {
    const hop = /^\/hop\/(\d+)$/.exec(req.url)
    if (hop !== null) {
      res.writeHead(302, { location: `/hop/${Number(hop[1]) + 1}` })
      return res.end()
    }

    res.writeHead(200)
    res.end('master')
  })

  // a slave: redirects everything to the master
  slave = await listen((req, res) => {
    res.writeHead(302, { location: new URL(req.url, url(master)).href })
    res.end()
  })

  // the dispatcher `getResource` uses, built by the constructor: no connection
  // is opened and no XAPI is contacted
  dispatcher = new Xapi({ url: 'https://user:password@127.0.0.1', watchEvents: false })._undiciDispatcher
})

after(async () => {
  master.close()
  slave.close()
  await dispatcher.close().catch(() => {})
})

test('a 302 from a slave is followed to the pool master', async () => {
  const response = await request(url(slave, '/export'), { dispatcher })

  assert.equal(response.statusCode, 200)
  assert.equal(await response.body.text(), 'master')
})

test('`maxRedirections: 0` opts out, as `getResource` does', async () => {
  const response = await request(url(slave, '/export'), { dispatcher, maxRedirections: 0 })

  assert.equal(response.statusCode, 302)
  assert.equal(response.headers.location, url(master, '/export'))
  await response.body.dump()
})

test('no more than `maxRedirections` are followed', async () => {
  const response = await request(url(master, '/hop/1'), { dispatcher })

  // the last redirection is handed back to the caller instead of being
  // followed, and no error is thrown
  assert.equal(response.statusCode, 302)
  assert.equal(response.headers.location, `/hop/${1 + MAX_REDIRECTIONS + 1}`)
  await response.body.dump()
})
