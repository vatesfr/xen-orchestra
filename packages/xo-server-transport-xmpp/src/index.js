import XmppClient from 'node-xmpp-client'

// ===================================================================

export const configurationSchema = {
  type: 'object',

  properties: {
    transport: {
      type: 'object',

      properties: {
        host: {
          type: 'string',
          description: 'host where the XMPP server is located'
        },
        port: {
          type: 'integer',
          description: 'port of the XMPP server (default to 5222)',
          default: 5222
        },
        jid: {
          type: 'string',
          description: 'Xmpp address to use to authenticate'
        },
        password: {
          type: 'string',
          description: 'password to use to authenticate'
        },
        register: {
          type: 'boolean',
          description: 'create a new account if necessary',
          default: true
        }
      },

      additionalProperties: false,
      required: ['jid', 'password', 'register']
    }
  },

  additionalProperties: false,
  required: ['transport']
}

// ===================================================================

class TransportXmppPlugin {
  constructor (xo) {
    this._set = ::xo.defineProperty
    this._unset = null

    // Defined in configure().
    this._client = null
  }

  configure ({ transport: conf }) {
    conf.reconnect = true
    this._client = new XmppClient(conf)

    this._client.on('error', () => {})
  }

  load () {
    this._unset = this._set('sendToXmppClient', this._sendToXmppClient)
  }

  unload () {
    this._client.end()
    this._unset()
  }

  async _sendToXmppClient ({to, message}) {
    const stanza = new XmppClient.Stanza('message', { to: to, type: 'chat' })
          .c('body').t(message)
    this._client.send(stanza)
  }
}

// ===================================================================

export default ({ xo }) => new TransportXmppPlugin(xo)
