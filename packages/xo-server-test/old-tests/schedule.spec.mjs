/* eslint-env jest */

// Doc: https://github.com/moll/js-must/blob/master/doc/API.md#must
// eslint-disable-next-line n/no-missing-import
import expect from 'must'

// ===================================================================

import fromEvent from 'promise-toolbox/fromEvent'
// eslint-disable-next-line n/no-missing-import
import { getConfig, getMainConnection, getSchedule, jobTest, scheduleTest } from './util'
import map from 'lodash/map.js'

// ===================================================================

describe('schedule', () => {
  let xo
  let serverId
  let scheduleIds = []
  let jobId

  beforeAll(async () => {
    jest.setTimeout(10e3)
    let config
    ;[xo, config] = await Promise.all([getMainConnection(), getConfig()])

    serverId = await xo.call('server.add', config.xenServer1).catch(() => {})
    await fromEvent(xo.objects, 'finish')

    jobId = await jobTest(xo)
  })

  // -----------------------------------------------------------------

  afterAll(async () => {
    await Promise.all([xo.call('job.delete', { id: jobId }), xo.call('server.remove', { id: serverId })])
  })

  // -----------------------------------------------------------------

  afterEach(async () => {
    await Promise.all(map(scheduleIds, scheduleId => xo.call('schedule.delete', { id: scheduleId })))
    scheduleIds = []
  })

  // -----------------------------------------------------------------

  async function createSchedule(params) {
    const schedule = await xo.call('schedule.create', params)
    scheduleIds.push(schedule.id)
    return schedule
  }

  async function createScheduleTest() {
    const schedule = await scheduleTest(xo, jobId)
    scheduleIds.push(schedule.id)
    return schedule
  }

  // =================================================================

  describe('.getAll()', () => {
    it('gets all existing schedules', async () => {
      const schedules = await xo.call('schedule.getAll')
      expect(schedules).to.be.an.array()
    })
  })

  // -----------------------------------------------------------------

  describe('.get()', () => {
    let scheduleId
    beforeAll(async () => {
      scheduleId = (await createScheduleTest()).id
    })

    it('gets an existing schedule', async () => {
      const schedule = await xo.call('schedule.get', { id: scheduleId })
      expect(schedule.job).to.be.equal(jobId)
      expect(schedule.cron).to.be.equal('* * * * * *')
      expect(schedule.enabled).to.be.false()
    })
  })

  // -----------------------------------------------------------------

  describe('.create()', () => {
    it('creates a new schedule', async () => {
      const schedule = await createSchedule({
        jobId,
        cron: '* * * * * *',
        enabled: true,
      })
      expect(schedule.job).to.be.equal(jobId)
      expect(schedule.cron).to.be.equal('* * * * * *')
      expect(schedule.enabled).to.be.true()
    })
  })

  // -----------------------------------------------------------------

  describe('.set()', () => {
    let scheduleId
    beforeAll(async () => {
      scheduleId = (await createScheduleTest()).id
    })
    it('modifies an existing schedule', async () => {
      await xo.call('schedule.set', {
        id: scheduleId,
        cron: '2 * * * * *',
      })

      const schedule = await getSchedule(xo, scheduleId)
      expect(schedule.cron).to.be.equal('2 * * * * *')
    })
  })

  // -----------------------------------------------------------------

  describe('.delete()', () => {
    let scheduleId
    beforeEach(async () => {
      scheduleId = (await createScheduleTest()).id
    })
    it('deletes an existing schedule', async () => {
      await xo.call('schedule.delete', { id: scheduleId })
      await getSchedule(xo, scheduleId).then(
        () => {
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
