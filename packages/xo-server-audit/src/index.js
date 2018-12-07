import { forOwn } from 'lodash'

import { compileGlobPattern } from './utils'

const NAMESPACE = 'audit'

export const configurationSchema = {
  type: 'object',

  properties: {
    enabled: {
      type: 'boolean',
      description: 'If off, the plugin will not log the users actions.',
    },
  },
}

class AuditXoPlugin {
  constructor({ xo }) {
    this._xo = xo
    this._removeApiMethod = undefined
    this._conf = undefined
    this._runningTasks = new Set()
    this._listeners = {
      'xo:preCall': this._logTaskStart.bind(this),
      'xo:postCall': this._logTaskEnd.bind(this),
    }
    this._MethodsToNotLogRegExp = compileGlobPattern(
      this._xo._config.methodsPattern
    )

    xo.getLogger(NAMESPACE).then(logger => {
      this._logger = logger
    })
  }

  configure(conf) {
    this._conf = conf
  }

  load() {
    const xo = this._xo

    this._removeApiMethod = xo.addApiMethod(
      'plugin.audit.getLogs',
      this._getLogs.bind(this)
    )

    // add listeners
    forOwn(this._listeners, (method, event) => this._xo.on(event, method))
  }

  unload() {
    this._runningTasks.clear()
    this._removeApiMethod()

    // remove listeners
    forOwn(this._listeners, (method, event) =>
      this._xo.removeListener(event, method)
    )
  }

  // data: { userId, method, params, callId }
  _logTaskStart(data) {
    const { callId, method, params } = data
    if (
      !this._conf.enabled ||
      (method === 'plugin.unload' && params.id === 'audit') ||
      this._MethodsToNotLogRegExp.test(method)
    ) {
      return
    }

    this._runningTasks.add(callId)
    this._logger.notice(`Audit log (${callId})`, {
      event: 'task.start',
      data,
    })
  }

  async _logTaskEnd({ callId: taskId, error, result = error }) {
    const runningTasks = this._runningTasks
    if (!runningTasks.has(taskId)) {
      return
    }

    const [status, loggerLevel] =
      error !== undefined ? ['failure', 'error'] : ['success', 'notice']

    runningTasks.delete(taskId)
    this._logger[loggerLevel](`Audit log (${taskId})`, {
      event: 'task.end',
      result,
      status,
      taskId,
    })
  }

  async _getLogs() {
    const logs = {}
    forOwn(await this._xo.getLogs(NAMESPACE), ({ data, time }) => {
      if (data.event === 'task.start') {
        const { callId } = data.data
        logs[callId] = {
          ...data.data,
          start: time,
          status: this._runningTasks.has(callId) ? 'pending' : 'interrupted',
        }
        return
      }

      const log = logs[data.taskId]
      log.result = data.result
      log.status = data.status
      log.end = time
    })
    return logs
  }
}

export default opts => new AuditXoPlugin(opts)
