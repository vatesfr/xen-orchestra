// @flow

import asyncMap from '@xen-orchestra/async-map'
import { createSchedule } from '@xen-orchestra/cron'
import { ignoreErrors } from 'promise-toolbox'
import { keyBy } from 'lodash'
import { noSuchObject } from 'xo-common/api-errors'

import Collection from '../collection/redis'
import patch from '../patch'

export type Schedule = {|
  cron: string,
  enabled: boolean,
  id: string,
  jobId: string,
  name: string,
  timezone?: string,
  userId: string,
|}

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
  _app: any
  _db: {|
    add: Function,
    first: Function,
    get: Function,
    remove: Function,
    update: Function,
  |}
  _runs: { __proto__: null, [string]: () => void }

  constructor(app: any) {
    this._app = app

    const db = (this._db = new Schedules({
      connection: app._redis,
      prefix: 'xo:schedule',
    }))

    this._runs = { __proto__: null }

    app.on('clean', async () => {
      const [jobsById, schedules] = await Promise.all([
        app.getAllJobs().then(_ => keyBy(_, 'id')),
        app.getAllSchedules(),
      ])

      await db.remove(schedules.filter(_ => !(_.jobId in jobsById)).map(_ => _.id))

      return db.rebuildIndexes()
    })
    app.on('start', async () => {
      app.addConfigManager(
        'schedules',
        () => db.get(),
        schedules =>
          asyncMap(schedules, async schedule => {
            await db.update(normalize(schedule))
            this._start(schedule.id)
          }),
        ['jobs']
      )

      const schedules = await this.getAllSchedules()
      schedules.forEach(schedule => this._start(schedule))
    })
    app.on('stop', () => {
      const runs = this._runs
      Object.keys(runs).forEach(id => {
        runs[id]()
        delete runs[id]
      })
    })
  }

  async createSchedule({ cron, enabled, jobId, name = '', timezone, userId }: $Diff<Schedule, {| id: string |}>) {
    const schedule = (
      await this._db.add({
        cron,
        enabled,
        jobId,
        name,
        timezone,
        userId,
      })
    ).properties
    this._start(schedule)
    return schedule
  }

  async getSchedule(id: string): Promise<Schedule> {
    const schedule = await this._db.first(id)
    if (schedule === undefined) {
      throw noSuchObject(id, 'schedule')
    }
    return schedule.properties
  }

  async getAllSchedules(): Promise<Array<Schedule>> {
    return this._db.get()
  }

  async deleteSchedule(id: string) {
    this._stop(id)
    await this._db.remove(id)
  }

  async updateSchedule({ cron, enabled, id, jobId, name, timezone, userId }: $Shape<Schedule>) {
    const schedule = await this.getSchedule(id)
    patch(schedule, { cron, enabled, jobId, name, timezone, userId })

    this._start(schedule)

    await this._db.update(schedule)
  }

  _start(schedule: Schedule) {
    const { id } = schedule

    this._stop(id)

    if (schedule.enabled) {
      this._runs[id] = createSchedule(schedule.cron, schedule.timezone).startJob(() => {
        ignoreErrors.call(this._app.runJobSequence([schedule.jobId], schedule))
      })
    }
  }

  _stop(id: string) {
    const runs = this._runs
    if (id in runs) {
      runs[id]()
      delete runs[id]
    }
  }
}
