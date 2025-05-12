import { createLogger } from '@xen-orchestra/log'

const log = createLogger('xo:web-hooks')

function constructPayload(format, data, type) {
  switch (format) {
    case 'json':
      return JSON.stringify({ ...data, type })
    case 'office365': {
      // https://learn.microsoft.com/en-us/outlook/actionable-messages/message-card-reference
      const facts = Object.keys(data).map(key => {
        const value = data[key]
        return { name: key, value: typeof value === 'string' ? value : JSON.stringify(value) }
      })

      return JSON.stringify({
        '@type': 'MessageCard',
        '@context': 'https://schema.org/extensions',
        themeColor: '6B63BF',
        summary: 'New notification from the Xen-Orchestra webhook plugin',
        sections: [{ title: `XO ${type.toUpperCase()} notification`, facts }],
      })
    }
    default:
      throw new Error(`Unknown format: ${format}`)
  }
}

function handleHook(type, data) {
  const hooks = this._hooks[data.method]?.[type]
  if (hooks !== undefined) {
    return Promise.all(
      // eslint-disable-next-line array-callback-return
      hooks.map(({ url, waitForResponse = false, format }) => {
        const payload = constructPayload(format, data, type)
        const promise = this._makeRequest(url, payload).catch(error => {
          log.error('web hook failed', {
            error,
            webHook: { ...data, url, type, format },
          })
        })
        if (waitForResponse && type === 'pre') {
          return promise
        }
      })
    )
  }
}

class XoServerHooks {
  constructor({ xo }) {
    this._xo = xo

    // Defined in configure().
    this._hooks = null

    this._handlePreHook = handleHook.bind(this, 'pre')
    this._handlePostHook = handleHook.bind(this, 'post')
  }

  _makeRequest(url, data) {
    return this._xo.httpRequest(url, {
      body: data,
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
      timeout: 1e4,
    })
  }

  configure(configuration) {
    // this._hooks = {
    //   'vm.start': {
    //     pre: [
    //       {
    //         method: 'vm.start',
    //         type: 'pre',
    //         url: 'https://my-domain.net/xo-hooks?action=vm.start',
    //         waitForResponse: false
    //       },
    //       ...
    //     ],
    //     post: [
    //       ...
    //     ]
    //   },
    //   ...
    // }
    const hooks = {}
    for (const hook of configuration.hooks) {
      if (hooks[hook.method] === undefined) {
        hooks[hook.method] = {}
      }
      hook.type.split('/').forEach(type => {
        if (hooks[hook.method][type] === undefined) {
          hooks[hook.method][type] = []
        }
        hooks[hook.method][type].push(hook)
      })
    }
    this._hooks = hooks
  }

  load() {
    this._xo.on('xo:preCall', this._handlePreHook)
    this._xo.on('xo:postCall', this._handlePostHook)
    this._xo.on('backup:preCall', this._handlePreHook)
    this._xo.on('backup:postCall', this._handlePostHook)
  }

  unload() {
    this._xo.removeListener('xo:preCall', this._handlePreHook)
    this._xo.removeListener('xo:postCall', this._handlePostHook)
    this._xo.removeListener('backup:preCall', this._handlePreHook)
    this._xo.removeListener('backup:postCall', this._handlePostHook)
  }

  async test() {
    const methodNames = Object.keys(this._hooks)
    for (const method of methodNames) {
      const payload = {
        callId: '0',
        userId: 'b4tm4n',
        userName: 'bruce.wayne@waynecorp.com',
        method,
        params: { id: '67aac198-0174-11ea-8d71-362b9e155667' },
        timestamp: 0,
      }
      // overrides type to not send `type: 'pre/post'` in payload
      const preHooks = this._hooks[method].pre?.map(hook => ({ ...hook, type: 'pre' })) ?? []
      const postHooks = this._hooks[method].post?.map(hook => ({ ...hook, type: 'post' })) ?? []

      await Promise.all(
        [...preHooks, ...postHooks].map(hook => {
          const _payload = constructPayload(hook.format, payload, hook.type)
          return this._makeRequest(hook.url, _payload)
        })
      )
    }
  }
}

export const configurationSchema = ({ xo: { apiMethods } }) => ({
  description: 'Bind XO API calls to HTTP requests.',
  type: 'object',
  properties: {
    hooks: {
      type: 'array',
      title: 'Hooks',
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
            description: 'Right before the API call *or* right after the action has been completed',
            enum: ['pre', 'post', 'pre/post'],
            title: 'Type',
            type: 'string',
          },
          url: {
            description: 'The full URL you wish the request to be sent to',
            // It would be more convenient to configure 1 URL for multiple
            // triggers but the UI implementation is not ideal for such a deep
            // configuration schema: https://i.imgur.com/CpvAwPM.png
            title: 'URL',
            type: 'string',
          },
          format: {
            default: 'json',
            description: 'The format of the payload sent to the URL',
            enum: ['json', 'office365'],
            enumNames: ['JSON', 'Office 365 connector'],
            title: 'Payload format',
          },
          waitForResponse: {
            description: 'Waiting for the server response before executing the call. Only available on "PRE" type',
            title: 'Wait for response',
            type: 'boolean',
          },
        },
        required: ['method', 'type', 'url', 'format'],
      },
    },
  },
  required: ['hooks'],
})

export default opts => new XoServerHooks(opts)
