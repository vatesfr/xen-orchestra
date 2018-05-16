import defined, { ifDef } from '@xen-orchestra/defined'
import hrp from 'http-request-plus'
import ProxyAgent from 'proxy-agent'

export default class HttpRequest {
  constructor(
    _,
    {
      config: {
        httpProxy = defined(process.env.http_proxy, process.env.HTTP_PROXY),
      },
    }
  ) {
    this.httpRequest = hrp.extend({
      agent: ifDef(httpProxy, _ => new ProxyAgent(_)),
    })
  }
}
