'use strict'

function createTransport() {
  const memoryLogger = log => {
    logs.push(log)
  }
  const logs = (memoryLogger.logs = [])
  return memoryLogger
}

module.exports = exports = createTransport
