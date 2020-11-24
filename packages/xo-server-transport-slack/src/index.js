import Slack from 'slack-node'
import { promisify } from 'promise-toolbox'

// ===================================================================

const logAndRethrow = error => {
  console.error('[WARN] plugin transport-slack:', (error != null && error.stack) || error)

  throw error
}

// ===================================================================

export const configurationSchema = {
  type: 'object',
  properties: {
    webhookUri: {
      type: 'string',
      description: 'The Mattermost or Slack webhook URL.',
    },
    channel: {
      type: 'string',
      description: 'Channel, private group, or IM channel to send message to.',
    },
    username: {
      type: 'string',
      description: 'Bot username.',
    },
    icon_emoji: {
      type: 'string',
      description: 'The bot icon. It can be a slack emoji or a URL image.',
    },
  },
  additionalProperties: false,
  required: ['webhookUri', 'channel'],
}

// ===================================================================

class XoServerTransportSlack {
  constructor({ xo }) {
    this._sendSlack = this._sendSlack.bind(this)
    this._set = xo.defineProperty.bind(xo)
    this._unset = null

    // Defined in configure().
    this._conf = null
    this._send = null
  }

  configure({ webhookUri, ...conf }) {
    const slack = new Slack()
    slack.setWebhook(webhookUri)
    this._conf = conf
    this._send = promisify(slack.webhook)
  }

  load() {
    this._unset = this._set('sendSlackMessage', this._sendSlack)
  }

  unload() {
    this._unset()
  }

  test() {
    return this._sendSlack({
      message: `Hi there,

The transport-slack plugin for Xen Orchestra server seems to be working fine, nicely done :)`,
    })
  }

  _sendSlack({ message }) {
    // TODO: handle errors
    return this._send({ ...this._conf, text: message }).catch(logAndRethrow)
  }
}

export default opts => new XoServerTransportSlack(opts)
