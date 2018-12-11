import hrp from 'http-request-plus'
import ProxyAgent from 'proxy-agent'

import { firstDefined } from '../utils'

export default class Http {
  constructor(
    _,
    { httpProxy = firstDefined(process.env.http_proxy, process.env.HTTP_PROXY) }
  ) {
    this._proxy = httpProxy && new ProxyAgent(httpProxy)
  }

  httpRequest(...args) {
    return hrp(
      {
        agent: this._proxy,
      },
      ...args
    )
  }
}
