import { formatXml } from '@vates/xml/format'
import { parseXml } from '@vates/xml/parse'
import { request } from 'undici'
import { xmlRpcFormatter } from '@vates/xml-rpc/formatter'
import { xmlRpcParser } from '@vates/xml-rpc/parser'

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
    const res = await request(url, {
      dispatcher,
      body: formatXml(
        xmlRpcFormatter.format_methodCall({
          methodName: method,
          params: prepareXmlRpcParams(args),
        }),
        { indent: 0 }
      ),
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
    const response = xmlRpcParser.parse(parseXml(xml, { normalize: false, trim: false }))

    return parseResult(response.params[0])
  }
}
