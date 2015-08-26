/* eslint-env mocha */

// Doc: https://github.com/moll/js-must/blob/master/doc/API.md#must
import expect from 'must'

// ===================================================================

import {jobTest, scheduleTest, getConfig, getMainConnection, getSchedule} from './util'
import eventToPromise from 'event-to-promise'

// ===================================================================

describe('scheduler', function () {

  let xo
  let serverId
  let jobId
  let scheduleId

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
    scheduleId = (await scheduleTest(xo, jobId)).id
  })

  // -----------------------------------------------------------------

  after(async function () {
    await Promise.all([
      xo.call('schedule.delete', {id: scheduleId}),
      xo.call('job.delete', {id: jobId}),
      xo.call('server.remove', {id: serverId})
    ])
  })

  // =================================================================

  describe('.enable()', function () {
    afterEach(async function () {
      await xo.call('scheduler.disable', {id: scheduleId})
    })
    it.skip('enables a schedule to run it\'s job as scheduled', async function () {
      await xo.call('scheduler.enable', {id: scheduleId})
      const schedule = await getSchedule(xo, scheduleId)
      expect(schedule.enabled).to.be.true()
    })
  })

  // -----------------------------------------------------------------

  describe('.disable()', function () {
    beforeEach(async function () {
      await xo.call('schedule.enable', {id: scheduleId})
    })
    it.skip('disables a schedule', async function () {
      await xo.call('schedule.disable', {id: scheduleId})
      const schedule = await getSchedule(xo, scheduleId)
      expect(schedule.enabled).to.be.false()
    })
  })

  // -----------------------------------------------------------------

  describe('.getScheduleTable()', function () {
    it('get a map of existing schedules', async function () {
      const table = await xo.call('scheduler.getScheduleTable')
      expect(table).to.be.an.object()
      expect(table).to.match(scheduleId)
    })
  })
})
