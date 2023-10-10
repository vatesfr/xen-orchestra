import { client, xml } from '@xmpp/client'

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

  configure({ host, jid, port, password }) {
    this._conf = {
      password,
      service: Object.assign(new URL('xmpp://localhost'), { hostname: host, port }).href,
      username: jid,
    }
  }

  async load() {
    this._client = client(this._conf)
    await this._client.start()

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
        xml(
          'message',
          {
            to: receiver,
            type: 'chat',
          },
          xml('body', {}, message)
        )
      )
    }
  }
}

// ===================================================================

export default opts => new TransportXmppPlugin(opts)
