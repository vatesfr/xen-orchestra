import { Client } from 'undici'
import { XmlRpcMessage, XmlRpcResponse } from 'xmlrpc-parser'

import prepareXmlRpcParams from './_prepareXmlRpcParams.mjs'
import XapiError from '../_XapiError.mjs'
import UnsupportedTransport from './_UnsupportedTransport.mjs'

const parseResult = result => {
  const status = result.Status

  // Return the plain result if it does not have a valid XAPI
  // format.
  if (status === undefined) {
    return result
  }

  if (status !== 'Success') {
    throw XapiError.wrap(result.ErrorDescription)
  }

  return result.Value
}

export default ({ secureOptions, url, agent }) => {
  url = new URL('./xmlrpc', Object.assign(new URL('http://localhost'), url))

  const path = url.pathname + url.search
  url.pathname = url.search = ''

  const client = new Client(url, {
    connect: secureOptions,
  })

  return async function (method, args) {
    const message = new XmlRpcMessage(method, prepareXmlRpcParams(args))

    const res = await client.request({
      body: message.xml(),
      headers: {
        Accept: 'text/xml',
        'Content-Type': 'text/xml',
      },
      method: 'POST',
      path,
      agent,
    })

    if (res.headers['content-type'] !== 'text/xml' && res.headers['content-type'] !== 'application/xml') {
      throw new UnsupportedTransport()
    }

    const xml = await res.body.text()
    const response = await new XmlRpcResponse().parse(xml)

    return parseResult(response.params[0])
  }
}
