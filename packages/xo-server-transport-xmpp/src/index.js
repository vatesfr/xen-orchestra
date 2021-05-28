import fromEvent from 'promise-toolbox/fromEvent'
import XmppClient from 'node-xmpp-client'

// ===================================================================

export const configurationSchema = {
  type: 'object',

  properties: {
    host: {
      type: 'string',
      description: 'host where the XMPP server is located',
    },
    port: {
      type: 'integer',
      description: 'port of the XMPP server (default to 5222)',
      default: 5222,
    },
    jid: {
      type: 'string',
      title: 'user',
      description: 'Xmpp address to use to authenticate',
    },
    password: {
      type: 'string',
      description: 'password to use to authenticate',
    },
  },

  additionalProperties: false,
  required: ['jid', 'password'],
}

// ===================================================================

class TransportXmppPlugin {
  constructor({ xo }) {
    this._sendToXmppClient = this._sendToXmppClient.bind(this)
    this._set = xo.defineProperty.bind(xo)
    this._unset = null

    // Defined in configure().
    this._conf = null

    // Defined in load().
    this._client = null
  }

  configure(conf) {
    this._conf = conf
    this._conf.reconnect = true
  }

  async load() {
    this._client = new XmppClient(this._conf)
    this._client.on('error', () => {})

    await fromEvent(this._client.connection.socket, 'data')
    await fromEvent(this._client, 'online')

    this._unset = this._set('sendToXmppClient', this._sendToXmppClient)
  }

  unload() {
    this._unset()
    this._client.end()

    this._unset = this._client = null
  }

  _sendToXmppClient({ to, message }) {
    for (const receiver of to) {
      this._client.send(
        new XmppClient.Stanza('message', {
          to: receiver,
          type: 'chat',
        })
          .c('body')
          .t(message)
      )
    }
  }
}

// ===================================================================

export default opts => new TransportXmppPlugin(opts)
