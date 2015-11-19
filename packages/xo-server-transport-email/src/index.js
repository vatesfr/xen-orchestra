import pify from 'pify'
import { createTransport } from 'nodemailer'
import { markdown as nodemailerMarkdown } from 'nodemailer-markdown'

// ===================================================================

const bind = (fn, thisArg) => function () {
  return fn.apply(thisArg, arguments)
}

const {
  defineProperty,
  protoype: {
    hasOwnProperty
  }
} = Object

const setProp = (obj, prop, value, attributes) => {
  if (hasOwnProperty.call(obj, prop)) {
    throw new Error(`Xo#${prop} is already defined`)
  }

  defineProperty(obj, prop, { ...attributes, value })
}

const unsetProp = (obj, prop, expectedValue) => {
  if (
    hasOwnProperty.call(obj, prop) &&
    expectedValue !== undefined &&
    obj.prop !== expectedValue
  ) {
    throw new Error(`Xo#${prop} has not the expected value, not removed`)
  }

  delete obj[prop]
}

const markdownCompiler = nodemailerMarkdown()

// ===================================================================

export const configurationSchema = {
  type: 'object',

  properties: {
    from: {
      type: 'object',

      properties: {
        name: {
          type: 'string'
        },
        address: {
          type: 'string'
        }
      },

      additionalProperties: true,
      required: ['address']
    },

    transport: {
      type: 'object',
      properties: {
        host: {
          type: 'string',
          description: 'hostname or IP address of the SMTP server'
        },
        port: {
          type: 'integer',
          description: 'port of the SMTP server (defaults to 25 or 465)'
        },
        secure: {
          type: 'boolean',
          description: 'whether the connection should use SSL'
        },
        auth: {
          type: 'object',
          properties: {
            user: {
              type: 'string',
              description: 'name to use to authenticate'
            },
            pass: {
              type: 'string',
              description: 'password to use to authenticate'
            }
          },

          additionalProperties: true,
          required: ['user', 'pass']
        },

        additionalProperties: true
      }
    }
  },

  additionalProperties: true,
  required: ['host', 'auth']
}

// ===================================================================

class TransportEmailPlugin {
  constructor (xo) {
    this._xo = xo
    this._sendEmail = bind(this._sendEmail, this)

    // Defined in configure().
    this._conf = null
    this._send = null
  }

  configure ({
    transport: transportConf,
    ...conf
  }) {
    const transport = createTransport(transportConf)
    transport.use('compile', markdownCompiler)

    this._conf = conf
    this._send = pify(::transport.sendMail, Promise)
  }

  load () {
    setProp(this._xo, 'sendEmail', this._sendEmail)
  }

  unload () {
    unsetProp(this._xo, 'sendEmail', this._sendEmail)
  }

  async _sendEmail ({
    from,
    to, cc, bcc,
    subject,
    markdown
  }) {
    await this._send({
      from: from || this._conf.from,
      to, cc, bcc,
      subject,
      markdown
    })
  }
}

// ===================================================================

export default ({ xo }) => new TransportEmailPlugin(xo)
