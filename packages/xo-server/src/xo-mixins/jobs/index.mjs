import asyncMapSettled from '@xen-orchestra/async-map/legacy.js'
import emitAsync from '@xen-orchestra/emit-async'
import { createLogger } from '@xen-orchestra/log'
import { decorateWith } from '@vates/decorate-with'

import { CancelToken, ignoreErrors } from 'promise-toolbox'
import { defer } from 'golike-defer'
import { noSuchObject } from 'xo-common/api-errors.js'

import Collection from '../../collection/redis.mjs'
import patch from '../../patch.mjs'
import { serializeError } from '../../utils.mjs'

import executeCall from './execute-call.mjs'

// ===================================================================

const log = createLogger('xo:jobs')

// -----------------------------------------------------------------------------

class JobsDb extends Collection {
  _serialize(job) {
    Object.keys(job).forEach(key => {
      const value = job[key]
      if (typeof value !== 'string') {
        job[key] = JSON.stringify(job[key])
      }
    })
  }

  _unserialize(job) {
    Object.keys(job).forEach(key => {
      try {
        const value = (job[key] = JSON.parse(job[key]))

        // userId are always strings, even if the value is numeric, which might to
        // them being parsed as numbers.
        //
        // The issue has been introduced by
        // 48b2297bc151df582160be7c1bf1e8ee160320b8.
        if (key === 'userId' && typeof value === 'number') {
          job[key] = String(value)
        }
      } catch (_) {}
    })
  }
}

// -----------------------------------------------------------------------------

export default class Jobs {
  get runningJobs() {
    return this._runningJobs
  }

  constructor(app) {
    this._app = app
    const executors = (this._executors = { __proto__: null })
    this._logger = undefined
    this._runningJobs = { __proto__: null }
    this._runs = { __proto__: null }

    executors.call = executeCall

    app.hooks.on('clean', () => this._jobs.rebuildIndexes())
    app.hooks.on('core started', () => {
      const jobsDb = (this._jobs = new JobsDb({
        connection: app._redis,
        namespace: 'job',
        indexes: ['user_id', 'key'],
      }))

      app.addConfigManager(
        'jobs',
        () => jobsDb.get(),
        jobs => jobsDb.update(jobs),
        ['users']
      )
    })
    app.hooks.on('start', async () => {
      this._logger = await app.getLogger('jobs')
    })
    // it sends a report for the interrupted backup jobs
    app.on('plugins:registered', () =>
      asyncMapSettled(this._jobs.get(), job => {
        // only the interrupted backup jobs have the runId property
        if (job.runId === undefined) {
          return
        }

        app.emit(
          'job:terminated',
          // This cast can be removed after merging the PR: https://github.com/vatesfr/xen-orchestra/pull/3209
          String(job.runId),
          {
            type: job.type,
          }
        )
        return this.updateJob({ id: job.id, runId: null })
      })
    )
  }

  cancelJobRun(id) {
    const run = this._runs[id]
    if (run !== undefined) {
      return run.cancel()
    }
  }

  async getAllJobs(type) {
    const jobs = await this._jobs.get()
    const runningJobs = this._runningJobs
    const result = []
    jobs.forEach(job => {
      if (type === undefined || job.type === type) {
        job.runId = runningJobs[job.id]
        result.push(job)
      }
    })
    return result
  }

  async getJob(id, type) {
    const job = await this._jobs.first(id)
    if (job === undefined || (type !== undefined && job.type !== type)) {
      throw noSuchObject(id, 'job')
    }

    job.runId = this._runningJobs[id]

    return job
  }

  createJob(job) {
    return this._jobs.add(job)
  }

  async updateJob(job, merge = true) {
    if (merge) {
      const { id, ...props } = job
      job = await this.getJob(id)
      patch(job, props)
    }
    await this._jobs.update(job)
  }

  registerJobExecutor(type, executor) {
    const executors = this._executors
    if (type in executors) {
      throw new Error(`there is already a job executor for type ${type}`)
    }
    executors[type] = executor
  }

  async removeJob(id) {
    const promises = [this._jobs.remove(id)]
    ;(await this._app.getAllSchedules()).forEach(schedule => {
      if (schedule.jobId === id) {
        promises.push(this._app.deleteSchedule(schedule.id))
      }
    })
    return Promise.all(promises)
  }

  @decorateWith(defer)
  async _runJob($defer, job, schedule, data_) {
    const logger = this._logger
    const { id, type } = job

    const runJobId = logger.notice(`Starting execution of ${id}.`, {
      data:
        type === 'backup' || type === 'metadataBackup' || type === 'mirrorBackup'
          ? {
              ignoreSkippedBackups: job.settings['']?.ignoreSkippedBackups,
              mode: job.mode,
              reportWhen: job.settings['']?.reportWhen ?? 'failure',
            }
          : undefined,
      event: 'job.start',
      userId: job.userId,
      jobId: id,
      jobName: job.name,
      proxyId: job.proxy,
      scheduleId: schedule?.id,
      key: job.key,
      type,
    })

    const app = this._app
    try {
      let executor = this._executors[type]
      if (executor === undefined) {
        throw new Error(`cannot run job (${id}): no executor for type ${type}`)
      }

      const runningJobs = this._runningJobs

      if (id in runningJobs) {
        throw new Error(`the job (${id}) is already running`)
      }

      // runId is a temporary property used to check if the report is sent after the server interruption
      this.updateJob({ id, runId: runJobId })::ignoreErrors()
      runningJobs[id] = runJobId

      $defer(() => {
        this.updateJob({ id, runId: null })::ignoreErrors()
        delete runningJobs[id]
      })

      if (type === 'backup') {
        const hookData = {
          callId: Math.random().toString(36).slice(2),
          method: 'backupNg.runJob',
          params: {
            id: job.id,
            proxy: job.proxy,
            schedule: schedule?.id,
            settings: job.settings,
            vms: job.vms,
          },
          timestamp: Date.now(),
          userId: job.userId,
          userName:
            (
              await app.getUser(job.userId).catch(error => {
                if (!noSuchObject.is(error)) {
                  throw error
                }
              })
            )?.name ?? '(unknown user)',
        }

        executor = (executor =>
          async function () {
            await emitAsync.call(
              app,
              {
                onError(error) {
                  log.warn('backup:preCall listener failure', { error })
                },
              },
              'backup:preCall',
              hookData
            )

            try {
              const result = await executor.apply(this, arguments)

              // Result of runJobSequence()
              hookData.result = true

              return result
            } catch (error) {
              hookData.error = serializeError(error)

              throw error
            } finally {
              const now = Date.now()
              hookData.duration = now - hookData.timestamp
              hookData.timestamp = now
              app.emit('backup:postCall', hookData)
            }
          })(executor)
      }

      const connection = app.createApiConnection()
      $defer.call(connection, 'close')
      connection.set('user_id', job.userId)

      const { cancel, token } = CancelToken.source()

      const runs = this._runs
      runs[runJobId] = { cancel }
      $defer(() => delete runs[runJobId])

      const status = await executor({
        app,
        cancelToken: token,
        connection,
        data: data_,
        job,
        logger,
        runJobId,
        schedule,
      })

      await logger.notice(
        `Execution terminated for ${job.id}.`,
        {
          event: 'job.end',
          runJobId,
        },
        true
      )

      app.emit('job:terminated', runJobId, { status, type })
    } catch (error) {
      await logger.error(
        `The execution of ${id} has failed.`,
        {
          event: 'job.end',
          runJobId,
          error: serializeError(error),
        },
        true
      )
      app.emit('job:terminated', runJobId, { type })
      throw error
    }
  }

  async runJobSequence(idSequence, schedule, data) {
    const jobs = await Promise.all(idSequence.map(id => this.getJob(id)))

    for (const job of jobs) {
      await this._runJob(job, schedule, data)
    }
  }
}
