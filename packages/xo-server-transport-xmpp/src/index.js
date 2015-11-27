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
          type: 'number',
          description: 'port of the XMPP server (default to 5222)'
        },
        user: {
          type: 'string',
          description: 'name to use to authenticate'
        },
        pass: {
          type: 'string',
          description: 'password to use to authenticate'
        }
      },

      additionalProperties: false,
      required: ['user', 'pass']
    },

    accountOptions: {
      type: 'object',

      properties: {
        register: {
          type: 'boolean',
          description: 'create a new account if necessary',
          default: true
        }
      },

      additionalProperties: false,
      required: ['register']
    }
  },

  additionalProperties: false,
  required: ['transport', 'accountOptions']
}

// ===================================================================

class TransportXmppPlugin {
  constructor (xo) {

  }

  configure (conf) {

  }

  load () {

  }

  unload () {

  }
}

// ===================================================================

export default ({ xo }) => new TransportXmppPlugin(xo)
