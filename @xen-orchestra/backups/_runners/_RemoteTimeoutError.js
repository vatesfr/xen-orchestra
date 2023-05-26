'use strict'
class RemoteTimeoutError extends Error {
  constructor(remoteId) {
    super('timeout while getting the remote ' + remoteId)
    this.remoteId = remoteId
  }
}
exports.RemoteTimeoutError = RemoteTimeoutError
