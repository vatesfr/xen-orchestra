import { format, parse } from 'json-rpc-protocol'
import { request } from 'undici'

import XapiError from '../_XapiError.mjs'

import UnsupportedTransport from './_UnsupportedTransport.mjs'
import  { trace } from '@opentelemetry/api'

const tracer = trace.getTracer('xo:json-rpc')
// https://github.com/xenserver/xenadmin/blob/0df39a9d83cd82713f32d24704852a0fd57b8a64/XenModel/XenAPI/Session.cs#L403-L433
export default ({ dispatcher, url }) => {
  url = new URL('./jsonrpc', Object.assign(new URL('http://localhost'), url))

  return async function (method, args) {
      return tracer.startActiveSpan(`xo:json-rpc:${method}`, async (span) => {
        try{
          const res = await request(url, {
            dispatcher,
            body: format.request(0, method, args),
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json',
            },
            method: 'POST',
          })
    
          if (((res.statusCode / 100) | 0) !== 2) {
            throw new Error('unexpect statusCode ' + res.statusCode)
          }
    
          // content-type is `text/xml` on old hosts where JSON-RPC is unsupported
          if (res.headers['content-type'] !== 'application/json') {
            throw new UnsupportedTransport()
          }
    
          const response = parse(await res.body.text())
    
          if (response.type === 'response') {
            return response.result
          }
    
          throw XapiError.wrap(response.error)

        }finally{
          span.end()
        }
    });


  }
}
