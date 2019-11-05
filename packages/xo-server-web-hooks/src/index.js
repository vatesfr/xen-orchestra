import request from 'http-request-plus'
import { groupBy, mapValues } from 'lodash'

const makeRequest = (url, type, data) =>
  request(url, {
    body: JSON.stringify({ ...data, type }),
    headers: { 'content-type': 'application/json' },
    method: 'POST',
  })

class XoServerHooks {
  constructor({ xo }) {
    this._xo = xo

    // Defined in configure().
    this._conf = null
    this._key = null
    this.handlePreHook = (...args) => this.handleHook('pre', ...args)
    this.handlePostHook = (...args) => this.handleHook('post', ...args)
  }

  configure(configuration) {
    this._conf = mapValues(groupBy(configuration, 'method'), _ =>
      groupBy(_, 'type')
    )
  }

  handleHook(type, data) {
    let hooks
    if (
      (hooks = this._conf[data.method]) === undefined ||
      (hooks = hooks[type]) === undefined
    ) {
      return
    }
    return Promise.all(hooks.map(({ url }) => makeRequest(url, type, data)))
  }

  load() {
    this._xo.on('xo:preCall', this.handlePreHook)
    this._xo.on('xo:postCall', this.handlePostHook)
  }

  unload() {
    this._xo.removeListener('xo:preCall', this.handlePreHook)
    this._xo.removeListener('xo:postCall', this.handlePostHook)
  }

  async test({ url }) {
    await makeRequest(url, 'pre', {
      callId: '0',
      userId: '42',
      method: 'vm.start',
      params: { id: 'foobar' },
    })
    await makeRequest(url, 'post', {
      callId: '0',
      userId: '42',
      method: 'vm.start',
      result: '',
    })
  }
}

export const configurationSchema = ({ xo: { apiMethods } }) => ({
  description: 'Bind XO API calls to HTTP requests.',
  type: 'array',
  items: {
    type: 'object',
    title: 'Hook',
    properties: {
      method: {
        description: 'The method to be bound to',
        enum: Object.keys(apiMethods).sort(),
        title: 'Method',
        type: 'string',
      },
      type: {
        description:
          'Right before the API call *or* right after the action has been completed',
        enum: ['pre', 'post'],
        title: 'Type',
        type: 'string',
      },
      url: {
        description: 'The full URL you wish the request to be sent to',
        title: 'URL',
        type: 'string',
      },
    },
    required: ['method', 'type', 'url'],
  },
})

export const testSchema = {
  type: 'object',
  description:
    'The test will simulate a hook to vm.start with {"id":"foobar"} as a parameter',
  properties: {
    url: {
      title: 'URL',
      type: 'string',
      description: 'The URL the test request will be sent to',
    },
  },
}

export default opts => new XoServerHooks(opts)
