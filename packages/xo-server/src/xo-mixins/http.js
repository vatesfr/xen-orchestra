import hrp from 'http-request-plus'
import ProxyAgent from 'proxy-agent'

import { firstDefined } from '../utils'

export default class Http {
  // whether XO has a proxy set from its own config/environment
  get hasOwnHttpProxy() {
    return this._hasOwnHttpProxy
  }

  get httpAgent() {
    return this._agent
  }

  constructor(_, { httpProxy = firstDefined(process.env.http_proxy, process.env.HTTP_PROXY) }) {
    this._hasOwnHttpProxy = httpProxy != null

    this.setHttpProxy(httpProxy)
  }

  // TODO: find a way to decide for which addresses the proxy should be used
  //
  // For the moment, use this method only to access external resources (e.g.
  // patches, upgrades, support tunnel)
  httpRequest(...args) {
    return hrp(
      {
        agent: this._agent,
      },
      ...args
    )
  }

  setHttpProxy(proxy) {
    if (proxy == null) {
      this._agent = undefined
    } else {
      this._agent = new ProxyAgent(proxy)
    }
  }
}
