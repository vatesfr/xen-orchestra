import asyncMapSettled from '@xen-orchestra/async-map/legacy.js'
import keyBy from 'lodash/keyBy.js'
import { createSchedule } from '@xen-orchestra/cron'
import { ignoreErrors } from 'promise-toolbox'
import { noSuchObject } from 'xo-common/api-errors.js'

import Collection from '../collection/redis.mjs'
import patch from '../patch.mjs'

const normalize = schedule => {
  const { enabled } = schedule
  if (typeof enabled !== 'boolean') {
    schedule.enabled = enabled === 'true'
  }
  if ('job' in schedule) {
    schedule.jobId = schedule.job
    delete schedule.job
  }
  return schedule
}

class Schedules extends Collection {
  async get(properties) {
    const schedules = await super.get(properties)
    schedules.forEach(normalize)
    return schedules
  }
}

export default class Scheduling {
  constructor(app) {
    this._app = app

    const db = (this._db = new Schedules({
      connection: app._redis,
      namespace: 'schedule',
    }))

    this._runs = { __proto__: null }

    app.hooks.on('clean', async () => {
      const [jobsById, schedules] = await Promise.all([
        app.getAllJobs().then(_ => keyBy(_, 'id')),
        app.getAllSchedules(),
      ])

      await db.remove(schedules.filter(_ => !(_.jobId in jobsById)).map(_ => _.id))

      return db.rebuildIndexes()
    })
    app.hooks.on('start', async () => {
      app.addConfigManager(
        'schedules',
        () => db.get(),
        schedules =>
          asyncMapSettled(schedules, async schedule => {
            await db.update(normalize(schedule))
            this._start(schedule.id)
          }),
        ['jobs']
      )

      const schedules = await this.getAllSchedules()
      schedules.forEach(schedule => this._start(schedule))
    })
    app.hooks.on('stop', () => {
      const runs = this._runs
      Object.keys(runs).forEach(id => {
        runs[id]()
        delete runs[id]
      })
    })
  }

  async createSchedule({ cron, enabled, jobId, name = '', timezone, userId }) {
    const schedule = await this._db.add({
      cron,
      enabled,
      jobId,
      name,
      timezone,
      userId,
    })
    this._start(schedule)
    return schedule
  }

  async getSchedule(id) {
    const schedule = await this._db.first(id)
    if (schedule === undefined) {
      throw noSuchObject(id, 'schedule')
    }
    return schedule
  }

  async getAllSchedules() {
    return await this._db.get()
  }

  async deleteSchedule(id) {
    this._stop(id)
    await this._db.remove(id)
  }

  async updateSchedule({ cron, enabled, id, jobId, name, timezone, userId }) {
    const schedule = await this.getSchedule(id)
    patch(schedule, {
      cron,
      enabled,
      jobId,
      name,
      timezone,
      userId,
    })

    this._start(schedule)

    await this._db.update(schedule)
  }

  _start(schedule) {
    const { id } = schedule

    this._stop(id)

    if (schedule.enabled) {
      this._runs[id] = createSchedule(schedule.cron, schedule.timezone).startJob(() => {
        ignoreErrors.call(this._app.runJobSequence([schedule.jobId], schedule))
      })
    }
  }

  _stop(id) {
    const runs = this._runs
    if (id in runs) {
      runs[id]()
      delete runs[id]
    }
  }
}
