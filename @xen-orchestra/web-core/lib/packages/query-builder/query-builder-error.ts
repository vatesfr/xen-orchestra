export class QueryBuilderError extends Error {
  constructor(message: string, data?: any) {
    super()

    console.warn('QueryBuilder:', message, data)
  }
}
