// TODO: remove when Node >=15.0
export default class AggregateError extends Error {
  constructor(errors, message) {
    super(message)
    this.errors = errors
  }
}
