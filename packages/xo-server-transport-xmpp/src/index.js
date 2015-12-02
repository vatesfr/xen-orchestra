import eventToPromise from 'event-to-promise'
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
          title: 'user',
          description: 'Xmpp address to use to authenticate'
        },
        password: {
          type: 'string',
          description: 'password to use to authenticate'
        }
      },

      additionalProperties: false,
      required: ['jid', 'password']
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

  async configure ({ transport: conf }) {
    conf.reconnect = true
    this._client = new XmppClient(conf)
    this._client.on('error', () => {})

    return eventToPromise(this._client.connection.socket, 'data')
      .then(() => eventToPromise(this._client, 'online'))
  }

  load () {
    this._unset = this._set('sendToXmppClient', this._sendToXmppClient)
  }

  unload () {
    this._unset()
  }

  _sendToXmppClient ({to, message}) {
    const stanza = new XmppClient.Stanza('message', { to: to, type: 'chat' })
          .c('body').t(message)
    this._client.send(stanza)
  }
}

// ===================================================================

export default ({ xo }) => new TransportXmppPlugin(xo)
