import { EnvHttpProxyAgent } from 'undici'
import { ProxyAgent } from 'proxy-agent'

const { env } = process

export default class Http {
  // automatically fetches the proxy to use for the requested URL from the environment
  //
  // still exposed as `httpAgent` and used as a Node HTTP agent by other parts of the app
  _agent = new ProxyAgent()

  // undici dispatchers for `fetch`, memoized by `${rejectUnauthorized}:${timeout}`
  //
  // `EnvHttpProxyAgent` reads the proxy configuration from the environment, kept
  // up to date by `setHttpProxy`
  _dispatchers = new Map()

  // whether XO has a proxy set from its own config/environment
  get hasOwnHttpProxy() {
    return this._hasOwnHttpProxy
  }

  get httpAgent() {
    return this._agent
  }

  constructor(app) {
    app.config.watch(({ httpProxy, noProxy }) => {
      if (httpProxy !== undefined) {
        this._hasOwnHttpProxy = true

        this.setHttpProxy(httpProxy, noProxy)
      }
    })
  }

  _getDispatcher(rejectUnauthorized, timeout) {
    const key = `${rejectUnauthorized}:${timeout}`
    let dispatcher = this._dispatchers.get(key)
    if (dispatcher === undefined) {
      dispatcher = new EnvHttpProxyAgent({
        connect: { rejectUnauthorized },
        bodyTimeout: timeout,
        headersTimeout: timeout,
      })
      this._dispatchers.set(key, dispatcher)
    }
    return dispatcher
  }

  // by default the failed response body is drained (freeing the socket) and its
  // content exposed as `error.data`; pass `bypassStatusCheck: true` to instead
  // take ownership of `error.response` and consume its body yourself
  async httpRequest(
    url,
    { auth, body, bypassStatusCheck = false, headers, rejectUnauthorized = true, timeout = 0, ...opts } = {}
  ) {
    const finalHeaders = { ...headers }
    if (auth !== undefined) {
      finalHeaders.authorization = 'Basic ' + Buffer.from(auth).toString('base64')
    }

    const response = await fetch(url, {
      ...opts,
      body,
      headers: finalHeaders,
      dispatcher: this._getDispatcher(rejectUnauthorized, timeout),

      ...(body !== undefined && typeof body.pipe === 'function' ? { duplex: 'half' } : {}),
    })

    if (!response.ok) {
      const error = new Error(`${response.status} ${response.statusText}`)
      error.response = response

      if (!bypassStatusCheck) {
        // drain the response body to free the socket
        error.cause = (await response.text().catch(() => '')).substring(0, 1024)
      }

      throw error
    }

    return response
  }

  // Inject the proxy into the environment, it will be automatically used by `_agent` and by most libs (e.g `axios`)
  setHttpProxy(proxy, noProxy) {
    if (proxy == null) {
      delete env.http_proxy
      delete env.HTTP_PROXY
      delete env.https_proxy
      delete env.HTTPS_PROXY
    } else {
      env.http_proxy = env.HTTP_PROXY = env.https_proxy = env.HTTPS_PROXY = proxy
    }

    if (noProxy !== undefined) {
      if (proxy === null) {
        delete env.no_proxy
        delete env.NO_PROXY
      } else {
        env.no_proxy = env.NO_PROXY = noProxy
      }
    }

    // the proxy configuration changed: drop cached dispatchers so they are rebuilt
    // from the new environment
    for (const dispatcher of this._dispatchers.values()) {
      dispatcher.close().catch(() => {})
    }
    this._dispatchers.clear()
  }
}
