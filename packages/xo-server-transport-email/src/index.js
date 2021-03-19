import { createTransport } from 'nodemailer'
import { markdown as nodemailerMarkdown } from 'nodemailer-markdown'
import { promisify } from 'promise-toolbox'

// ===================================================================

const removeUndefined = obj => {
  Object.keys(obj).forEach(key => {
    if (obj[key] === undefined) {
      delete obj[key]
    }
  })
  return obj
}

const markdownCompiler = nodemailerMarkdown()

const logAndRethrow = error => {
  console.error('[WARN] plugin transport-email:', (error && error.stack) || error)

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
          type: 'string',
          description: 'human readable name of the sender',
        },
        address: {
          type: 'string',
          description: 'email address of the sender',
        },
      },

      additionalProperties: false,
      required: ['address'],
    },

    transport: {
      type: 'object',

      properties: {
        host: {
          type: 'string',
          description: 'hostname or IP address of the SMTP server',
        },
        port: {
          type: 'integer',
          description: 'port of the SMTP server (defaults to 25 or 465 for TLS)',
        },
        secure: {
          default: false,
          enum: [false, 'force', 'disabled', true],
          enumNames: [
            'auto (uses STARTTLS if available)',
            'force (requires STARTTLS or fail)',
            'disabled (never use STARTTLS)',
            'TLS',
          ],
          description: 'whether the connection should use TLS',
        },
        ignoreUnauthorized: {
          type: 'boolean',
          description: 'ignore certificates error (e.g. self-signed certificate)',
        },

        // FIXME: xo-web does not support edition of too nested
        user: {
          type: 'string',
          description: 'name to use to authenticate',
        },
        password: {
          type: 'string',
          description: 'password to use to authenticate',
        },
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
      required: ['host'],
    },
  },

  additionalProperties: false,
  required: ['from', 'transport'],
}

export const testSchema = {
  type: 'object',

  properties: {
    to: {
      type: 'string',
      description: 'recipient of the test mail',
    },
  },

  additionalProperties: false,
  required: ['to'],
}

// ===================================================================

class TransportEmailPlugin {
  constructor({ staticConfig, xo }) {
    this._staticConfig = staticConfig
    this._xo = xo
    this._unset = null

    // Defined in configure().
    this._send = null
  }

  configure({ from, transport: { ignoreUnauthorized, password, secure, user, ...transportConf } }) {
    if (ignoreUnauthorized != null) {
      ;(transportConf.tls || (transportConf.tls = {})).rejectUnauthorized = !ignoreUnauthorized
    }

    if (user != null && password != null) {
      transportConf.auth = { user, pass: password }
    }

    switch (secure) {
      case true:
        transportConf.secure = true
        break
      case 'disabled':
        transportConf.ignoreTLS = true
        break
      case 'required':
        transportConf.requireTLS = true
        break
    }

    const transport = createTransport({ ...transportConf, ...this._staticConfig.transport }, { from })
    transport.use('compile', markdownCompiler)

    this._send = promisify(transport.sendMail, transport)
  }

  load() {
    this._unset = this._xo.defineProperty('sendEmail', this._sendEmail, this)
  }

  unload() {
    this._unset()
  }

  test({ to }) {
    return this._sendEmail({
      to,
      subject: '[Xen Orchestra] Test of transport-email plugin',
      markdown: `Hi there,

The transport-email plugin for Xen Orchestra server seems to be working fine, nicely done :)
`,
      attachments: [
        {
          filename: 'example.txt',
          content: 'Attachments are working too, great!\n',
        },
      ],
    })
  }

  _sendEmail({ from, to, cc, bcc, subject, markdown, attachments }) {
    return this._send(
      removeUndefined({
        from,
        to,
        cc,
        bcc,
        subject,
        markdown,
        attachments,
      })
    ).catch(logAndRethrow)
  }
}

// ===================================================================

export default opts => new TransportEmailPlugin(opts)
