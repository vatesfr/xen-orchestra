// A remote resource's fetch answered with an error status: the status says
// why (e.g. 403, the user may not read the resource)
export class RemoteResourceFetchError extends Error {
  readonly status: number

  constructor(response: Pick<Response, 'status' | 'statusText'>) {
    super(`Failed to fetch: ${response.statusText}`)
    this.name = 'RemoteResourceFetchError'
    this.status = response.status
  }
}
