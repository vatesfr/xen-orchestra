export class ApiError extends Error {
  status: number
  cause?: string

  constructor(message: string, options: { cause?: string; status: number } = { status: 500 }) {
    super(message)
    this.status = options.status
    this.cause = options.cause
    Object.setPrototypeOf(this, ApiError.prototype)
  }
}
