import assert from 'node:assert'
import { after, before, describe, it } from 'node:test'
import { createLogger } from '@xen-orchestra/log'

import { backupConfig } from '../backup.config.js'
import { generateBackupJobName, getDefaultSchedule, getScheduleKey, waitUntil } from '../utils/index.js'
import { assertBackupSuccess } from '../utils/backupUtils.js'
import { setup, teardown } from './setup.js'

const log = createLogger('qa:backup:restore-targets')

// name labels of the disks added to the test VM, so each restore target can be asked for by name
const LIVE_MOUNTED_DISK = 'qa-restore-target-live-mounted'
const IGNORED_DISK = 'qa-restore-target-ignored'

// small: every backup run transfers them
const EXTRA_DISK_SIZE = 128 * 1024 * 1024

// `other_config` key stamped on the SR of a live mount, holding the mount id
const OC_LIVE_MOUNT = 'xo:live-mount'

/**
 * Per disk restore targets of an incremental backup restore.
 *
 * A restore used to take `mapVdisSrs` as `{ [vdiUuid]: srUuid | null }`, and still accepts it. It
 * now also takes a target per disk: restore it onto an SR, live mount it (its data stays on the
 * backup repository, served as an iSCSI LUN attached to a host, read-only unless a cache SR makes it
 * a read/write live restore), or leave it out.
 */
describe('Incremental backup restore targets', () => {
  let dispatchClient
  let tracker
  let vm
  let backupRepository

  // the delta backup every restore of this file starts from
  let backup
  // SR the restored disks land on, and host the live mounts are attached to
  let targetSrId
  let hostId

  before(async () => {
    let vms
    ;({ dispatchClient, tracker, vms, backupRepository } = await setup())
    // only using one VM
    vm = vms[0]

    const vdis = await dispatchClient.vdi.getVdisForVm(vm.uuid)
    assert(vdis.length > 0, 'The test VM must have at least one disk')
    targetSrId = vdis[0].SR

    // one disk per restore target: the VM's own disk is restored, these two are live mounted and
    // ignored
    for (const name of [LIVE_MOUNTED_DISK, IGNORED_DISK]) {
      await dispatchClient.xoClient.call('disk.create', {
        name,
        size: EXTRA_DISK_SIZE,
        sr: targetSrId,
        vm: vm.uuid,
      })
    }

    hostId = await resolveHostId(dispatchClient, vm.uuid)

    const name = generateBackupJobName()
    const schedule = getDefaultSchedule()
    const config = backupConfig(name, schedule, vm, backupRepository)
    config.mode = 'delta'

    const backupJobId = await dispatchClient.backup.createBackupJob(config)
    const backupJob = await dispatchClient.backup.details(backupJobId)
    tracker.trackResource('backupJob', backupJobId, { name, mode: 'delta' })

    const scheduleKey = getScheduleKey(backupJob)
    assert(scheduleKey, 'Schedule key is required to run the backup job')
    tracker.trackResource('schedule', scheduleKey, { name, backupJobId })

    // first run → full, second run → delta, so the restore walks a real chain
    for (let i = 0; i < 2; i++) {
      const result = await dispatchClient.backup.runJobAndGetLog(backupJobId, scheduleKey)
      assertBackupSuccess(result, `Backup run ${i + 1}/2`)
    }

    const backupsByRemoteAndVm = await dispatchClient.xoClient.call('backupNg.listVmBackups', {
      remotes: [backupRepository.id],
    })
    const vmBackups = backupsByRemoteAndVm[backupRepository.id]?.[vm.uuid] ?? []
    backup = [...vmBackups].sort((a, b) => a.timestamp - b.timestamp).at(-1)

    assert.strictEqual(backup?.mode, 'delta', 'The latest backup should be an incremental one')
    assert(backup.disks.length >= 3, `Expected at least 3 disks in the backup, got ${backup.disks.length}`)

    log.debug('Backup to restore', { backupId: backup.id, disks: backup.disks.length, hostId, targetSrId })
  })

  after(async () => {
    // a mount holds the SR its VDI lives on: release whatever a failing test left behind, before
    // the tracked resources are destroyed
    await unmountAll(dispatchClient, backup?.id)
    await teardown(dispatchClient, tracker)
  })

  describe('a restore mixing the three targets', () => {
    let restoredVmId
    let liveMountedVdi
    let restoredVdis

    before(async () => {
      restoredVmId = await restore(dispatchClient, tracker, backup, targetSrId, {
        [diskUuid(backup, LIVE_MOUNTED_DISK)]: { type: 'live-mount', host: hostId },
        [diskUuid(backup, IGNORED_DISK)]: { type: 'ignore' },
      })

      restoredVdis = await dispatchClient.vdi.getVdisForVm(restoredVmId)
      liveMountedVdi = restoredVdis.find(vdi => vdi.SR !== targetSrId)
    })

    it('leaves out the ignored disk and keeps the others', () => {
      assert.strictEqual(restoredVdis.length, backup.disks.length - 1)
      assert(
        !restoredVdis.some(vdi => vdi.name_label === IGNORED_DISK),
        'The ignored disk should not be part of the restored VM'
      )
    })

    it('restores the other disks onto the target SR', () => {
      const copied = restoredVdis.filter(vdi => vdi.uuid !== liveMountedVdi?.uuid)
      assert(copied.length > 0, 'At least one disk should have been restored')
      for (const vdi of copied) {
        assert.strictEqual(vdi.SR, targetSrId)
      }
    })

    it('serves the live mounted disk from its own SR, on the chosen host', async () => {
      assert(liveMountedVdi !== undefined, 'The live mounted disk should sit outside the target SR')

      const sr = await dispatchClient.restApiClient.get(
        `/rest/v0/srs/${liveMountedVdi.SR}?fields=SR_type,other_config,$container`
      )

      assert.strictEqual(sr.SR_type, 'iscsi', 'A live mount is served by a raw LUN iSCSI SR')
      assert(sr.other_config[OC_LIVE_MOUNT] !== undefined, 'The SR should carry the id of its mount')
      assert.strictEqual(sr.$container, hostId, 'The SR should be attached to the requested host')
    })

    it('attaches the live mounted disk read only', async () => {
      const vbds = await dispatchClient.restApiClient.get('/rest/v0/vbds?fields=VDI,VM,read_only')
      const vbd = vbds.find(candidate => candidate.VDI === liveMountedVdi.uuid)

      assert(vbd !== undefined, 'The live mounted disk should be attached to the restored VM')
      assert.strictEqual(vbd.read_only, true, 'The mount refuses writes, so its VBD must be read only')
    })

    // The mount is only ever read through the guest; checking the data itself would need to log
    // into it, which this suite does not do. Booting is the meaningful part anyway: it is what
    // makes XAPI activate the LUN backed VDI.
    it('boots the restored VM off its restored and live mounted disks', async () => {
      await dispatchClient.vm.start(restoredVmId)
      await dispatchClient.vm.waitForPowerState(restoredVmId, 'Running', 180_000)

      await dispatchClient.vm.stop(restoredVmId, { force: true })
      await dispatchClient.vm.waitForPowerState(restoredVmId, 'Halted', 180_000)
    })

    it('keeps the mount alive after the restore, until it is unmounted', async () => {
      const mountId = await liveMountId(dispatchClient, liveMountedVdi.SR)
      const mounted = await liveMountSrIds(dispatchClient)
      assert(mounted.includes(liveMountedVdi.SR), 'The mount should still be there once the restore is over')
      log.debug('Unmounting', { mountId, srId: liveMountedVdi.SR, mounted })

      await dispatchClient.backup.unmountLiveDisk(backup.id, mountId)

      // the SR the mount introduced is forgotten as part of the unmount
      await waitUntil(async () => !(await liveMountSrIds(dispatchClient)).includes(liveMountedVdi.SR), 1000, 60_000)
      log.debug('Unmounted', { mountId, remaining: await liveMountSrIds(dispatchClient) })
    })
  })

  /**
   * A live mounted disk is a VDI like any other: nothing stops a user from deleting it, or the VM
   * it is attached to, without unmounting first. xo-server watches for its VDI to disappear and
   * releases the mount on its own: the SR is forgotten and the mount id is no longer known.
   */
  describe('a live mount whose disk is deleted', () => {
    // only the live mounted disk is kept, so nothing is copied and each restore is cheap
    async function restoreLiveMountedOnly() {
      const mapVdisSrs = Object.fromEntries(
        backup.disks.map(({ name, uuid }) => [
          uuid,
          name === LIVE_MOUNTED_DISK ? { type: 'live-mount', host: hostId } : { type: 'ignore' },
        ])
      )
      const restoredVmId = await restore(dispatchClient, tracker, backup, targetSrId, mapVdisSrs)

      // the restore returns as soon as XAPI created the VM, XO sees it (then its disks) a bit later:
      // nothing is copied here, so the lag is not hidden by a transfer as in the other restores
      const vdis = await waitUntil(
        async () => {
          const restoredVdis = await dispatchClient.vdi.getVdisForVm(restoredVmId)
          return restoredVdis.length !== 0 && restoredVdis
        },
        1000,
        30_000
      )
      assert.strictEqual(vdis.length, 1, 'Only the live mounted disk should have been restored')
      const [liveMountedVdi] = vdis

      const mountId = await liveMountId(dispatchClient, liveMountedVdi.SR)
      return { mountId, restoredVmId, srId: liveMountedVdi.SR, vdiId: liveMountedVdi.uuid }
    }

    async function assertReleased({ mountId, srId }) {
      // the release is asynchronous: it follows the XAPI event reporting the VDI removal
      await waitUntil(async () => !(await liveMountSrIds(dispatchClient)).includes(srId), 1000, 60_000)

      await assert.rejects(
        () => dispatchClient.backup.unmountLiveDisk(backup.id, mountId),
        /HTTP 404/,
        'xo-server should have forgotten the mount along with its SR'
      )
    }

    it('is released when the VM holding it is deleted with its disks', async () => {
      const mount = await restoreLiveMountedOnly()

      // `VM_destroy` only warns when a disk fails to be destroyed: if the LUN backed VDI could not
      // be, the mount stays and the wait below times out
      await dispatchClient.vm.delete(mount.restoredVmId, { deleteDisks: true })

      await assertReleased(mount)
    })

    it('is released when only its disk is deleted, the VM being kept', async () => {
      const mount = await restoreLiveMountedOnly()

      await dispatchClient.xoClient.call('vdi.delete', { id: mount.vdiId })

      await assertReleased(mount)
      assert.deepStrictEqual(
        await dispatchClient.vdi.getVdisForVm(mount.restoredVmId),
        [],
        'The VM should be kept, without the deleted disk'
      )
    })

    it('outlives the deletion of its VM when the disk is kept, until the disk is deleted', async () => {
      const mount = await restoreLiveMountedOnly()

      await dispatchClient.vm.delete(mount.restoredVmId, { deleteDisks: false })

      // XO's objects and the mount watch are fed by the same XAPI events: once XO no longer shows
      // the VM, the events of its deletion have been handled, and the VDI must still be there
      await waitUntil(async () => !(await restObjectExists(dispatchClient, `vms/${mount.restoredVmId}`)), 1000, 60_000)
      assert(await restObjectExists(dispatchClient, `vdis/${mount.vdiId}`), 'The disk should outlive its VM')
      assert(
        (await liveMountSrIds(dispatchClient)).includes(mount.srId),
        'The mount should be kept as long as its disk exists'
      )
      assert.strictEqual(await liveMountId(dispatchClient, mount.srId), mount.mountId)

      await dispatchClient.xoClient.call('vdi.delete', { id: mount.vdiId })

      await assertReleased(mount)
    })
  })

  /**
   * A live restore is a live mount with a cache SR: each block is read from the backup repository
   * once, materialized into a cache VDI plugged onto the appliance serving the mount (XO, or the
   * proxy of the backup repository), and the mount is read/write. The writes are lost on unmount.
   */
  describe('a live restore, its disks live mounted with a cache', () => {
    // set when the infrastructure cannot hold a cache, the tests are skipped
    let skipReason
    let applianceVmUuid
    let cacheSrId
    let restoredVmId
    let liveRestoredVdis
    let mountIds

    before(async () => {
      applianceVmUuid = await resolveApplianceVmUuid(dispatchClient, backupRepository)
      if (applianceVmUuid == null) {
        skipReason = 'the appliance serving the mounts does not run in a Xen VM, it cannot hold a cache VDI'
        return
      }
      cacheSrId = await pickCacheSrId(dispatchClient, applianceVmUuid)
      if (cacheSrId === undefined) {
        skipReason = `no writable SR is plugged on the host running the appliance VM ${applianceVmUuid}`
        return
      }

      // the VM's own disks are live restored so it boots off them, the extra disks are left out
      const mapVdisSrs = Object.fromEntries(
        backup.disks.map(({ name, uuid }) => [
          uuid,
          name === LIVE_MOUNTED_DISK || name === IGNORED_DISK
            ? { type: 'ignore' }
            : { type: 'live-mount', host: hostId, cacheSr: cacheSrId },
        ])
      )
      restoredVmId = await restore(dispatchClient, tracker, backup, targetSrId, mapVdisSrs)

      // nothing is copied, XO may not see the disks of the VM yet when the restore returns
      liveRestoredVdis = await waitUntil(
        async () => {
          const restoredVdis = await dispatchClient.vdi.getVdisForVm(restoredVmId)
          return restoredVdis.length !== 0 && restoredVdis
        },
        1000,
        30_000
      )
      mountIds = []
      for (const vdi of liveRestoredVdis) {
        mountIds.push(await liveMountId(dispatchClient, vdi.SR))
      }
      log.debug('Live restored', { applianceVmUuid, cacheSrId, mountIds, restoredVmId })
    })

    it('attaches every live restored disk read/write', async t => {
      if (skipReason !== undefined) {
        return t.skip(skipReason)
      }
      assert.strictEqual(liveRestoredVdis.length, backup.disks.length - 2, 'Only the VM disks should be restored')

      const vbds = await dispatchClient.restApiClient.get('/rest/v0/vbds?fields=VDI,VM,read_only')
      for (const vdi of liveRestoredVdis) {
        const vbd = vbds.find(candidate => candidate.VDI === vdi.uuid && candidate.VM === restoredVmId)
        assert(vbd !== undefined, `The live restored disk ${vdi.uuid} should be attached to the restored VM`)
        assert.strictEqual(vbd.read_only, false, 'The cache makes the mount writable, so its VBD must be too')
      }
    })

    it('materializes each disk into a cache VDI plugged onto the appliance', async t => {
      if (skipReason !== undefined) {
        return t.skip(skipReason)
      }
      const vbds = await dispatchClient.restApiClient.get('/rest/v0/vbds?fields=VDI,VM')
      for (const mountId of mountIds) {
        const cacheVdi = await findCacheVdi(dispatchClient, mountId, cacheSrId)
        assert(cacheVdi !== undefined, `The mount ${mountId} should have a cache VDI on the SR ${cacheSrId}`)
        assert(
          vbds.some(vbd => vbd.VDI === cacheVdi.uuid && vbd.VM === applianceVmUuid),
          'The cache VDI should be plugged onto the appliance serving the mount'
        )
      }
    })

    // `Running` only means the domain was created: waiting for the guest to report an IP is what
    // shows its OS booted, writing to its disks along the way (logs, journal replay…)
    it('boots the restored VM off its live restored disks', async t => {
      if (skipReason !== undefined) {
        return t.skip(skipReason)
      }
      await dispatchClient.vm.start(restoredVmId)
      await dispatchClient.vm.waitForPowerState(restoredVmId, 'Running', 180_000)
      const ip = await dispatchClient.vm.waitForGuestIp(restoredVmId, 300_000)
      log.debug('Live restored VM booted', { ip, restoredVmId })

      await dispatchClient.vm.stop(restoredVmId, { force: true })
      await dispatchClient.vm.waitForPowerState(restoredVmId, 'Halted', 180_000)
    })

    it('destroys the cache along with the mount', async t => {
      if (skipReason !== undefined) {
        return t.skip(skipReason)
      }
      for (const [i, mountId] of mountIds.entries()) {
        const cacheVdi = await findCacheVdi(dispatchClient, mountId, cacheSrId)
        const srId = liveRestoredVdis[i].SR

        await dispatchClient.backup.unmountLiveDisk(backup.id, mountId)

        await waitUntil(async () => !(await liveMountSrIds(dispatchClient)).includes(srId), 1000, 60_000)
        await waitUntil(async () => !(await restObjectExists(dispatchClient, `vdis/${cacheVdi.uuid}`)), 1000, 60_000)
      }
    })

    it('refuses a cache SR outside the pool running the appliance', async t => {
      if (skipReason !== undefined) {
        return t.skip(skipReason)
      }
      const { $pool } = await dispatchClient.restApiClient.get(`/rest/v0/vms/${applianceVmUuid}?fields=$pool`)
      const srs = await dispatchClient.restApiClient.get('/rest/v0/srs?fields=id,$pool,content_type,size')
      const foreignSr = srs.find(sr => sr.$pool !== $pool && isSrWritable(sr))
      if (foreignSr === undefined) {
        return t.skip('XO is connected to a single pool')
      }
      const before = await liveMountSrIds(dispatchClient)

      await assert.rejects(
        () =>
          dispatchClient.backup.importVmBackup(backup.id, targetSrId, {
            mapVdisSrs: {
              [diskUuid(backup, LIVE_MOUNTED_DISK)]: { type: 'live-mount', host: hostId, cacheSr: foreignSr.id },
            },
          }),
        /not in the pool running this appliance/
      )

      assert.deepStrictEqual(await liveMountSrIds(dispatchClient), before, 'The failed mount should be released')
    })
  })

  // nothing is copied when every disk is live mounted, so the restore is over within seconds: the
  // restored VM must already be known to XO when its id is returned, as the restore form starts it
  // right away
  it('returns a VM which can be started right away when every disk is live mounted', async () => {
    const mapVdisSrs = Object.fromEntries(backup.disks.map(({ uuid }) => [uuid, { type: 'live-mount', host: hostId }]))
    const restoredVmId = await restore(dispatchClient, tracker, backup, targetSrId, mapVdisSrs)

    // no wait on purpose: this is the call which failed with "no such VM"
    await dispatchClient.vm.start(restoredVmId)
    await dispatchClient.vm.waitForPowerState(restoredVmId, 'Running', 180_000)

    await dispatchClient.vm.stop(restoredVmId, { force: true })
    await dispatchClient.vm.waitForPowerState(restoredVmId, 'Halted', 180_000)

    // deleting the disks releases their mounts
    const srIds = (await dispatchClient.vdi.getVdisForVm(restoredVmId)).map(vdi => vdi.SR)
    await dispatchClient.vm.delete(restoredVmId, { deleteDisks: true })
    await waitUntil(
      async () => {
        const mounted = await liveMountSrIds(dispatchClient)
        return srIds.every(srId => !mounted.includes(srId))
      },
      1000,
      60_000
    )
  })

  it('still accepts the legacy shape, an SR uuid or null per disk', async () => {
    const restoredVmId = await restore(dispatchClient, tracker, backup, targetSrId, {
      [diskUuid(backup, LIVE_MOUNTED_DISK)]: targetSrId,
      [diskUuid(backup, IGNORED_DISK)]: null,
    })

    const vdis = await dispatchClient.vdi.getVdisForVm(restoredVmId)

    assert.strictEqual(vdis.length, backup.disks.length - 1)
    assert(!vdis.some(vdi => vdi.name_label === IGNORED_DISK), 'A null entry should skip that disk')
    for (const vdi of vdis) {
      assert.strictEqual(vdi.SR, targetSrId, 'Every restored disk should be on the SR it was mapped to')
    }
  })

  it('refuses to live mount a disk during a backup health check', async () => {
    // the health check destroys the VM it restores, which would leave the mount behind
    await assert.rejects(
      () =>
        dispatchClient.backup.checkBackup(backup.id, targetSrId, {
          mapVdisSrs: { [diskUuid(backup, LIVE_MOUNTED_DISK)]: { type: 'live-mount', host: hostId } },
        }),
      /health check cannot live mount/
    )
  })

  it('leaves no mount behind when the restore fails', async () => {
    const before = await liveMountSrIds(dispatchClient)

    await assert.rejects(() =>
      dispatchClient.backup.importVmBackup(backup.id, targetSrId, {
        mapVdisSrs: { [diskUuid(backup, LIVE_MOUNTED_DISK)]: { type: 'live-mount', host: 'not-a-host' } },
      })
    )

    assert.deepStrictEqual(await liveMountSrIds(dispatchClient), before)
  })
})

/** uuid, in the backup, of the disk labelled `name` */
function diskUuid(backup, name) {
  const disk = backup.disks.find(candidate => candidate.name === name)
  assert(disk !== undefined, `No disk named ${name} in backup ${backup.id}`)
  return disk.uuid
}

async function restore(dispatchClient, tracker, backup, srId, mapVdisSrs) {
  const restoredVmId = await dispatchClient.backup.importVmBackup(backup.id, srId, { mapVdisSrs })
  tracker.trackResource('vm', restoredVmId, { name: 'restored VM', backupId: backup.id })
  log.debug('Restored VM', { restoredVmId, mapVdisSrs })
  return restoredVmId
}

/** host the live mounts are attached to: the one running the test VM */
async function resolveHostId(dispatchClient, vmUuid) {
  const { $container } = await dispatchClient.vm.details(vmUuid)
  const hosts = await dispatchClient.restApiClient.get('/rest/v0/hosts?fields=id')

  const host = hosts.find(candidate => candidate.id === $container) ?? hosts[0]
  assert(host !== undefined, 'A host is required to live mount a disk')
  return host.id
}

/**
 * VM of the appliance which serves the mounts of this backup repository, and onto which a cache VDI
 * is plugged: the proxy of the repository, or XO itself. `null` when it does not run in a Xen VM.
 */
async function resolveApplianceVmUuid(dispatchClient, backupRepository) {
  if (backupRepository.proxy != null) {
    const proxy = await dispatchClient.xoClient.call('proxy.get', { id: backupRepository.proxy })
    return proxy.vmUuid ?? null
  }
  return dispatchClient.xoClient.call('xo.getCurrentVmUuid')
}

const isSrWritable = sr => sr.content_type !== 'iso' && sr.size > 0

/**
 * SR with the most free space among those which can hold a cache VDI, the same as the restore form
 * offers: a shared SR of the appliance's pool, or a local SR of its host. `undefined` when there is
 * none, or when the pool of the appliance is not connected to XO.
 */
async function pickCacheSrId(dispatchClient, applianceVmUuid) {
  let vm
  try {
    vm = await dispatchClient.restApiClient.get(`/rest/v0/vms/${applianceVmUuid}?fields=$pool,$container`)
  } catch (error) {
    if (/HTTP 404/.test(error.message)) {
      return undefined
    }
    throw error
  }
  const srs = await dispatchClient.restApiClient.get(
    '/rest/v0/srs?fields=id,shared,$pool,$container,content_type,size,physical_usage,other_config'
  )
  const candidates = srs.filter(
    sr =>
      isSrWritable(sr) &&
      // the SR of another live mount is a raw LUN, which cannot hold a VDI
      sr.other_config?.[OC_LIVE_MOUNT] === undefined &&
      (sr.shared ? sr.$pool === vm.$pool : sr.$container === vm.$container)
  )
  const freeSpace = sr => sr.size - sr.physical_usage
  return candidates.sort((a, b) => freeSpace(b) - freeSpace(a))[0]?.id
}

/** cache VDI of a mount: tagged with the mount id like the VDI of its SR, but on the cache SR */
async function findCacheVdi(dispatchClient, mountId, cacheSrId) {
  const vdis = await dispatchClient.restApiClient.get('/rest/v0/vdis?fields=uuid,$SR,other_config')
  return vdis.find(vdi => vdi.$SR === cacheSrId && vdi.other_config?.[OC_LIVE_MOUNT] === mountId)
}

/** ids of the SRs currently serving a live mount */
async function liveMountSrIds(dispatchClient) {
  const srs = await dispatchClient.restApiClient.get('/rest/v0/srs?fields=id,other_config')
  return srs.filter(sr => sr.other_config?.[OC_LIVE_MOUNT] !== undefined).map(sr => sr.id)
}

/** whether the REST API still knows an object, `path` being relative to `/rest/v0/` */
async function restObjectExists(dispatchClient, path) {
  try {
    await dispatchClient.restApiClient.get(`/rest/v0/${path}?fields=id`)
    return true
  } catch (error) {
    if (/HTTP 404/.test(error.message)) {
      return false
    }
    throw error
  }
}

/**
 * Id of the mount serving an SR.
 *
 * There is no endpoint listing the mounts, so it is read back from the SR the mount introduced,
 * which is also how a user would find it again after a restore.
 */
async function liveMountId(dispatchClient, srId) {
  const sr = await dispatchClient.restApiClient.get(`/rest/v0/srs/${srId}?fields=other_config`)
  const mountId = sr.other_config?.[OC_LIVE_MOUNT]

  assert(mountId !== undefined, `SR ${srId} does not belong to a live mount`)
  return mountId
}

async function unmountAll(dispatchClient, archiveId) {
  if (archiveId === undefined) {
    return
  }

  const srIds = await liveMountSrIds(dispatchClient)
  if (srIds.length !== 0) {
    // a mount this run did not create cannot be released here: xo-server only knows the mounts of
    // its own process, so one left by an earlier process answers 404
    log.debug('Live mounts left at teardown', { srIds })
  }

  for (const srId of srIds) {
    try {
      await dispatchClient.backup.unmountLiveDisk(archiveId, await liveMountId(dispatchClient, srId))
    } catch (error) {
      log.warn('Failed to release a live mount', { error, srId })
    }
  }
}
