import pify from 'pify'
import { createTransport } from 'nodemailer'
import { markdown as nodemailerMarkdown } from 'nodemailer-markdown'

// ===================================================================

const markdownCompiler = nodemailerMarkdown()

const logAndRethrow = error => {
  console.error('[WARN] plugin transport-email:', error && error.stack || error)

  throw error
}

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

      additionalProperties: false,
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

        // FIXME: xo-web does not support edition of too nested
        user: {
          type: 'string',
          description: 'name to use to authenticate'
        },
        password: {
          type: 'string',
          description: 'password to use to authenticate'
        }
        // properties.
        // auth: {
        //   type: 'object',

        //   properties: {
        //     user: {
        //       type: 'string',
        //       description: 'name to use to authenticate'
        //     },
        //     pass: {
        //       type: 'string',
        //       description: 'password to use to authenticate'
        //     }
        //   },

        //   additionalProperties: false,
        //   required: ['user', 'pass']
        // }
      },

      additionalProperties: false,
      required: ['host']
    }
  },

  additionalProperties: false,
  required: ['from', 'transport']
}

// ===================================================================

class TransportEmailPlugin {
  constructor (xo) {
    this._sendEmail = ::this._sendEmail
    this._set = ::xo.defineProperty
    this._unset = null

    // Defined in configure().
    this._conf = null
    this._send = null
  }

  configure ({
    transport: {
      user,
      password,
      ...transportConf
    },
    ...conf
  }) {
    transportConf.auth = { user, pass: password }

    const transport = createTransport(transportConf)
    transport.use('compile', markdownCompiler)

    this._conf = conf
    this._send = pify(::transport.sendMail, Promise)
  }

  load () {
    this._unset = this._set('sendEmail', this._sendEmail)
  }

  unload () {
    this._unset()
  }

  async _sendEmail ({
    from,
    to, cc, bcc,
    subject,
    markdown
  }) {
    // TODO: handle errors
    await this._send({
      from: from || this._conf.from,
      to, cc, bcc,
      subject,
      markdown
    }).catch(logAndRethrow)
  }
}

// ===================================================================

export default ({ xo }) => new TransportEmailPlugin(xo)
