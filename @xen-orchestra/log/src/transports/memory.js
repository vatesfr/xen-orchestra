export default () => {
  const memoryLogger = log => {
    logs.push(log)
  }
  const logs = (memoryLogger.logs = [])
  return memoryLogger
}
