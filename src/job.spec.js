/* eslint-env mocha */

// Doc: https://github.com/moll/js-must/blob/master/doc/API.md#must
import expect from 'must'

// ===================================================================

import {getConfig, getMainConnection, getVmXoTestPvId} from './util'
import {map, find} from 'lodash'
import eventToPromise from 'event-to-promise'

// ===================================================================

describe('job', function () {

  let xo
  let serverId
  let vmId
  let jobIds = []

  before(async function () {
    this.timeout(10e3)
    let config
    ;[xo, config] = await Promise.all([
      getMainConnection(),
      getConfig()
    ])

    serverId = await xo.call('server.add', config.xenServer1).catch(() => {})
    await eventToPromise(xo.objects, 'finish')

    vmId = await getVmXoTestPvId(xo)
  })

  // -----------------------------------------------------------------

  after(async function () {
    await xo.call('server.remove', {id: serverId})
  })

  // -----------------------------------------------------------------

  afterEach(async function () {
    await Promise.all(map(
      jobIds,
      jobId => xo.call('job.delete', {id: jobId})
    ))

    jobIds = []
  })

  // -----------------------------------------------------------------

  async function createJob (params) {
    const jobId = await xo.call('job.create', params)
    jobIds.push(jobId)
    return jobId
  }

  async function createJobTest () {
    const id = await createJob({
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

  async function getJob (id) {
    // const job = await xo.call('job.get', {id: id})
    const jobs = await xo.call('job.getAll')
    const job = find(jobs, {id: id})
    return job
  }

// ===================================================================

  describe('.getAll()', function () {
    it('gets all available jobs', async function () {
      const jobs = await xo.call('job.getAll')
      expect(jobs).to.be.an.array()
    })
  })

  // -----------------------------------------------------------------

  describe('.get()', function () {
    let jobId
    beforeEach(async function() {
      jobId = await createJobTest()
    })

    it('gets an existing job', async function () {
      const job = await xo.call('job.get', {id: jobId})

      expect(job.method).to.be.equal('vm.snapshot')
      expect(job.type).to.be.equal('call')
      expect(job.key).to.be.equal('snapshot')
      expect(job.paramsVector.type).to.be.equal('cross product')
    })
  })

  // -----------------------------------------------------------------

  describe('.create()', function () {
    it('creates a new job', async function () {
      const jobId = await createJob({
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

      const job = await getJob(jobId)
      expect(job.method).to.be.equal('vm.snapshot')
      expect(job.type).to.be.equal('call')
      expect(job.key).to.be.equal('snapshot')
      expect(job.paramsVector.type).to.be.equal('cross product')
    })
  })

  // -----------------------------------------------------------------

  describe('.set()', function () {
    let jobId
    beforeEach(async function () {
      jobId = createJobTest()
    })
    it.only('modifies an existing job', async function () {
      await xo.call('job.set', {
        job: {
          id: jobId,
          type: 'call',
          key: 'snapshot',
          method: 'vm.clone',
          paramsVector: {
            type: 'cross product',
            items: [
              {
                type: 'set',
                values: [{
                  id: vmId,
                  name: 'clone',
                  full_copy: true
                }]
              }
            ]
          }
        }
      })

      const job = await getJob(jobId)
      expect(job.method).to.be.equal('vm.clone')
    })
  })

  // -----------------------------------------------------------------

  describe('.delete()', function () {
    let jobId
    beforeEach(async function () {
      jobId = await createJobTest()
    })
    it('delete an existing job', async function () {
      await xo.call('job.delete', {id: jobId})
      const job = await getJob(jobId)
      expect(job).to.be.undefined()
      jobIds = []
    })
  })
})
