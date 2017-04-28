import superagent from 'superagent'
import { format, parse } from 'json-rpc-protocol'

export default ({ url: { hostname, port, protocol } }) => {
  const href = `${protocol}//${hostname}${
    port != null ? `:${port}` : ''
  }/jsonrpc`

  return (method, args) =>
    superagent.post(href)
      .accept('application/json')
      .parse(superagent.parse.text) // no smart parsing from superagent
      .send(format.request(0, method, args))
      .type('application/json')
      .then(({ text }) => {
        const response = parse(text)
        if (response.type === 'response') {
          return response.result
        }

        throw response.error
      })
}
