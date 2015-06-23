/* eslint-env mocha */

// Doc: https://github.com/moll/js-must/blob/master/doc/API.md#must
import expect from 'must'

// ===================================================================

import {getConnection} from './util'
import {map} from 'lodash'
import eventToPromise from 'event-to-promise'

// ===================================================================

describe('vm', function () {
  let xo
  let vmIds = []
  before(async function () {
    xo = await getConnection()
    await eventToPromise(xo.objects, 'finish')
  })

  afterEach(async function () {
    await Promise.all(map(
      vmIds,
      vmId => xo.call('vm.delete', {id: vmId, delete_disks: true})
    ))
    vmIds = []
  })

  async function createVm (params) {
    const vmId = await xo.call('vm.create', params)
    vmIds.push(vmId)
    return vmId
  }

  // =================================================================

  describe('.create()', function () {
    it('creates a VM with only a name and a template', async function () {
      const vmId = await createVm({
        name_label: 'vmTest',
        template: 'fe7520b8-949b-4864-953e-dbb280d84a57',
        VIFs: []
      })
      const vm = await xo.waitObject(vmId)

      expect(vmId).to.be.a.string()
      expect(vm).to.be.an.object()
    })

    describe('.createHVM()', function () {
      it('creates a VM with the Other Config template, three disks, two interfaces and a ISO mounted, and return its UUID')
      it('creates a VM with the Other Config template, no disk, no network and a ISO mounted, and return its UUID')
    })
    describe('.createPV()', function () {
      it('creates a VM with the Debian 7 64 bits template, network install, one disk, one network, and return its UUID')
      it('creates a VM with the CentOS 7 64 bits template, two disks, two networks and a ISO mounted and return its UUID')
    })
  })

  // ------------------------------------------------------------------

  describe('.delete()', function () {
    it('deletes a VM', async function () {
      const vmId = await createVm({
        name_label: 'vmTest',
        template: 'fe7520b8-949b-4864-953e-dbb280d84a57',
        VIFs: []
      })

      await xo.call('vm.delete', {
        id: vmId,
        delete_disks: true
      })

      const vm = await xo.waitObject(vmId)
      expect(vm).to.be.undefined()
      vmIds = []
    })
  })

  // ------------------------------------------------------------------

  describe('.ejectCd()', function () {
    it('')
  })

  // -------------------------------------------------------------------

  describe('.insertCd()', function () {
    it('')
  })

  // -------------------------------------------------------------------

  describe('.migrate', function () {
    it('migrates the VM on an other host')
  })

  // -------------------------------------------------------------------

  describe('.migratePool()', function () {
    it('migrates the VM on an other host which is in an other pool')
  })

  // -------------------------------------------------------------------

  describe('.set()', function () {
    it('sets a VM name', async function () {
      const vmId = await createVm({
        name_label: 'vmTest',
        template: 'fe7520b8-949b-4864-953e-dbb280d84a57',
        VIFs: []
      })

      await xo.call('vm.set', {
        id: vmId,
        name_label: 'vmRenamed'
      })

      const vm = await xo.waitObject(vmId)
      expect(vm.name_label).to.be.equal('vmRenamed')
    })

    it('sets a VM description', async function () {
      const vmId = await createVm({
        name_label: 'vmTest',
        template: 'fe7520b8-949b-4864-953e-dbb280d84a57',
        VIFs: []
      })
      await xo.call('vm.set', {
        id: vmId,
        name_description: 'description'
      })
      const vm = await xo.waitObject(vmId)
      expect(vm.name_description).to.be.equal('description')
    })

    it('sets a VM CPUs number', async function () {
      const vmId = await createVm({
        name_label: 'vmTest',
        template: 'fe7520b8-949b-4864-953e-dbb280d84a57',
        VIFs: []
      })
      let vm = await xo.waitObject(vmId)
      expect(vm.CPUs.number).to.be.equal(1)

      await xo.call('vm.set', {
        id: vmId,
        CPUs: 2
      })
      vm = await xo.waitObject(vmId)
      expect(vm.CPUs.number).to.be.equal(2)
    })

    it('sets a VM RAM amount', async function () {
      const vmId = await createVm({
        name_label: 'vmTest',
        template: 'fe7520b8-949b-4864-953e-dbb280d84a57',
        VIFs: []
      })

      await xo.call('vm.set', {
        id: vmId,
        memory: 200e6
      })

      const vm = await xo.waitObject(vmId)
      expect(vm.memory.size).to.be.equal(200e6)
    })
  })

  // ---------------------------------------------------------------------

  describe('.start()', function () {
    it.skip('starts a VM', async function () {
      const vmId = await createVm({
        name_label: 'vmTest',
        template: 'fe7520b8-949b-4864-953e-dbb280d84a57',
        VIFs: []
      })
      await xo.call('vm.start', {id: vmId})
      const vm = await xo.waitObject(vmId)
      console.log(vm)
    })
  })

  // ---------------------------------------------------------------------

  describe('.stop()', function () {
    it('stops a VM')
  })

  // ---------------------------------------------------------------------

  describe('.restart()', function () {
    it('restarts a VM')
  })

  // --------------------------------------------------------------------

  describe('.suspend()', function () {
    it('suspends a VM')
  })

  // --------------------------------------------------------------------

  describe('.resume()', function () {
    it('resumes a VM')
  })

  // --------------------------------------------------------------------

  describe('.clone()', function () {
    it('clones a VM', async function () {
      const vmId = await createVm({
        name_label: 'vmTest',
        template: 'fe7520b8-949b-4864-953e-dbb280d84a57',
        VIFs: []
      })
      const cloneId = await xo.call('vm.clone', {
        id: vmId,
        name: 'clone',
        full_copy: true
      })
      vmIds.push(cloneId)

      const vm = await xo.getOrWaitObject(vmId)
      const clone = await xo.getOrWaitObject(cloneId)
      expect(clone.type).to.be.equal('VM')
      expect(clone.name_label).to.be.equal('clone')
      expect(clone.memory).to.be.eql(vm.memory)
      expect(clone.CPUs).to.be.eql(vm.CPUs)
    })
  })

  // --------------------------------------------------------------------

  describe('.convert()', function () {
    it('converts a VM', async function () {
      const vmId = await createVm({
        name_label: 'vmTest',
        template: 'fe7520b8-949b-4864-953e-dbb280d84a57',
        VIFs: []
      })
      await xo.call('vm.convert', {id: vmId})
      const vm = await xo.waitObject(vmId)
      expect(vm.type).to.be.equal('VM-template')
      console.log(vmIds)
    })
  })

  // ---------------------------------------------------------------------

  // TODO : test with a VM with more elements
  describe('.snapshot()', function () {
    it('snapshots a VM and returns its snapshot UUID', async function () {
      const vmId = await createVm({
        name_label: 'vmTest',
        template: 'fe7520b8-949b-4864-953e-dbb280d84a57',
        VIFs: []
      })

      const snapshotId = await xo.call('vm.snapshot', {
        id: vmId,
        name: 'snapshot'
      })

      const vm = await xo.getOrWaitObject(vmId)
      const snapshot = await xo.getOrWaitObject(snapshotId)
      expect(snapshot.type).to.be.equal('VM-snapshot')
      expect(snapshot.name_label).to.be.equal(vm.name_label)
      expect(snapshot.memory).to.be.eql(vm.memory)
      expect(snapshot.CPUs).to.be.eql(vm.CPUs)
    })
  })

  // ---------------------------------------------------------------------

  describe('.revert()', function () {
    it('reverts a snapshot to its parent VM', async function () {
      // test if return true
      const vmId = await createVm({
        name_label: 'vmTest',
        template: 'fe7520b8-949b-4864-953e-dbb280d84a57',
        VIFs: []
      })
      const snapshotId = await xo.call('vm.snapshot', {
        id: vmId,
        name: 'snapshot'
      })
      const revert = await xo.call('vm.revert', {id: snapshotId})
      expect(revert).to.be.true()
    })
  })

  // ---------------------------------------------------------------------

  describe('.handleExport()', function () {
    it('')
  })

  // --------------------------------------------------------------------

  describe('.import()', function () {
    it('')
  })

  // ---------------------------------------------------------------------

  describe('.attachDisk()', function () {
    it('')
  })

  // ---------------------------------------------------------------------

  describe('.createInterface()', function () {
    it('')
  })

  // ---------------------------------------------------------------------

  describe('.attachPci()', function () {
    it('')
  })

  // ---------------------------------------------------------------------

  describe('.detachPci()', function () {
    it('')
  })

  // ---------------------------------------------------------------------

  describe('.stats()', function () {
    it.skip('returns an array with statistics of the VM', async function () {
      const vmId = await createVm({
        name_label: 'vmTest',
        template: 'fe7520b8-949b-4864-953e-dbb280d84a57',
        VIFs: []
      })
      const stats = await xo.call('vm.stats', {id: vmId})
      // expect(stats).to.be.an.object()
      console.log(stats)
    })
  })

  // ---------------------------------------------------------------------
  describe('.bootOrder()', function () {
    it('')
  })
})
