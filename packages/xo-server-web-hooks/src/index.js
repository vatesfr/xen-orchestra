import createLogger from '@xen-orchestra/log'
import { groupBy, mapValues } from 'lodash'

const log = createLogger('xo:web-hooks')

function makeRequest(url, type, data) {
  return this._xo.httpRequest(url, {
    body: JSON.stringify({ ...data, type }),
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
    onRequest: req => {
      req.setTimeout(1e4)
      req.on('timeout', req.abort)
    },
  })
}

function handleHook(type, data) {
  let hooks
  if ((hooks = this._conf[data.method]?.[type]) !== undefined) {
    return Promise.all(
      hooks.map(({ url }) =>
        this._makeRequest(url, type, data).catch(log.error)
      )
    )
  }
}

class XoServerHooks {
  constructor({ xo }) {
    this._xo = xo

    // Defined in configure().
    this._conf = null

    this._handlePreHook = handleHook.bind(this, 'pre')
    this._handlePostHook = handleHook.bind(this, 'post')
    this._makeRequest = makeRequest.bind(this)
  }

  configure(configuration) {
    // this._conf = {
    //   'vm.start': {
    //     pre: [
    //       {
    //         method: 'vm.start',
    //         type: 'pre',
    //         url: 'https://my-domain.net/xo-hooks?action=vm.start'
    //       },
    //       ...
    //     ],
    //     post: [
    //       ...
    //     ]
    //   },
    //   ...
    // }
    this._conf = mapValues(groupBy(configuration, 'method'), _ =>
      groupBy(_, 'type')
    )
  }

  load() {
    this._xo.on('xo:preCall', this._handlePreHook)
    this._xo.on('xo:postCall', this._handlePostHook)
  }

  unload() {
    this._xo.removeListener('xo:preCall', this._handlePreHook)
    this._xo.removeListener('xo:postCall', this._handlePostHook)
  }

  async test({ url }) {
    await this._makeRequest(url, 'pre', {
      callId: '0',
      userId: 'b4tm4n',
      userName: 'bruce.wayne@waynecorp.com',
      method: 'vm.start',
      params: { id: '67aac198-0174-11ea-8d71-362b9e155667' },
    })
    await this._makeRequest(url, 'post', {
      callId: '0',
      userId: 'b4tm4n',
      userName: 'bruce.wayne@waynecorp.com',
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
    'The test will simulate a hook on `vm.start` (both "pre" and "post" hooks)',
  properties: {
    url: {
      title: 'URL',
      type: 'string',
      description: 'The URL the test request will be sent to',
    },
  },
}

export default opts => new XoServerHooks(opts)
