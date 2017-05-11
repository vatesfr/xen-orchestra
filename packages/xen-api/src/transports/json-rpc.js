import httpRequestPlus from 'http-request-plus'
import { format, parse } from 'json-rpc-protocol'

export default ({ allowUnauthorized, url }) => {
  return (method, args) => httpRequestPlus.post(url, {
    rejectUnauthorized: !allowUnauthorized,
    body: format.request(0, method, args),
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    path: '/jsonrpc'
  }).readAll('utf8').then(text => {
    const response = parse(text)
    if (response.type === 'response') {
      return response.result
    }

    throw response.error
  })
}
