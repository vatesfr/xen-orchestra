import { HttpStatusCodeLiteral } from 'tsoa'

export class ApiError extends Error {
  #status: HttpStatusCodeLiteral

  constructor(message: string, status: HttpStatusCodeLiteral) {
    super(message)
    this.#status = status
  }

  get status() {
    return this.#status
  }
}
