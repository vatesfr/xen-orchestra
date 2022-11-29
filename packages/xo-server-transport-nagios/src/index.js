import crc32 from 'buffer-crc32'
import net from 'net'
import { Buffer } from 'buffer'
import { createLogger } from '@xen-orchestra/log'
// eslint-disable-next-line n/no-extraneous-import
import { compileTemplate } from '@xen-orchestra/template'

const { debug, warn } = createLogger('xo:server:transport:nagios')

// ===================================================================

const hostDescription =
  'Host name on Nagios.' +
  ' Leave empty if the host name equals the vm name (the default configuration).' +
  " Otherwise, you could choose a custom name but the template '{vm.name_label}' must" +
  " be included. For example: 'xo-backup-{vm.name_label}'."

const serviceDescription =
  'Service name on Nagios.' +
  ' Leave empty if the host name equals the backup job name (the default configuration).' +
  " Otherwise, you could choose a custom name but the template '{job.name}' must" +
  " be included. For example: '{job.name}-Xen Orchestra'."

export const configurationSchema = {
  type: 'object',

  properties: {
    server: {
      type: 'string',
      description: 'The nagios server adress',
    },
    port: {
      type: 'integer',
      description: 'The NSCA port',
    },
    key: {
      type: 'string',
      description: 'The encryption key',
    },
    host: {
      description: hostDescription,
      type: 'string',
    },
    service: {
      description: serviceDescription,
      type: 'string',
    },
  },
  additionalProperties: false,
  required: ['server', 'port', 'key'],
}

export const testSchema = {
  type: 'object',
  properties: {
    host: {
      description: 'Nagios host',
      type: 'string',
    },
    service: {
      description: 'Nagios service',
      type: 'string',
    },
  },
  required: ['host', 'service'],
}

// ===================================================================

function nscaPacketBuilder({ host, iv, message, service, status, timestamp }) {
  // Building NSCA packet
  const SIZE = 720
  const packet = Buffer.alloc(SIZE)
  packet.writeInt16BE(VERSION, 0)
  packet.fill('h', 2, 3)
  packet.writeUInt32BE(0, 4) // initial 0 for CRC32 value
  packet.writeUInt32BE(timestamp, 8)
  packet.writeInt16BE(status, 12)
  packet.write(host, 14, 77, ENCODING)
  packet.write(service, 78, 206, ENCODING)
  packet.write(message, 206, SIZE, ENCODING)
  packet.writeUInt32BE(crc32.unsigned(packet), 4)
  return packet
}

function xor(data, mask) {
  const dataSize = data.length
  const maskSize = mask.length
  const result = Buffer.allocUnsafe(dataSize)
  let j = 0
  for (let i = 0; i < dataSize; i++) {
    if (j === maskSize) {
      j = 0
    }
    result[i] = data[i] ^ mask[j]
    j++
  }
  return result
}

// ===================================================================

export const OK = 0
export const WARNING = 1
export const CRITICAL = 2

const VERSION = 3
const ENCODING = 'binary'

class XoServerNagios {
  constructor({ xo }) {
    this._sendPassiveCheck = this._sendPassiveCheck.bind(this)
    this._set = xo.defineProperty.bind(xo)
    this._unset = null

    // Defined in configure().
    this._conf = null
    this._key = null
  }

  configure(configuration) {
    this._conf = configuration
    this._key = Buffer.from(configuration.key, ENCODING)

    const templateRules = {
      '{vm.name_label}': vmNameLabel => vmNameLabel,
      '{job.name}': (vmNameLabel, jobName) => jobName,
    }

    this._getHost = compileTemplate(this._conf.host, templateRules)
    this._getService = compileTemplate(this._conf.service, templateRules)
  }

  load() {
    this._unset = this._set('sendPassiveCheck', this._sendPassiveCheck)
  }

  unload() {
    this._unset()
  }

  test({ host, service }) {
    return this._sendPassiveCheck(
      {
        message: 'The server-nagios plugin for Xen Orchestra server seems to be working fine, nicely done :)',
        status: OK,
        isTest: true,
      },
      host,
      service
    )
  }

  _sendPassiveCheck({ message, status, isTest }, vmNameLabel, jobName) {
    return new Promise((resolve, reject) => {
      if (isTest) {
        this._conf.host = vmNameLabel
        this._conf.service = jobName
      } else {
        if (this._conf.host !== undefined) {
          this._conf.host = this._getHost(vmNameLabel, jobName)
        } else {
          this._conf.host = vmNameLabel
        }
        if (this._conf.service !== undefined) {
          this._conf.service = this._getService(vmNameLabel, jobName)
        } else {
          this._conf.service = jobName
        }
      }

      if (/\r|\n/.test(message)) {
        warn('the message must not contain a line break', { message })
        for (let i = 0, n = message.length; i < n; ++i) {
          const c = message[i]
          if (c === '\n') {
            message[i] = '\\n'
          } else if (c === '\r') {
            message[i] = '\\r'
          }
        }
      }

      const client = new net.Socket()

      client.connect(this._conf.port, this._conf.server, () => {
        debug('Successful connection')
      })

      client.on('data', data => {
        const timestamp = data.readInt32BE(128)
        const iv = data.slice(0, 128) // initialization vector
        const packet = nscaPacketBuilder({
          ...this._conf,
          iv,
          message,
          status,
          timestamp,
        })

        // 1) Using xor between the NSCA packet and the initialization vector
        // 2) Using xor between the result of the first operation and the encryption key
        const xorPacketBuffer = xor(xor(packet, iv), this._key)

        client.write(xorPacketBuffer, res => {
          client.destroy()
          resolve(res)
        })
      })

      client.on('error', reject)
    })
  }
}

export default opts => new XoServerNagios(opts)
