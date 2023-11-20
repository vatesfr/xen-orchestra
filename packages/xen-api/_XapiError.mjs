import { BaseError } from 'make-error'

export default class XapiError extends BaseError {
  static wrap(error) {
    let code, params
    if (Array.isArray(error)) {
      // < XenServer 7.3
      ;[code, ...params] = error
    } else {
      code = error.message
      params = error.data
      if (!Array.isArray(params)) {
        params = []
      }
    }
    return new XapiError(code, params)
  }

  constructor(code, params) {
    super(`${code}(${params.join(', ')})`)

    this.code = code
    this.params = params

    // slots than can be assigned later
    this.call = undefined
    this.url = undefined
    this.task = undefined
  }
}
