import fromCallback from 'promise-toolbox/fromCallback'
import fromEvent from 'promise-toolbox/fromEvent'
import JsonRpcWebsocketClient from 'jsonrpc-websocket-client'
import parsePairs from 'parse-pairs'
import { createLogger } from '@xen-orchestra/log/dist'
import { execFile, spawn } from 'child_process'
import { readFile } from 'fs-extra'

const TUNNEL_SERVICE = 'xoa-support-tunnel.service'

const { debug, warn } = createLogger('xo:proxy:appliance')

async function _withUpdater(cb) {
  const updater = new JsonRpcWebsocketClient('ws://localhost:9001')
  await updater.open()
  try {
    return await cb(updater)
  } finally {
    await updater.close().then(Function.prototype)
  }
}

async function closeSupportTunnel() {
  await fromCallback(execFile, 'systemctl', ['stop', TUNNEL_SERVICE])
}

async function getApplianceInfo() {
  const pairs = parsePairs(await readFile('/etc/os-release', 'utf8'))
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
    stdout: isActiveOrFailed
      ? await fromCallback(readFile, '/tmp/xoa-support-tunnel.out', 'utf8')
      : '',
  }
}

async function openSupportTunnel() {
  await fromCallback(execFile, 'systemctl', ['start', TUNNEL_SERVICE])
}

export default class Appliance {
  constructor(app) {
    app.api.addMethods({
      appliance: {
        getInfo: [
          getApplianceInfo,
          {
            description:
              'returns various information about the appliance itself',
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
          getLocalManifest: () => _withUpdater(_ => _.call('getLocalManifest')),
          upgrade: () =>
            _withUpdater(
              updater =>
                new Promise((resolve, reject) => {
                  updater
                    .on('error', reject)
                    .on('notification', ({ method, params }) => {
                      if (method === 'print') {
                        debug('updater.upgrade: ' + params.content)
                      } else if (method === 'end') {
                        resolve(params)
                      } else if (method === 'server-error') {
                        reject(new Error(params.message))
                      } else if (method !== 'connected') {
                        warn('update.upgrade, unhandled message', {
                          method,
                          params,
                        })
                      }
                    })
                    .notify('update', { upgrade: true })
                })
            ),
        },
      },
    })
  }
}
