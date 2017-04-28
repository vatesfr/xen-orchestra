import { InvalidJson } from 'json-rpc-protocol'

import jsonRpc from './json-rpc'
import xmlRpc from './xml-rpc'

export default opts => {
  let call = (jsonRpcCall =>
    (method, args) => jsonRpcCall(method, args).then(
      result => {
        // JSON-RPC seems to be working, remove the test
        call = jsonRpcCall

        return result
      },
      error => {
        if (error instanceof InvalidJson) {
          // fallback to XML-RPC
          call = xmlRpc(opts)

          return call(method, args)
        }

        throw error
      }
    )
  )(jsonRpc(opts))

  return (method, args) => call(method, args)
}
