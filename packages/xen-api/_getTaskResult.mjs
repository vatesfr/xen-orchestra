import { Cancel } from 'promise-toolbox'
import { parseXml } from '@vates/xml/parse'
import { xmlRpcParser } from '@vates/xml-rpc/parser'

import XapiError from './_XapiError.mjs'

export default task => {
  const { status } = task
  if (status === 'cancelled') {
    return Promise.reject(new Cancel('task canceled'))
  }
  if (status === 'failure') {
    const error = XapiError.wrap(task.error_info)
    error.task = task
    return Promise.reject(error)
  }
  if (status === 'success') {
    // the result might be:
    // - empty string (tasks without result on XS 6.5)
    // - an opaque reference
    // - an XML-RPC value
    const { result } = task
    return Promise.resolve(
      result === '' ? '' : xmlRpcParser.parse_value(parseXml(result + '\n', { normalize: false, trim: false }))
    )
  }
}
