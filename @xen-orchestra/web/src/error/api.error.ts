export class ApiError extends Error {
  status: number
  cause?: Record<string, unknown>

  constructor(message: string, options: { cause?: Record<string, unknown>; status: number } = { status: 500 }) {
    super(message)
    this.status = options.status
    this.cause = options.cause
    Object.setPrototypeOf(this, ApiError.prototype)
  }
}
