import Disposable from 'promise-toolbox/Disposable'
import fromCallback from 'promise-toolbox/fromCallback'
import fromEvent from 'promise-toolbox/fromEvent'
import fse from 'fs-extra'
import { createLogger } from '@xen-orchestra/log'
import { deduped } from '@vates/disposable/deduped.js'
import { execFile, spawn } from 'child_process'
import { JsonRpcWebSocketClient } from 'jsonrpc-websocket-client'
import { parsePairs } from 'parse-pairs'

const TUNNEL_SERVICE = 'xoa-support-tunnel.service'

const { debug, warn } = createLogger('xo:proxy:appliance')

const getUpdater = deduped(async function () {
  const updater = new JsonRpcWebSocketClient('ws://localhost:9001')
  await updater.open()
  return new Disposable(() => updater.close(), updater)
})

const callUpdate = params =>
  Disposable.use(
    getUpdater(),
    updater =>
      new Promise((resolve, reject) => {
        updater
          .on('error', reject)
          .on('notification', ({ method, params }) => {
            if (method === 'print') {
              debug('updater.update: ' + params.content)
            } else if (method === 'end') {
              resolve(params)
            } else if (method === 'server-error') {
              reject(new Error(params.message))
            } else if (method !== 'connected') {
              warn('update.update, unhandled message', {
                method,
                params,
              })
            }
          })
          .notify('update', params)
      })
  )

async function checkAppliance() {
  const child = spawn('xoa', ['check'], {
    all: true,
    env: {
      ...process.env,

      // dont inherit this var from xo-server or the output will be polluted
      DEBUG: '',

      FORCE_COLOR: '1',
    },
  })

  const chunks = []
  let length = 0
  const onData = chunk => {
    chunks.push(chunk)
    length += chunk.length
  }
  child.stdout.on('data', onData)
  child.stderr.on('data', onData)

  await fromEvent(child, 'exit')

  return Buffer.concat(chunks, length).toString()
}

async function closeSupportTunnel() {
  await fromCallback(execFile, 'systemctl', ['stop', TUNNEL_SERVICE])
}

async function getApplianceInfo() {
  const pairs = parsePairs(await fse.readFile('/etc/os-release', 'utf8'))
  return {
    build: pairs.XOA_BUILD,
    os: pairs.ID,
    osVersion: pairs.VERSION_ID,
  }
}

async function getStateSupportTunnel() {
  const isActive =
    (await fromEvent(
      spawn('systemctl', ['is-active', '--quiet', TUNNEL_SERVICE], {
        stdio: 'ignore',
      }),
      'exit'
    )) === 0

  const isActiveOrFailed =
    isActive ||
    (await fromEvent(
      spawn('systemctl', ['is-failed', '--quiet', TUNNEL_SERVICE], {
        stdio: 'ignore',
      }),
      'exit'
    )) === 0

  return {
    open: isActive,
    stdout: isActiveOrFailed ? await fromCallback(fse.readFile, '/tmp/xoa-support-tunnel.out', 'utf8') : '',
  }
}

async function openSupportTunnel() {
  await fromCallback(execFile, 'systemctl', ['start', TUNNEL_SERVICE])
}

export default class Appliance {
  constructor(app) {
    app.api.addMethods({
      appliance: {
        check: checkAppliance,
        getInfo: [
          getApplianceInfo,
          {
            description: 'returns various information about the appliance itself',
          },
        ],
        supportTunnel: {
          close: [
            closeSupportTunnel,
            {
              description: 'close the support tunnel',
            },
          ],
          getState: [
            getStateSupportTunnel,
            {
              description: 'getState the support tunnel',
            },
          ],
          open: [
            openSupportTunnel,
            {
              description: 'open the support tunnel',
            },
          ],
        },
        updater: {
          getLocalManifest: () => Disposable.use(getUpdater(), _ => _.call('getLocalManifest')),
          getState: () => callUpdate(),
          configure: [
            ({ channel }) =>
              Disposable.use(getUpdater(), async updater => {
                await updater.call('configure', { channel })
              }),
            {
              params: { channel: { type: 'string' } },
            },
          ],
          upgrade: [() => callUpdate({ upgrade: true }), { unref: true }],
        },
      },
    })
  }

  // A proxy can be bound to a unique license
  getSelfLicense() {
    return Disposable.use(getUpdater(), async updater => {
      const licenses = await updater.call('getSelfLicenses')
      const now = Date.now()
      return licenses.find(({ expires }) => expires === undefined || expires > now)
    })
  }
}
