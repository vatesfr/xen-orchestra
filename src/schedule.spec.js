/* eslint-env mocha */

// Doc: https://github.com/moll/js-must/blob/master/doc/API.md#must
import expect from 'must'

// ===================================================================

import {getMainConnection, getConfig, getVmXoTestPvId} from './util'
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

    jobId = await createJob()
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

  async function createJob () {
    const vmId = await getVmXoTestPvId(xo)
    const id = await xo.call('job.create', {
      job: {
          type: 'call',
          key: 'snapshot',
          method: 'vm.snapshot',
          paramsVector: {
            type: 'cross product',
            items: [
              {
                type: 'set',
                values: [{
                  id: vmId,
                  name: 'snapshot'
                }]
              }
            ]
          }
        }
    })
    return id
  }

  async function createScedule (params) {
    const schedule = await xo.call('schedule.create', params)
    scheduleIds.push(schedule.id)
    return schedule
  }

  async function createSceduleTest () {
    const schedule = await createScedule({
      jobId: jobId,
      cron: '******',
      enabled: false
    })
    return schedule
  }

  async function getSchedule (id) {
    const schedule = xo.call('schedule.get', {id: id})
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
      scheduleId = (await createSceduleTest()).id
    })

    it('gets an existing schedule', async function () {
      const schedule = await xo.call('schedule.get', {id: scheduleId})
      expect(schedule.job).to.be.equal(jobId)
      expect(schedule.cron).to.be.equal('******')
      expect(schedule.enabled).to.be.false()
    })
  })

  // -----------------------------------------------------------------

  describe('.create()', function () {
    it.only('creates a new schedule', async function () {
      const schedule = await createScedule({
        jobId: jobId,
        cron: '******',
        enabled: false
      })
      expect(schedule.job).to.be.equal(jobId)
      expect(schedule.cron).to.be.equal('******')
      expect(schedule.enabled).to.be.false()
    })
  })

  // -----------------------------------------------------------------

  describe('.set()', function () {
    let scheduleId
    before(async function () {
      scheduleId = (await createSceduleTest()).id
    })
    it('modifies an existing schedule', async function () {
      await xo.call('schedule.set', {
        id: scheduleId,
        cron: '2*****'
      })

      const schedule = await getSchedule(scheduleId)
      expect(schedule.cron).to.be.equal('2*****')
    })
  })

  // -----------------------------------------------------------------

  describe('.delete()', function () {
    let scheduleId
    beforeEach(async function () {
      scheduleId = (await createSceduleTest()).id
    })
    it('deletes an existing schedule', async function () {
      await xo.call('schedule.delete', {id: scheduleId})
      await getSchedule(scheduleId).then(
        function () {
          throw new Error('schedule.delete() should have thrown')
        },
        function (error) {
          expect(error.message).to.match(/no such object/)
        }
      )
      scheduleIds = []
    })
  })
})
