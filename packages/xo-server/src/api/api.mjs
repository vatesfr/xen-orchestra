const extractData = _ => _._data

export function getConnections() {
  return Array.from(this.apiConnections, extractData)
}

getConnections.description = 'Get a list of all current connections to this API'
getConnections.permission = 'admin'

export function closeAllConnections() {
  const currentConnection = this.apiContext.connection
  for (const connection of this.apiConnections) {
    if (connection !== currentConnection) {
      connection.close()
    }
  }
}

closeAllConnections.description = 'Close all connections to this API except the current one'
closeAllConnections.permission = 'admin'
