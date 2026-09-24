import { HttpStatusCodeLiteral } from 'tsoa'

export class ApiError extends Error {
  #status: HttpStatusCodeLiteral
  #data?: Record<string, unknown>
  #headers?: Record<string, string>

  /**
   * @param opts.headers response headers, e.g. `Retry-After`
   */
  constructor(
    message: string,
    status: HttpStatusCodeLiteral,
    opts: { data?: Record<string, unknown>; headers?: Record<string, string> } = {}
  ) {
    super(message)
    this.#status = status
    this.#data = opts.data
    this.#headers = opts.headers
  }

  get status() {
    return this.#status
  }

  get data() {
    return this.#data
  }

  get headers() {
    return this.#headers
  }
}
