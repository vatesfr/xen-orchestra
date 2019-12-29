import { Cancel } from 'promise-toolbox'

import XapiError from './_XapiError'

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
    // - empty string
    // - an opaque reference
    // - an XML-RPC value
    return Promise.resolve(task.result)
  }
}
