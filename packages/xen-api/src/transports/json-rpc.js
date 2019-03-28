import httpRequestPlus from 'http-request-plus'
import { format, parse } from 'json-rpc-protocol'

import UnsupportedTransport from './_UnsupportedTransport'

// https://github.com/xenserver/xenadmin/blob/0df39a9d83cd82713f32d24704852a0fd57b8a64/XenModel/XenAPI/Session.cs#L403-L433
export default ({ allowUnauthorized, url }) => {
  return (method, args) =>
    httpRequestPlus
      .post(url, {
        rejectUnauthorized: !allowUnauthorized,
        body: format.request(0, method, args),
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        path: '/jsonrpc',
      })
      .readAll('utf8')
      .then(
        text => {
          let response
          try {
            response = parse(text)
          } catch (error) {
            throw new UnsupportedTransport()
          }

          if (response.type === 'response') {
            return response.result
          }

          throw response.error
        },
        error => {
          if (error.response !== undefined) {
            // HTTP error
            throw new UnsupportedTransport()
          }

          throw error
        }
      )
}
