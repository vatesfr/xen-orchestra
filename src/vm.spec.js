/* eslint-env mocha */

// Doc: https://github.com/moll/js-must/blob/master/doc/API.md#must
import expect from 'must'

// ===================================================================

import {getConnection, almostEqual, getConfig, getOneHost, waitObjectState} from './util'
import {map, find} from 'lodash'
import eventToPromise from 'event-to-promise'

// ===================================================================

describe('vm', function () {
  let xo
  let vmId
  let vmIds = []
  let serverId

  // ----------------------------------------------------------------------

  before(async function () {
    this.timeout(30e3)
    xo = await getConnection()

    const config = await getConfig()
    serverId = await xo.call('server.add', config.xenServer1).catch(() => {})

    await eventToPromise(xo.objects, 'finish')
  })

  // ----------------------------------------------------------------------

  afterEach(async function () {
    await Promise.all(map(
      vmIds,
      vmId => xo.call('vm.delete', {id: vmId, delete_disks: true})
    ))
    vmIds = []
  })

  // ---------------------------------------------------------------------

  after(async function () {
    await xo.call('server.remove', {
      id: serverId
    })
  })

  // ---------------------------------------------------------------------

  async function createVm (params) {
    const vmId = await xo.call('vm.create', params)
    vmIds.push(vmId)
    return vmId
  }

  // =================================================================

  describe('.create()', function () {
    it('creates a VM with only a name and a template', async function () {
      vmId = await createVm({
        name_label: 'vmTest',
        template: 'fe7520b8-949b-4864-953e-dbb280d84a57',
        VIFs: []
      })
      await waitObjectState(xo, vmId, vm => {
        expect(vm.id).to.be.a.string()
        expect(vm).to.be.an.object()
      })
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
    let snapshotIds = []
    beforeEach(async function () {
      vmId = await createVm({
        name_label: 'vmTest',
        template: 'fe7520b8-949b-4864-953e-dbb280d84a57',
        VIFs: []
      })
    })
    after(async function () {
      await Promise.all(map(
        snapshotIds,
        snapshotId => xo.call('vm.delete', {id: snapshotId})
      ))
      snapshotIds = []
    })

    it('deletes a VM', async function () {
      await xo.call('vm.delete', {
        id: vmId,
        delete_disks: true
      })

      await waitObjectState(xo, vmId, vm => {
        expect(vm).to.be.undefined()
      })
      vmIds = []
    })

    it.only('delete a VM and its snapshots', async function () {
      const snapshotId = await xo.call('vm.snapshot', {
        id: vmId,
        name: 'snapshot'
      })
      snapshotIds.push(snapshotId)

      await xo.call('vm.delete', {
        id: vmId,
        delete_disks: true
      })

      vmIds = []

      await waitObjectState(xo, snapshotId, snapshot => {
        expect(snapshot).to.be.undefined()
      })

      snapshotIds = []
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
    beforeEach(async function () {
      vmId = await createVm({
        name_label: 'vmTest',
        template: 'fe7520b8-949b-4864-953e-dbb280d84a57',
        VIFs: []
      })
    })
    it('sets a VM name', async function () {
      await xo.call('vm.set', {
        id: vmId,
        name_label: 'vmRenamed'
      })

      await waitObjectState(xo, vmId, vm => {
        expect(vm.name_label).to.be.equal('vmRenamed')
      })
    })

    it('sets a VM description', async function () {
      await xo.call('vm.set', {
        id: vmId,
        name_description: 'description'
      })
      await waitObjectState(xo, vmId, vm => {
        expect(vm.name_description).to.be.equal('description')
      })
    })

    it('sets a VM CPUs number', async function () {
      await waitObjectState(xo, vmId, vm => {
        expect(vm.CPUs.number).to.be.equal(1)
      })

      await xo.call('vm.set', {
        id: vmId,
        CPUs: 2
      })
      await waitObjectState(xo, vmId, vm => {
        expect(vm.CPUs.number).to.be.equal(2)
      })
    })

    it('sets a VM RAM amount', async function () {
      await xo.call('vm.set', {
        id: vmId,
        memory: 200e6
      })

      await waitObjectState(xo, vmId, vm => {
        expect(vm.memory.size).to.be.equal(200e6)
      })
    })
  })

  // ---------------------------------------------------------------------

  describe('.start()', function () {
    beforeEach(async function () {
      const templates = xo.objects.indexes.type['VM-template']
      const template = find(templates, {name_label: 'Other install media'})
      vmId = await createVm({
        name_label: 'vmTest',
        template: template.id,
        VIFs: []
      })
    })
    afterEach(async function () {
      await xo.call('vm.stop', {
        id: vmId,
        force: true
      })
    })

    it.skip('starts a VM', async function () {
      await xo.call('vm.start', {id: vmId})
      await waitObjectState(xo, vmId, vm => {
        expect(vm.power_state).to.be.equal('Running')
      })
    })
  })

  // ---------------------------------------------------------------------

  describe('.stop()', function () {
    beforeEach(async function () {
      const templates = xo.objects.indexes.type['VM-template']
      const template = find(templates, {name_label: 'Other install media'})
      vmId = await createVm({
        name_label: 'vmTest',
        template: template.id,
        VIFs: []
      })
      await xo.call('vm.start', {id: vmId})
    })

    it.skip('stops a VM (clean shutdown)', async function () {
      await xo.call('vm.stop', {id: vmId})
      await waitObjectState(xo, vmId, vm => {
        expect(vm.power_state).to.be.equal('Halted')
      })
    })

    it('stops a VM (hard shutdown)', async function () {
      await xo.call('vm.stop', {
        id: vmId,
        force: true
      })
      await waitObjectState(xo, vmId, vm => {
        expect(vm.power_state).to.be.equal('Halted')
      })
    })
  })

  // ---------------------------------------------------------------------

  describe('.restart()', function () {
    beforeEach(async function () {
      const templates = xo.objects.indexes.type['VM-template']
      const template = find(templates, {name_label: 'Other install media'})
      vmId = await createVm({
        name_label: 'vmTest',
        template: template.id,
        VIFs: []
      })
      await xo.call('vm.start', {id: vmId})
    })
    afterEach(async function () {
      await xo.call('vm.stop', {
        id: vmId,
        force: true
      })
    })

    it.skip('restarts a VM (clean reboot)', async function () {
      await xo.call('vm.restart', {
        id: vmId,
        force: false})
      await waitObjectState(xo, vmId, vm => {
        expect(vm.power_state).to.be.equal('Halted')
      })
      await waitObjectState(xo, vmId, vm => {
        expect(vm.power_state).to.be.equal('Running')
      })
    })

    it.skip('restarts a VM (hard reboot)', async function () {
      await xo.call('vm.restart', {
        id: vmId,
        force: true})
      await waitObjectState(xo, vmId, vm => {
        expect(vm.power_state).to.be.equal('Halted')
      })
      await waitObjectState(xo, vmId, vm => {
        expect(vm.power_state).to.be.equal('Running')
      })
    })
  })

  // --------------------------------------------------------------------

  describe('.suspend()', function () {
    beforeEach(async function() {
      const templates = xo.objects.indexes.type['VM-template']
      const template = find(templates, {name_label: 'Other install media'})
      vmId = await createVm({
        name_label: 'vmTest',
        template: template.id,
        VIFs: []
      })
      console.log(1)
      await xo.call('vm.start', {id: vmId})
      console.log(2)
    })
    afterEach(async function () {
      await xo.call('vm.stop', {
        id: vmId,
        force: true
      })
    })

    it.skip('suspends a VM', async function() {
      await xo.call('vm.suspend', {id: vmId})
      const vm = await xo.waitObject(vmId)
      console.log(vm)
    })
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
      // push cloneId in vmIds array to delete the VM after test
      vmIds.push(cloneId)

      const vm = await xo.getOrWaitObject(vmId)
      const clone = await xo.getOrWaitObject(cloneId)
      expect(clone.type).to.be.equal('VM')
      expect(clone.name_label).to.be.equal('clone')

      almostEqual(clone, vm, [
        'name_label',
        'ref',
        'id',
        'other.mac_seed'
      ])
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
      await waitObjectState(xo, vmId, vm => {
        expect(vm.type).to.be.equal('VM-template')
      })
    })
  })

  // ---------------------------------------------------------------------

  // TODO : test with a VM with more elements
  // TODO : delete a VM must delete its snapshots
  describe('.snapshot()', function () {
    let snapshotId
    afterEach(async function () {
      await xo.call('vm.delete', {id: snapshotId})
    })
    it('snapshots a VM and returns its snapshot UUID', async function () {
      const vmId = await createVm({
        name_label: 'vmTest',
        template: 'fe7520b8-949b-4864-953e-dbb280d84a57',
        VIFs: []
      })

      snapshotId = await xo.call('vm.snapshot', {
        id: vmId,
        name: 'snapshot'
      })

      const vm = await xo.getOrWaitObject(vmId)
      const snapshot = await xo.getOrWaitObject(snapshotId)
      expect(snapshot.type).to.be.equal('VM-snapshot')
      almostEqual(snapshot, vm, [
        'id',
        'type',
        'ref',
        'snapshot_time',
        'snapshots',
        '$snapshot_of'
      ])
    })
  })

  // ---------------------------------------------------------------------
  // TODO : delete a VM must delete its snapshots
  describe('.revert()', function () {
    let snapshotId
    afterEach(async function () {
      await xo.call('vm.delete', {id: snapshotId})
    })
    it('reverts a snapshot to its parent VM', async function () {
      // test if return true
      const vmId = await createVm({
        name_label: 'vmTest',
        template: 'fe7520b8-949b-4864-953e-dbb280d84a57',
        VIFs: []
      })
      snapshotId = await xo.call('vm.snapshot', {
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
    this.timeout(30e3)
    it('attaches the disk to the VM with attributes by default', async function () {
      const vmId = await createVm({
        name_label: 'vmTest',
        template: 'fe7520b8-949b-4864-953e-dbb280d84a57',
        VIFs: []
      })

      const host = getOneHost(xo)
      const pool = await xo.getOrWaitObject(host.$poolId)
      const diskId = await xo.call('disk.create', {
        name: 'diskTest',
        size: '1GB',
        sr: pool.default_SR
      })

      await xo.call('vm.attachDisk', {
        vm: vmId,
        vdi: diskId
      })
      const vm = await xo.waitObject(vmId)
      await waitObjectState(xo, diskId, disk => {
        expect(disk.$VBDs).to.be.eql(vm.$VBDs)
      })

      await waitObjectState(xo, vm.$VBDs, vbd => {
        expect(vbd.type).to.be.equal('VBD')
        // expect(vbd.attached).to.be.true()
        expect(vbd.bootable).to.be.false()
        expect(vbd.is_cd_drive).to.be.false()
        expect(vbd.position).to.be.equal('0')
        expect(vbd.read_only).to.be.false()
        expect(vbd.VDI).to.be.equal(diskId)
        expect(vbd.VM).to.be.equal(vmId)
        expect(vbd.$poolId).to.be.equal(vm.$poolId)
      })
    })

    it('attaches the disk to the VM with specified attributes', async function () {
      const vmId = await createVm({
        name_label: 'vmTest',
        template: 'fe7520b8-949b-4864-953e-dbb280d84a57',
        VIFs: []
      })

      const host = getOneHost(xo)
      const pool = await xo.getOrWaitObject(host.$poolId)
      const diskId = await xo.call('disk.create', {
        name: 'diskTest',
        size: '1GB',
        sr: pool.default_SR
      })

      await xo.call('vm.attachDisk', {
        vm: vmId,
        vdi: diskId,
        bootable: true,
        mode: 'RO',
        position: '2'
      })
      const vm = await xo.waitObject(vmId)
      await waitObjectState(xo, vm.$VBDs, vbd => {
        expect(vbd.type).to.be.equal('VBD')
        // expect(vbd.attached).to.be.true()
        expect(vbd.bootable).to.be.true()
        expect(vbd.is_cd_drive).to.be.false()
        expect(vbd.position).to.be.equal('2')
        expect(vbd.read_only).to.be.true()
        expect(vbd.VDI).to.be.equal(diskId)
        expect(vbd.VM).to.be.equal(vmId)
        expect(vbd.$poolId).to.be.equal(vm.$poolId)
      })
    })
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
