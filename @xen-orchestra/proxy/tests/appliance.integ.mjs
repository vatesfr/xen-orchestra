import assert from 'node:assert/strict'
import { after, before, describe, it } from 'node:test'
import { WebSocketServer } from 'ws'
import { format, parse } from 'json-rpc-protocol'

import Appliance from '../app/mixins/appliance.mjs'

// `appliance.mjs` connects to this hardcoded address
const UPDATER_PORT = 9001

// `update` is sent as a notification and answered with notifications, so nothing
// but the connection ties a reply to its request. This fake updater answers on
// the socket which asked, exactly like `xoa-updater`'s server does, and is
// therefore able to tell whether the callers share a connection.
function createFakeUpdater({ updateDelays = {}, licensesDelay = 0 } = {}) {
  const sockets = []
  const wss = new WebSocketServer({ port: UPDATER_PORT })

  wss.on('connection', socket => {
    const entry = { updates: [], calls: [] }
    sockets.push(entry)

    socket.on('message', data => {
      const message = parse(String(data))
      const { id, method, params = {} } = message

      if (method === 'update') {
        entry.updates.push(params)
        const key = params.upgrade === true ? 'upgrade' : 'getState'
        setTimeout(() => {
          socket.send(format.notification('print', { content: `working on ${key}` }))
          socket.send(format.notification('end', { state: key }))
        }, updateDelays[key] ?? 0)
        return
      }

      entry.calls.push(method)
      if (method === 'getSelfLicenses') {
        setTimeout(() => socket.send(format.response(id, [{ id: 'licence-1' }])), licensesDelay)
      } else {
        setTimeout(() => socket.send(format.response(id, 'ok')), 0)
      }
    })
  })

  return {
    sockets,
    close: () => new Promise(resolve => wss.close(resolve)),
    ready: new Promise((resolve, reject) => {
      wss.on('listening', resolve)
      wss.on('error', reject)
    }),
  }
}

// `Appliance` only exposes itself through `app.api.addMethods()`
function instantiate() {
  let methods
  const appliance = new Appliance({
    api: {
      addMethods: tree => {
        methods = tree.appliance
      },
    },
  })
  return { appliance, updater: methods.updater }
}

describe('appliance updater', function () {
  let fake
  let appliance
  let updater

  before(async function () {
    fake = createFakeUpdater({
      // the upgrade answers first, so a shared connection would hand its `end`
      // to the getState call, which started earlier
      updateDelays: { getState: 400, upgrade: 100 },
      licensesDelay: 200,
    })
    await fake.ready.catch(error => {
      assert.fail(
        `could not listen on ${UPDATER_PORT}: ${error.code}. ` +
          'A real xoa-updater is probably running on this machine.'
      )
    })
    ;({ appliance, updater } = instantiate())
  })

  after(async function () {
    await fake.close()
  })

  it('does not mix up the results of concurrent getState and upgrade', async function () {
    const [state, upgraded] = await Promise.all([updater.getState(), updater.upgrade()])

    // each call must get the answer to its own request, not the first one to
    // arrive on a shared connection
    assert.equal(state.state, 'getState')
    assert.equal(upgraded.state, 'upgrade')
  })

  it('gives each update its own connection, carrying a single request', async function () {
    const before = fake.sockets.length
    await Promise.all([updater.getState(), updater.getState(), updater.getState()])
    const opened = fake.sockets.slice(before)

    assert.equal(opened.length, 3, 'each update opens its own connection')
    for (const { updates } of opened) {
      assert.equal(updates.length, 1, 'a connection carries a single update')
    }
  })

  it('does not leak listeners when many updates overlap', async function () {
    const warnings = []
    const onWarning = warning => {
      if (warning.name === 'MaxListenersExceededWarning') {
        warnings.push(warning.message)
      }
    }
    process.on('warning', onWarning)
    try {
      await Promise.all(Array.from({ length: 15 }, () => updater.getState()))
      // let the warnings, which are emitted asynchronously, be delivered
      await new Promise(resolve => setImmediate(resolve))
    } finally {
      process.off('warning', onWarning)
    }

    assert.deepEqual(warnings, [])
  })

  it('shares a single connection between the id-correlated calls', async function () {
    const before = fake.sockets.length
    const [licence] = await Promise.all([appliance.getSelfLicense(), appliance.getSelfLicense()])
    const opened = fake.sockets.slice(before)

    assert.equal(licence.id, 'licence-1')
    assert.equal(opened.length, 1, 'concurrent calls reuse the deduped connection')
    assert.deepEqual(opened[0].calls, ['getSelfLicenses', 'getSelfLicenses'])
  })
})
