// it handles `@xen-orchestra/backups/Task#run` logs
export const handleBackupLog = (log, { logger, localTaskIds, handleRootTaskId }) => {
  const { event, message, taskId } = log

  const common = {
    data: log.data,
    event: 'task.' + event,
    result: log.result,
    status: log.status,
  }

  if (event === 'start') {
    const { parentId } = log
    if (parentId === undefined) {
      handleRootTaskId((localTaskIds[taskId] = logger.notice(message, common)))
    } else {
      common.parentId = localTaskIds[parentId]
      localTaskIds[taskId] = logger.notice(message, common)
    }
  } else {
    common.taskId = localTaskIds[taskId]
    logger.notice(message, common)
  }
}
