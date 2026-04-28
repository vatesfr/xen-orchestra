import { asyncMap } from '@xen-orchestra/async-map'
import { createLogger } from '@xen-orchestra/log'
import { Task } from '@vates/task'

const { debug, warn } = createLogger('xo:backups:AbstractVmRunner')

class AggregateError extends Error {
  constructor(errors, message) {
    super(message)
    this.errors = errors
  }
}

const asyncEach = async (iterable, fn, thisArg = iterable) => {
  for (const item of iterable) {
    await fn.call(thisArg, item)
  }
}

export const Abstract = class AbstractVmBackupRunner {
  // calls fn for each function, warns of any errors, and throws only if there are no writers left
  async _callWriters(fn, step, parallel = true) {
    const writers = this._writers
    const n = writers.size
    if (n === 0) {
      return
    }

    async function callWriter(writer) {
      const { name } = writer.constructor
      try {
        debug('writer step starting', { step, writer: name })
        await fn(writer)
        debug('writer step succeeded', { duration: step, writer: name })
      } catch (error) {
        writers.delete(writer)

        warn('writer step failed', { error, step, writer: name })

        // these two steps are the only one that are not already in their own sub tasks
        if (step === 'writer.checkBaseVdis()' || step === 'writer.beforeBackup()') {
          Task.warning(
            `the writer ${name} has failed the step ${step} with error ${error.message}. It won't be used anymore in this job execution.`
          )
        }

        throw error
      }
    }
    if (n === 1) {
      const [writer] = writers
      return callWriter(writer)
    }

    const errors = []
    await (parallel ? asyncMap : asyncEach)(writers, async function (writer) {
      try {
        await callWriter(writer)
      } catch (error) {
        errors.push(error)
      }
    })
    if (writers.size === 0) {
      throw new AggregateError(errors, 'all targets have failed, step: ' + step)
    }
  }

  async _healthCheck() {
    const settings = this._settings

    if (this._healthCheckSr === undefined) {
      return
    }

    // check if current VM has tags
    const tags = this._tags

    // accept both 'xo:no-health-check' and 'xo:no-health-check=reason'
    const vmAlwaysIgnored = tags.some(t => t.startsWith('xo:no-health-check'))
    const intersect = !vmAlwaysIgnored && settings.healthCheckVmsWithTags.some(t => tags.includes(t))

    if (vmAlwaysIgnored || (settings.healthCheckVmsWithTags.length !== 0 && !intersect)) {
      // create a task to have an info in the logs and reports
      return Task.run(
        {
          properties: { name: 'health check' },
        },
        () => {
          Task.info(`This VM doesn't match the health check's tags for this schedule`)
        }
      )
    }

    await this._callWriters(writer => writer.healthCheck(), 'writer.healthCheck()')
  }
}
