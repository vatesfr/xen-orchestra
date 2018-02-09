import jsonRpc from './json-rpc'
import xmlRpc from './xml-rpc'
import xmlRpcJson from './xml-rpc-json'
import { UnsupportedTransport } from './_utils'

const factories = [jsonRpc, xmlRpcJson, xmlRpc]
const { length } = factories

export default opts => {
  let i = 0

  let call
  function create () {
    const current = factories[i++](opts)
    if (i < length) {
      const currentI = i
      call = (method, args) =>
        current(method, args).catch(error => {
          if (error instanceof UnsupportedTransport) {
            if (currentI === i) {
              // not changed yet
              create()
            }
            return call(method, args)
          }

          throw error
        })
    } else {
      call = current
    }
  }
  create()

  return (method, args) => call(method, args)
}
