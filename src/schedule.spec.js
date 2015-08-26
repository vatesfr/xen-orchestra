/* eslint-env mocha */

// Doc: https://github.com/moll/js-must/blob/master/doc/API.md#must
import expect from 'must'

// ===================================================================

import {
  getConfig,
  getMainConnection,
  getSchedule,
  jobTest,
  scheduleTest
} from './util'
import eventToPromise from 'event-to-promise'
import {map} from 'lodash'

// ===================================================================

describe('schedule', function () {
  let xo
  let serverId
  let scheduleIds = []
  let jobId

  before(async function () {
    this.timeout(10e3)
    let config
    ;[xo, config] = await Promise.all([
      getMainConnection(),
      getConfig()
    ])

    serverId = await xo.call('server.add', config.xenServer1).catch(() => {})
    await eventToPromise(xo.objects, 'finish')

    jobId = await jobTest(xo)
  })

  // -----------------------------------------------------------------

  after(async function () {
    await Promise.all([
      xo.call('job.delete', {id: jobId}),
      xo.call('server.remove', {id: serverId})
    ])
  })

  // -----------------------------------------------------------------

  afterEach(async function () {
    await Promise.all(map(
      scheduleIds,
      scheduleId => xo.call('schedule.delete', {id: scheduleId})
    ))
    scheduleIds = []
  })

  // -----------------------------------------------------------------

  async function createSchedule (params) {
    const schedule = await xo.call('schedule.create', params)
    scheduleIds.push(schedule.id)
    return schedule
  }

  async function createScheduleTest () {
    const schedule = await scheduleTest(xo, jobId)
    scheduleIds.push(schedule.id)
    return schedule
  }

  // =================================================================

  describe('.getAll()', function () {
    it('gets all existing schedules', async function () {
      const schedules = await xo.call('schedule.getAll')
      expect(schedules).to.be.an.array()
    })
  })

  // -----------------------------------------------------------------

  describe('.get()', function () {
    let scheduleId
    before(async function () {
      scheduleId = (await createScheduleTest()).id
    })

    it('gets an existing schedule', async function () {
      const schedule = await xo.call('schedule.get', {id: scheduleId})
      expect(schedule.job).to.be.equal(jobId)
      expect(schedule.cron).to.be.equal('* * * * * *')
      expect(schedule.enabled).to.be.false()
    })
  })

  // -----------------------------------------------------------------

  describe('.create()', function () {
    it('creates a new schedule', async function () {
      const schedule = await createSchedule({
        jobId: jobId,
        cron: '* * * * * *',
        enabled: true
      })
      expect(schedule.job).to.be.equal(jobId)
      expect(schedule.cron).to.be.equal('* * * * * *')
      expect(schedule.enabled).to.be.true()
    })
  })

  // -----------------------------------------------------------------

  describe('.set()', function () {
    let scheduleId
    before(async function () {
      scheduleId = (await createScheduleTest()).id
    })
    it('modifies an existing schedule', async function () {
      await xo.call('schedule.set', {
        id: scheduleId,
        cron: '2 * * * * *'
      })

      const schedule = await getSchedule(xo, scheduleId)
      expect(schedule.cron).to.be.equal('2 * * * * *')
    })
  })

  // -----------------------------------------------------------------

  describe('.delete()', function () {
    let scheduleId
    beforeEach(async function () {
      scheduleId = (await createScheduleTest()).id
    })
    it('deletes an existing schedule', async function () {
      await xo.call('schedule.delete', {id: scheduleId})
      await getSchedule(xo, scheduleId).then(
        function () {
          throw new Error('getSchedule() should have thrown')
        },
        function (error) {
          expect(error.message).to.match(/no such object/)
        }
      )
      scheduleIds = []
    })
  })
})
