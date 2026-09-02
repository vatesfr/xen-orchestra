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
 * backup repository, served as a read-only iSCSI LUN attached to a host), or leave it out.
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
    ;({ dispatchClient, tracker, vm, backupRepository } = await setup())

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

/** ids of the SRs currently serving a live mount */
async function liveMountSrIds(dispatchClient) {
  const srs = await dispatchClient.restApiClient.get('/rest/v0/srs?fields=id,other_config')
  return srs.filter(sr => sr.other_config?.[OC_LIVE_MOUNT] !== undefined).map(sr => sr.id)
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
