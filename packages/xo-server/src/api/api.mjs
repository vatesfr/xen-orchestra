const extractData = _ => _._data

export function getConnections() {
  return Array.from(this.apiConnections, extractData)
}

getConnections.description = 'Get a list of all current connections to this API'
getConnections.permission = 'admin'

export function closeAllConnections() {
  for (const connection of this.apiConnections) {
    if (connection !== this.connection) {
      connection.close()
    }
  }
}

closeAllConnections.description = 'Close all connections to this API except the current one'
closeAllConnections.permission = 'admin'
