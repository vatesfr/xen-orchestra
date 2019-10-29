import hrp from 'http-request-plus'
import ProxyAgent from 'proxy-agent'

import { firstDefined } from '../utils'

export default class Http {
  get httpProxy() {
    return this._proxy
  }

  constructor(
    _,
    { httpProxy = firstDefined(process.env.http_proxy, process.env.HTTP_PROXY) }
  ) {
    this.setHttpProxy(httpProxy)
  }

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
      this._agent = this._proxy = undefined
    } else {
      this._agent = new ProxyAgent(proxy)
      this._proxy = proxy
    }
  }
}
