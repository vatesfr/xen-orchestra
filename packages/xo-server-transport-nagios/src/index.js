import crc32 from 'buffer-crc32'
import net from 'net'
import { Buffer } from 'buffer'
import { createLogger } from '@xen-orchestra/log'
import { compileTemplate } from '@xen-orchestra/template'

const { debug, warn } = createLogger('xo:server:transport:nagios')

// ===================================================================

const hostDescription = `Host name on Nagios.

Leave empty if the host name equals the vm name (the default configuration).

Otherwise, you could choose a custom name but the template \`{vm.name_label}\` must  be included. For example: \`xo-backup-{vm.name_label}\`.`

const serviceDescription = `Service name on Nagios.

Leave empty if the host name equals the backup job name (the default configuration).

Otherwise, you could choose a custom name but the template \`{job.name}\` must e included. For example: \`{job.name}-Xen Orchestra\`.`

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
      default: '{vm.name_label}',
      description: hostDescription,
      type: 'string',
    },
    service: {
      default: '{job.name}',
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
    VmNameLabel: {
      title: 'VM Name Label',
      description: 'Name of a VM',
      type: 'string',
    },
    jobName: {
      title: 'Job Name',
      description: 'Name of a backup job',
      type: 'string',
    },
  },
  required: ['VmNameLabel', 'jobName'],
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

  configure({ host, service, ...configuration }) {
    this._conf = configuration
    this._key = Buffer.from(configuration.key, ENCODING)

    const templateRules = {
      '{vm.name_label}': vmNameLabel => vmNameLabel,
      '{job.name}': (vmNameLabel, jobName) => jobName,
    }

    this._getHost = compileTemplate(host, templateRules)
    this._getService = compileTemplate(service, templateRules)
  }

  load() {
    this._unset = this._set('sendPassiveCheck', this._sendPassiveCheck)
  }

  unload() {
    this._unset()
  }

  test({ VmNameLabel, jobName }) {
    return this._sendPassiveCheck(
      {
        message: 'The server-nagios plugin for Xen Orchestra server seems to be working fine, nicely done :)',
        status: OK,
      },
      VmNameLabel,
      jobName
    )
  }

  _sendPassiveCheck({ message, status }, vmNameLabel, jobName) {
    return new Promise((resolve, reject) => {
      const conf = {
        ...this._conf,
        host: this._getHost(vmNameLabel, jobName),
        service: this._getService(vmNameLabel, jobName),
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

      client.connect(conf.port, conf.server, () => {
        debug('Successful connection')
      })

      client.on('data', data => {
        const timestamp = data.readInt32BE(128)
        const iv = data.slice(0, 128) // initialization vector
        const packet = nscaPacketBuilder({
          ...conf,
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
