/* eslint-env mocha */

// Doc: https://github.com/moll/js-must/blob/master/doc/API.md#must
import expect from 'must'

// ===================================================================

import {getConnection, almostEqual, getConfig, getOneHost, waitObjectState,
 getOtherHost, getVmXoTestPvId} from './util'
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
    this.timeout(10e3)
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

  async function createVmTest () {
    const vmId = await createVm({
      name_label: 'vmTest',
      template: 'fe7520b8-949b-4864-953e-dbb280d84a57',
      VIFs: []
    })
    return vmId
  }

  async function vmOff (vmId) {
    const vm = await xo.getOrWaitObject(vmId)
    if (vm.power_state === 'Halted') {
      return true
    }
  }

  async function getVbdPosition (vmId) {
    const vm = await xo.getOrWaitObject(vmId)
    for (let i = 0; i < vm.$VBDs.length; i++) {
      const vbd = await xo.getOrWaitObject(vm.$VBDs[i])
      if (vbd.is_cd_drive === true) {
        return vbd.id
      }
    }
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
    let diskIds = []
    beforeEach(async function () {
      vmId = await createVmTest()
    })
    after(async function () {
      await Promise.all(map(
        snapshotIds,
        snapshotId => xo.call('vm.delete', {id: snapshotId})
      ),
      map(diskIds,
        diskId => xo.call('vdi.delete', {id: diskId})
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

    it.skip('deletes a VM and its snapshots', async function () {
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

      // if snapshot is deleted, there is no snapshot to delete in afterEach function
      snapshotIds = []
    })

    it.skip('deletes a VM and its disks', async function () {
      const host = getOneHost(xo)
      const pool = await xo.getOrWaitObject(host.$poolId)
      const diskId = await xo.call('disk.create', {
        name: 'diskTest',
        size: '1GB',
        sr: pool.default_SR
      })
      diskIds.push(diskId)

      await xo.call('vm.delete', {
        id: vmId,
        delete_disks: true
      })

      vmIds = []
      await waitObjectState(xo, diskId, disk => {
        expect(disk).to.be.undefined()
      })

      // if disk is deleted, there is no snapshot to delete in afterEach function
      diskIds = []
    })

    // TODO: do a copy of the ISO
    it.skip('deletes a vm but not delete its ISO', async function () {
      vmId = await createVmTest()

      await xo.call('vm.insertCd', {
        id: vmId,
        cd_id: '1169eb8a-d43f-4daf-a0ca-f3434a4bf301',
        force: false
      })

      await xo.call('vm.delete', {
        id: vmId,
        delete_disks: true
      })

      waitObjectState(xo, '1169eb8a-d43f-4daf-a0ca-f3434a4bf301', iso => {
        expect(iso).not.to.be.undefined()
      })
    })
  })

  // ------------------------------------------------------------------

  describe('.ejectCd()', function () {
    this.timeout(5e3)
    beforeEach(async function () {
      vmId = await getVmXoTestPvId(xo)
      await xo.call('vm.insertCd', {
        id: vmId,
        // windows7 ultimate
        // TODO: search by name
        cd_id: '1169eb8a-d43f-4daf-a0ca-f3434a4bf301',
        force: false
      })
    })
    it('ejects an ISO', async function () {
      await xo.call('vm.ejectCd', {id: vmId})
      const vm = await xo.getOrWaitObject(vmId)
      await waitObjectState(xo, vm.$VBDs[0], vbd => {
        expect(vbd.VDI).to.be.null()
      })
    })
  })

  // -------------------------------------------------------------------

  describe('.insertCd()', function () {
    afterEach(async function () {
      await xo.call('vm.ejectCd', {id: vmId})
    })

    it('mount an ISO on the VM (force: false)', async function () {
      vmId = await getVmXoTestPvId(xo)

      await xo.call('vm.insertCd', {
        id: vmId,
        // windows7 ultimate
        // TODO: search by name
        cd_id: '1169eb8a-d43f-4daf-a0ca-f3434a4bf301',
        force: false
      })
      const vbdId = await getVbdPosition(vmId)
      // TODO: check type CD
      await waitObjectState(xo, vbdId, vbd => {
        // TODO: find diskId
        expect(vbd.VDI).to.be.equal('1169eb8a-d43f-4daf-a0ca-f3434a4bf301')
      })
    })

    it('mount an ISO on the VM (force: true)', async function () {
      vmId = await getVmXoTestPvId(xo)

      await xo.call('vm.insertCd', {
        id: vmId,
        cd_id: '1169eb8a-d43f-4daf-a0ca-f3434a4bf301',
        force: true
      })
      const vbdId = await getVbdPosition(vmId)
      await waitObjectState(xo, vbdId, vbd => {
        expect(vbd.VDI).to.be.equal('1169eb8a-d43f-4daf-a0ca-f3434a4bf301')
      })
    })

    it('mount an ISO on a VM which do not have already cd\'s VBD', async function () {
      vmId = await createVmTest()

      await xo.call('vm.insertCd', {
        id: vmId,
        cd_id: '1169eb8a-d43f-4daf-a0ca-f3434a4bf301',
        force: false
      })

      await waitObjectState(xo, vmId, vm => {
        expect(vm.$VBDs).not.to.be.empty()
      })
      const vm = await xo.getOrWaitObject(vmId)
      await waitObjectState(xo, vm.$VBDs, vbd => {
        expect(vbd.is_cd_drive).to.be.true()
        expect(vbd.position).to.be.equal('3')
      })

    })
  })

  // -------------------------------------------------------------------

  describe('.migrate', function () {
    this.timeout(15e3)
    let serverId
    let startHostId

    before(async function () {
      const config = await getConfig()
      serverId = await xo.call('server.add', config.xenServer2).catch(() => {})
      await eventToPromise(xo.objects, 'finish')

      const vms = xo.objects.indexes.type.VM
      vmId = find(vms, {name_label: config.vmToMigrate.name_label}).id

      if (await vmOff(vmId)) {
        await xo.call('vm.start', {id: vmId})
      }
    })
    after(async function () {
      await xo.call('server.remove', {
        id: serverId
      })
    })
    afterEach(async function () {
      await xo.call('vm.migrate', {
        id: vmId,
        host_id: startHostId
      })
    })

    it('migrates the VM on an other host', async function () {
      let hostId
      const vm = await xo.getOrWaitObject(vmId)
      startHostId = vm.$container

      hostId = getOtherHost(xo, vm)
      await xo.call('vm.migrate', {
        id: vmId,
        host_id: hostId
      })
      await waitObjectState(xo, vmId, vm => {
        expect(vm.$container).to.be.equal(hostId)
      })
    })
  })

  // -------------------------------------------------------------------

  describe('.migratePool()', function () {
    it('migrates the VM on an other host which is in an other pool')
  })

  // -------------------------------------------------------------------

  describe('.set()', function () {
    this.timeout(10e3)
    beforeEach(async function () {
      vmId = await createVmTest()
    })

    it('sets VM parameters', async function () {
      await xo.call('vm.set', {
          id: vmId,
          name_label: 'vmRenamed',
          name_description: 'description',
          CPUs: 2,
          memory: 200e6
        })
      await waitObjectState(xo, vmId, vm => {
        expect(vm.name_label).to.be.equal('vmRenamed')
        expect(vm.name_description).to.be.equal('description')
        expect(vm.CPUs.number).to.be.equal(2)
        expect(vm.memory.size).to.be.equal(200e6)
      })
    })
  })

  // ---------------------------------------------------------------------

  describe('.start()', function () {
    this.timeout(10e3)
    beforeEach(async function () {
      vmId = await getVmXoTestPvId(xo)
      try {
        await xo.call('vm.stop', {id: vmId})
      } catch(_) {}
    })
    afterEach(async function () {
      await xo.call('vm.stop', {
        id: vmId,
        force: true
      })
    })

    it('starts a VM', async function () {
      await xo.call('vm.start', {id: vmId})
      await waitObjectState(xo, vmId, vm => {
        expect(vm.power_state).to.be.equal('Running')
      })
    })
  })

  // ---------------------------------------------------------------------

  describe('.stop()', function () {
    this.timeout(25e3)
    beforeEach(async function () {
      vmId = await getVmXoTestPvId(xo)
      try {
        await xo.call('vm.start', {id: vmId})
      } catch (_) {}
    })

    // TODO: ask Olivier if vmPv can clean shutdown
    it.skip('stops a VM (clean shutdown)', async function () {
      await xo.call('vm.stop', {
        id: vmId,
        force: false
      })
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
    this.timeout(30e3)
    beforeEach(async function () {
      vmId = await getVmXoTestPvId(xo)
      try {
        await xo.call('vm.start', {id: vmId})
      } catch(_) {}
    })
    afterEach(async function () {
      await xo.call('vm.stop', {
        id: vmId,
        force: true
      })
    })

    it('restarts a VM (clean reboot)', async function () {
      await xo.call('vm.restart', {
        id: vmId,
        force: false})
      await waitObjectState(xo, vmId, vm => {
        expect(vm.current_operations).to.include('clean_reboot')
      })
      await waitObjectState(xo, vmId, vm => {
        expect(vm.power_state).to.be.equal('Running')
      })
    })

    it('restarts a VM (hard reboot)', async function () {
      await xo.call('vm.restart', {
        id: vmId,
        force: true})
      await waitObjectState(xo, vmId, vm => {
        expect(vm.current_operations).to.include('hard_reboot')
      })
      await waitObjectState(xo, vmId, vm => {
        expect(vm.power_state).to.be.equal('Running')
      })
    })
  })

  // --------------------------------------------------------------------

  describe('.suspend()', function () {
    this.timeout(20e3)
    beforeEach(async function() {
      vmId = await getVmXoTestPvId(xo)
      try {
        await xo.call('vm.start', {id: vmId})
      } catch(_) {}
    })
    afterEach(async function () {
      await xo.call('vm.resume', {id: vmId})
      await xo.call('vm.stop', {
        id: vmId,
        force: true
      })
    })

    it('suspends a VM', async function() {
      await xo.call('vm.suspend', {id: vmId})
      await waitObjectState(xo, vmId, vm => {
        expect(vm.power_state).to.be.equal('Suspended')
      })
    })
  })

  // --------------------------------------------------------------------

  describe('.resume()', function () {
    this.timeout(15e3)
    beforeEach(async function() {
      vmId = await getVmXoTestPvId(xo)
      try {
        await xo.call('vm.start', {id: vmId})
      } catch(_) {}
      await xo.call('vm.suspend', {id: vmId})
    })
    afterEach(async function () {
      await xo.call('vm.stop', {
        id: vmId,
        force: true
      })
    })
    it('resumes a VM (clean_resume)', async function () {
      await xo.call('vm.resume', {id: vmId, force: false})
      await waitObjectState(xo, vmId, vm => {
        expect(vm.power_state).to.be.equal('Running')
      })
    })
    it('resumes a VM (hard_resume)', async function () {
      await xo.call('vm.resume', {id: vmId, force: true})
      await waitObjectState(xo, vmId, vm => {
        expect(vm.power_state).to.be.equal('Running')
      })
    })
  })

  // --------------------------------------------------------------------

  describe('.clone()', function () {
    this.timeout(10e3)
    beforeEach(async function () {
      vmId = await createVmTest()
    })
    it('clones a VM', async function () {
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
    beforeEach(async function () {
      vmId = await createVmTest()
    })

    it('converts a VM', async function () {
      await xo.call('vm.convert', {id: vmId})
      await waitObjectState(xo, vmId, vm => {
        expect(vm.type).to.be.equal('VM-template')
      })
    })
  })

  // ---------------------------------------------------------------------

  // TODO : delete a VM must delete its snapshots
  describe('.snapshot()', function () {
    this.timeout(5e3)
    let snapshotId

    afterEach(async function () {
      await xo.call('vm.delete', {id: snapshotId, delete_disks: true})
    })

    it('snapshots a basic VM', async function () {
      vmId = await createVmTest()
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

    it.skip('snapshots more complex VM', async function () {
      vmId = await getVmXoTestPvId(xo)
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
        'VIFs',
        '$VBDs',
        '$snapshot_of'
      ])
    })
  })

  // ---------------------------------------------------------------------
  // TODO : delete a VM must delete its snapshots
  describe('.revert()', function () {
    this.timeout(5e3)
    let snapshotId
    beforeEach(async function () {
      vmId = await createVmTest()
      snapshotId = await xo.call('vm.snapshot', {
        id: vmId,
        name: 'snapshot'
      })
    })
    afterEach(async function () {
      await xo.call('vm.delete', {id: snapshotId})
    })
    it('reverts a snapshot to its parent VM', async function () {
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
    this.timeout(10e3)
    let diskId
    beforeEach(async function () {
      vmId = await createVmTest()
      const host = getOneHost(xo)
      const pool = await xo.getOrWaitObject(host.$poolId)
      diskId = await xo.call('disk.create', {
        name: 'diskTest',
        size: '1GB',
        sr: pool.default_SR
      })
    })
    afterEach(async function () {
      await xo.call('vdi.delete', {id: diskId})
    })

    it('attaches the disk to the VM with attributes by default', async function () {
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
    this.timeout(20e3)
    beforeEach(async function () {
      vmId = await getVmXoTestPvId(xo)
      await xo.call('vm.start', {id: vmId})
    })
    afterEach(async function () {
      await xo.call('vm.stop', {
        id: vmId,
        force: true
      })
    })

    it('returns an array with statistics of the VM', async function () {
      const stats = await xo.call('vm.stats', {id: vmId})
      expect(stats).to.be.an.object()
    })
  })

  // ---------------------------------------------------------------------
  describe('.bootOrder()', function () {
    it('')
  })
})
