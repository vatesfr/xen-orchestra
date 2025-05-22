import hrp from 'http-request-plus'
import { ProxyAgent } from 'proxy-agent'

const { env } = process

export default class Http {
  // automatically fetches the proxy to use for the requested URL from the environment
  _agent = new ProxyAgent()

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

  httpRequest(url, opts) {
    return hrp(url, {
      ...opts,
      agent: this._agent,
    })
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
  }
}
