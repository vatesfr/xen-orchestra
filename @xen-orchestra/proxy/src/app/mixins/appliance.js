import parsePairs from 'parse-pairs'
import { createLogger } from '@xen-orchestra/log'
import { execFile } from 'child_process'
import { readFile } from 'fs-extra'

const { warn } = createLogger('xo:proxy:api')

function closeSupportTunnel() {
  const process = this._tunnelProcess
  if (process !== undefined) {
    process.kill()
  }
}

async function getApplianceInfo() {
  const pairs = parsePairs(await readFile('/etc/os-release', 'utf8'))
  return {
    build: pairs.XOA_BUILD,
    os: pairs.ID,
    osVersion: pairs.VERSION_ID,
  }
}

function getStateSupportTunnel() {
  return {
    open: this._tunnelProcess !== undefined,
    stdout: this._tunnelOutput,
  }
}

function openSupportTunnel() {
  if (this._tunnelProcess !== undefined) {
    return
  }

  const process = execFile('xoa', ['support', 'tunnel'])
    .on('error', error => {
      this._tunnelProcess = undefined
      warn('support tunnel', { error })
    })
    .on('exit', code => {
      this._tunnelProcess = undefined

      if (code === null) {
        // external close by signal (normal workflow)
        this._tunnelOutput = ''
      } else {
        this._stdoutTunnel += `\nThe process has closed with code ${code}`
      }
    })
  const onData = data => {
    this._tunnelOutput += data
  }
  process.stderr.on('data', onData)
  process.stdout.on('data', onData)

  this._tunnelProcess = process
}

export default class Appliance {
  constructor(app) {
    this._tunnelProcess = undefined
    this._tunnelOutput = ''

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
            closeSupportTunnel.bind(this),
            {
              description: 'close the support tunnel',
            },
          ],
          getState: [
            getStateSupportTunnel.bind(this),
            {
              description: 'getState the support tunnel',
            },
          ],
          open: [
            openSupportTunnel.bind(this),
            {
              description: 'open the support tunnel',
            },
          ],
        },
      },
    })
  }
}
