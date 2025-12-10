import { HttpStatusCodeLiteral } from 'tsoa'

export class ApiError extends Error {
  #status: HttpStatusCodeLiteral
  #data?: Record<string, unknown>

  constructor(message: string, status: HttpStatusCodeLiteral, opts: { data?: Record<string, unknown> } = {}) {
    super(message)
    this.#status = status
    this.#data = opts.data
  }

  get status() {
    return this.#status
  }

  get data() {
    return this.#data
  }
}
