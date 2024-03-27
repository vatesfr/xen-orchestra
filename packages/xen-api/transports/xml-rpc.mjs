import { request } from 'undici'
import { XmlRpcMessage, XmlRpcResponse } from 'xmlrpc-parser'
import { parseXml } from '/home/julien/dev/vatesfr/xen-orchestra/packages/xo-server/dist/utils.mjs'
import { parser } from '@vates/xml-rpc/parser.mjs'

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

export default ({ dispatcher, url }) => {
  url = new URL('./xmlrpc', Object.assign(new URL('http://localhost'), url))

  return async function (method, args) {
    const message = new XmlRpcMessage(method, prepareXmlRpcParams(args))

    const res = await request(url, {
      dispatcher,
      body: message.xml(),
      headers: {
        Accept: 'text/xml',
        'Content-Type': 'text/xml',
      },
      method: 'POST',
    })

    if (((res.statusCode / 100) | 0) !== 2) {
      throw new Error('unexpect statusCode ' + res.statusCode)
    }

    if (res.headers['content-type'] !== 'text/xml' && res.headers['content-type'] !== 'application/xml') {
      throw new UnsupportedTransport()
    }

    const xml = await res.body.text()
    const response = parser.methodResponse(parseXml(xml).methodResponse)

    return parseResult(response.params[0])
  }
}
