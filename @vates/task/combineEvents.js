'use strict'

const assert = require('node:assert').strict

const noop = Function.prototype

exports.makeOnProgress = function ({ onRootTaskEnd = noop, onRootTaskStart = noop, onTaskUpdate = noop }) {
  const taskLogs = new Map()
  return function onProgress(event) {
    const { id, type } = event
    let taskLog
    if (type === 'start') {
      taskLog = {
        id,
        properties: { __proto__: null, ...event.properties },
        start: event.timestamp,
        status: 'pending',
      }
      taskLogs.set(id, taskLog)

      const { parentId } = event
      if (parentId === undefined) {
        Object.defineProperty(taskLog, '$root', { value: taskLog })

        // start of a root task
        onRootTaskStart(taskLog)
      } else {
        // start of a subtask
        const parent = taskLogs.get(parentId)
        assert.notEqual(parent, undefined)

        // inject a (non-enumerable) reference to the parent and the root task
        Object.defineProperties(taskLog, { $parent: { value: parent }, $root: { value: parent.$root } })
        ;(parent.tasks ?? (parent.tasks = [])).push(taskLog)
      }
    } else {
      taskLog = taskLogs.get(id)
      assert.notEqual(taskLog, undefined)

      if (type === 'info' || type === 'warning') {
        const key = type + 's'
        const { data, message } = event
        ;(taskLog[key] ?? (taskLog[key] = [])).push({ data, message })
      } else if (type === 'property') {
        ;(taskLog.properties ?? (taskLog.properties = { __proto__: null }))[event.name] = event.value
      } else if (type === 'end') {
        taskLogs.delete(id)

        taskLog.end = event.timestamp
        taskLog.result = event.result
        taskLog.status = event.status
      } else if (type === 'abortionRequested') {
        taskLog.abortionRequestedAt = event.timestamp
      }

      if (type === 'end' && taskLog.$root === taskLog) {
        onRootTaskEnd(taskLog)
      }
    }

    onTaskUpdate(taskLog)
  }
}
