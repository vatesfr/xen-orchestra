import { Client } from 'undici'
import { format, parse } from 'json-rpc-protocol'

import XapiError from '../_XapiError.mjs'

import UnsupportedTransport from './_UnsupportedTransport.mjs'

// https://github.com/xenserver/xenadmin/blob/0df39a9d83cd82713f32d24704852a0fd57b8a64/XenModel/XenAPI/Session.cs#L403-L433
export default ({ secureOptions, url, agent }) => {
  url = new URL('./jsonrpc', Object.assign(new URL('http://localhost'), url))

  const path = url.pathname + url.search
  url.pathname = url.search = ''

  const client = new Client(url, {
    connect: secureOptions,
  })

  return async function (method, args) {
    const res = await client.request({
      body: format.request(0, method, args),
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      method: 'POST',
      path,
      agent,
    })

    // content-type is `text/xml` on old hosts where JSON-RPC is unsupported
    if (res.headers['content-type'] !== 'application/json') {
      throw new UnsupportedTransport()
    }

    const response = parse(await res.body.text())

    if (response.type === 'response') {
      return response.result
    }

    throw XapiError.wrap(response.error)
  }
}
