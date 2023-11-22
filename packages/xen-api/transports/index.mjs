import auto from './auto.mjs'
import jsonRpc from './json-rpc.mjs'
import xmlRpc from './xml-rpc.mjs'

export default {
  __proto__: null,

  auto,
  'json-rpc': jsonRpc,
  'xml-rpc': xmlRpc,
}
