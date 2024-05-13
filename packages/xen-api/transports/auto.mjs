import jsonRpc from './json-rpc.mjs'
import UnsupportedTransport from './_UnsupportedTransport.mjs'
import xmlRpc from './xml-rpc.mjs'

const factories = [jsonRpc, xmlRpc]
const { length } = factories

export default opts => {
  let i = 0

  let call
  function create() {
    const current = factories[i++](opts)
    if (i < length) {
      const currentI = i
      call = (...args) =>
        current(...args).catch(error => {
          if (error instanceof UnsupportedTransport) {
            if (currentI === i) {
              // not changed yet
              create()
            }
            return call(...args)
          }

          throw error
        })
    } else {
      call = current
    }
  }
  create()

  return (...args) => call(...args)
}
