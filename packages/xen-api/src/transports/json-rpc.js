import httpRequestPlus from 'http-request-plus'
import { format, parse } from 'json-rpc-protocol'

import { UnsupportedTransport } from './_utils'

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
