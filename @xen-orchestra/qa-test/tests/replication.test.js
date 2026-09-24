import assert from 'node:assert'
import { after, before, describe, it } from 'node:test'
import { createLogger } from '@xen-orchestra/log'

import {
  assertFullOrDeltaForSr,
  delay,
  findTaskByMessage,
  generateBackupJobName,
  getBackupTransferredBytes,
  getDefaultSchedule,
  getScheduleKey,
} from '../utils/index.js'
import { assertBackupSuccess } from '../utils/backupUtils.js'
import { setup, teardown } from './setup.js'

const log = createLogger('qa:replication')

/** Target SR for cross-SR replication */
const REPLICATION_DESTINATION_SR_ID = process.env.REPLICATION_DESTINATION_SR_ID

describe('Incremental Replication', () => {
  /** @type {import('../client/dispatchClient.js').DispatchClient} */
  let dispatchClient
  /** @type {import('../utils/resourceTracker.js').ResourceTracker} */
  let tracker
  /** @type {{uuid: string, name_label: string, power_state: string}} */
  let vm
  /** @type {string} SR UUID where the test VM's disks live */
  let sourceVmSrUuid

  before(async () => {
    if (!REPLICATION_DESTINATION_SR_ID) {
      throw new Error('REPLICATION_DESTINATION_SR_ID environment variable is required for replication tests')
    }

    const setupResult = await setup()
    dispatchClient = setupResult.dispatchClient
    tracker = setupResult.tracker
    vm = setupResult.vms[0]

    assert.ok(vm, 'Setup should provide a test VM')

    // Determine the SR where the test VM's disks live so we can run the
    // "same SR" scenario without hard-coding an extra env variable.
    const vdis = await dispatchClient.vdi.getVdisForVm(vm.uuid)
    assert.ok(vdis.length > 0, 'Test VM should have at least one VDI')
    sourceVmSrUuid = vdis[0].SR
    assert.ok(sourceVmSrUuid, 'Could not determine source SR from VM VDIs')

    log.debug('Test VM', { name: vm.name_label, uuid: vm.uuid, sourceSrUuid: sourceVmSrUuid })

    // Start the source VM so its disks are active during replication.
    // No need to wait for the OS to fully boot — the VM being in Running
    // state is enough to guarantee writes on the active VDI.
    await dispatchClient.vm.start(vm.uuid)
    log.debug('Source VM started (booting in background)', { uuid: vm.uuid })
  })

  after(async () => {
    // Halt the source VM before teardown so the delete does not fail
    // on a running VM (started in before()).
    if (dispatchClient && vm) {
      try {
        const vmDetails = await dispatchClient.vm.details(vm.uuid)
        if (vmDetails?.power_state === 'Running') {
          await dispatchClient.vm.stop(vm.uuid, { force: true })
          await dispatchClient.vm.waitForPowerState(vm.uuid, 'Halted', 60_000)
        }
      } catch (error) {
        log.warn('Failed to stop source VM before teardown', { error })
      }
    }

    if (dispatchClient && tracker) {
      await teardown(dispatchClient, tracker)
    }
  })

  // ---------------------------------------------------------------------------
  // Shared helpers — accessible by all nested describe blocks via closure
  // ---------------------------------------------------------------------------

  /**
   * Creates a delta replication job from sourceVm to targetSrUuid.
   * @param {{uuid: string, name_label: string}} sourceVm
   * @param {string} targetSrUuid
   * @param {string} [baseName]
   * @param {Object} [settingsOverride] - Overrides merged into the default job settings
   *   (e.g. `{ copyRetention: 1, deleteFirst: true }`).
   * @returns {Promise<{jobId: string, scheduleKey: string}>}
   */
  const createReplicationJob = async (sourceVm, targetSrUuid, baseName = '', settingsOverride = {}) => {
    const name = baseName + ' ' + generateBackupJobName()
    const schedule = getDefaultSchedule()
    const config = {
      name,
      mode: 'delta',
      schedules: { '': schedule },
      settings: {
        '': {
          timezone: 'Europe/Paris',
          copyRetention: 3,
          preferNbd: true,
          bypassVdiChainsCheck: true,
          ...settingsOverride,
        },
      },
      vms: { [sourceVm.uuid]: sourceVm },
      srs: { [targetSrUuid]: true },
    }

    const jobId = await dispatchClient.backup.createBackupJob(config)
    const job = await dispatchClient.backup.details(jobId)
    assert.strictEqual(job.mode, 'delta', 'Replication job should be delta mode')

    tracker.trackResource('backupJob', jobId, { name, mode: 'delta' })

    const scheduleKey = getScheduleKey(job)
    assert.ok(scheduleKey, 'Schedule key is required')
    tracker.trackResource('schedule', scheduleKey, { name, backupJobId: jobId })

    return { jobId, scheduleKey }
  }

  /**
   * Returns UUIDs of VMs that appeared since the given snapshot set.
   * @param {Set<string>} knownUuids
   * @returns {Promise<Array<string>>}
   */
  const findNewVmUuids = async knownUuids => {
    const vmsNow = await dispatchClient.vm.list()
    return vmsNow.filter(v => !knownUuids.has(v.uuid)).map(v => v.uuid)
  }

  /**
   * Force-stops and deletes a list of VMs, swallowing individual errors.
   * @param {Array<string>} vmUuids
   */
  const cleanupVms = async vmUuids => {
    for (const vmUuid of vmUuids) {
      try {
        const vmDetails = await dispatchClient.vm.details(vmUuid)
        if (vmDetails?.power_state === 'Running') {
          await dispatchClient.vm.stop(vmUuid, { force: true })
          await dispatchClient.vm.waitForPowerState(vmUuid, 'Halted', 60_000)
        }
        await dispatchClient.vm.delete(vmUuid, { deleteDisks: true })
        log.debug('Cleaned up VM', { uuid: vmUuid })
      } catch (error) {
        log.warn('Failed to clean up VM', { uuid: vmUuid, error })
      }
    }
  }

  /**
   * @param {string} vmUuid
   * @returns {Promise<boolean>} Whether the VM still exists.
   */
  const vmExists = async vmUuid => {
    try {
      await dispatchClient.vm.details(vmUuid)
      return true
    } catch {
      return false
    }
  }

  // ===========================================================================
  // Incremental replication — same SR and cross-SR
  // ===========================================================================

  // Run every scenario against both "same SR" and "different SR" configurations.
  // The same-SR case is a common edge case where source and destination disks
  // live on the same storage repository.

  for (const { label, getDestSrId } of [
    { label: 'same SR (source = destination)', getDestSrId: () => sourceVmSrUuid },
    { label: 'different SR', getDestSrId: () => REPLICATION_DESTINATION_SR_ID },
  ]) {
    describe(label, () => {
      /** @type {{uuid: string, name_label: string}} */
      let destSr
      /** @type {Array<string>} */
      const replicatedVmUuids = []
      /** @type {string | null} Set when the destination SR is unavailable — causes tests to skip. */
      let destSrSkipReason = null

      before(async () => {
        const destSrId = getDestSrId()
        if (!destSrId) {
          destSrSkipReason = 'REPLICATION_DESTINATION_SR_ID not configured'
          return
        }
        destSr = await dispatchClient.sr.details(destSrId)
        assert.ok(destSr, `Destination SR "${destSrId}" not found — check REPLICATION_DESTINATION_SR_ID in .env`)
        log.debug('Destination SR', { label, name: destSr.name_label, uuid: destSr.uuid })
      })

      after(async () => cleanupVms(replicatedVmUuids))

      /**
       * Returns user VDIs with other_config for the given VM UUID.
       * Works for both active VMs and snapshot VMs.
       */
      const getVdisWithMeta = async vmUuid => {
        const raw = await dispatchClient.restApiClient.get(
          `/rest/v0/vms/${vmUuid}/vdis?fields=uuid,other_config,VDI_type`
        )
        return Array.isArray(raw) ? raw.filter(v => v.VDI_type === 'user') : []
      }

      /**
       * Asserts CONTENT_KEY invariants after a replication run:
       * - source and destination snapshot VDIs share the same CONTENT_KEY value
       * - active VDIs on both sides carry no CONTENT_KEY
       *
       * @param {string} jobId
       * @param {string} replicatedVmUuid
       */
      const assertContentKeyInvariants = async (jobId, replicatedVmUuid) => {
        const CONTENT_KEY_OC = 'xo:backup:contentKey'
        const COPY_OF_OC = 'xo:copy_of'

        // After resetVmOtherConfig, active VDIs carry no backup metadata — COPY_OF and
        // CONTENT_KEY live exclusively on snapshot VDIs. Check each active VDI's snapshots.
        const destActiveVdis = await getVdisWithMeta(replicatedVmUuid)
        assert.ok(destActiveVdis.length > 0, 'Replicated VM must have active VDIs')

        for (const destActiveVdi of destActiveVdis) {
          const raw = await dispatchClient.restApiClient.get(
            `/rest/v0/vdi-snapshots?${new URLSearchParams({ filter: `$snapshot_of:"${destActiveVdi.uuid}"`, fields: 'uuid,other_config' })}`
          )
          const destSnapshotVdis = Array.isArray(raw) ? raw : []
          assert.ok(
            destSnapshotVdis.length > 0,
            `Dest active VDI ${destActiveVdi.uuid} must have at least one snapshot VDI`
          )

          for (const destSnapVdi of destSnapshotVdis) {
            const srcUuid = destSnapVdi.other_config?.[COPY_OF_OC]
            assert.ok(srcUuid, `Dest snapshot VDI ${destSnapVdi.uuid} must have ${COPY_OF_OC}`)

            // Core invariant: CONTENT_KEY must be present and equal COPY_OF.
            // Both are set to the source snapshot VDI UUID during transfer.
            assert.strictEqual(
              destSnapVdi.other_config?.[CONTENT_KEY_OC],
              srcUuid,
              `Dest snapshot VDI ${destSnapVdi.uuid}: ${CONTENT_KEY_OC} must equal ${COPY_OF_OC} (${srcUuid})`
            )

            // Source snapshot VDI should have CONTENT_KEY = its own UUID.
            // Skip gracefully if it was deleted by source retention on a subsequent run.
            let srcSnapVdi
            try {
              srcSnapVdi = await dispatchClient.restApiClient.get(
                `/rest/v0/vdi-snapshots/${srcUuid}?${new URLSearchParams({ fields: 'uuid,other_config' })}`
              )
            } catch {
              // Source snapshot was cleaned up by retention — skip the cross-side check
              continue
            }
            assert.strictEqual(
              srcSnapVdi.other_config?.[CONTENT_KEY_OC],
              srcUuid,
              `Source snapshot VDI ${srcUuid}: ${CONTENT_KEY_OC} must equal its own UUID`
            )
          }
        }

        // Active VDIs on both sides must NOT carry CONTENT_KEY
        for (const vdi of await getVdisWithMeta(vm.uuid)) {
          assert.strictEqual(
            vdi.other_config?.[CONTENT_KEY_OC],
            undefined,
            `Source active VDI ${vdi.uuid} must not have ${CONTENT_KEY_OC}`
          )
        }
        for (const vdi of destActiveVdis) {
          assert.strictEqual(
            vdi.other_config?.[CONTENT_KEY_OC],
            undefined,
            `Destination active VDI ${vdi.uuid} must not have ${CONTENT_KEY_OC}`
          )
        }
      }

      // -----------------------------------------------------------------------
      // Full replication lifecycle:
      //   run 1 → full transfer, new VM created
      //   run 2 → incremental transfer, same VM reused
      //   run 3 → incremental transfer, new VM created (destination was started)
      // -----------------------------------------------------------------------

      describe('Replication lifecycle: full → incremental → incremental after DR start', () => {
        it('should do full on first run, incremental on second, and incremental with new VM after destination started', async t => {
          if (destSrSkipReason) return t.skip(destSrSkipReason)
          const { jobId, scheduleKey } = await createReplicationJob(vm, destSr.uuid)
          const vmUuidsBefore = new Set((await dispatchClient.vm.list()).map(v => v.uuid))

          // --- Run 1: full transfer, new VM created ---
          log.debug('Running first replication (expected full)', { label })
          const result1 = await dispatchClient.backup.runJobAndGetLog(jobId, scheduleKey)
          assertBackupSuccess(result1, 'First replication')
          assertFullOrDeltaForSr(result1, destSr.uuid, { mustBeFull: true })

          const bytes1 = getBackupTransferredBytes(result1)
          log.debug('First run transferred (full)', { label, bytes: bytes1 })

          const newUuids1 = await findNewVmUuids(vmUuidsBefore)
          assert.strictEqual(newUuids1.length, 1, 'First replication should create exactly one new VM')
          const replicatedVmUuid = newUuids1[0]
          assert.notStrictEqual(
            replicatedVmUuid,
            vm.uuid,
            `Replicated VM UUID must differ from source VM UUID (${vm.uuid})`
          )
          replicatedVmUuids.push(replicatedVmUuid)

          const replicatedVm = await dispatchClient.vm.details(replicatedVmUuid)
          log.debug('Replicated VM created', { label, name: replicatedVm.name_label, uuid: replicatedVmUuid })

          const snapshotTask1 = findTaskByMessage(result1, 'target snapshot')
          assert.ok(snapshotTask1, 'First replication should include a "target snapshot" task')
          assert.strictEqual(snapshotTask1.status, 'success', 'Target snapshot task should succeed')

          const snapshotsAfterFirst = (await dispatchClient.vm.details(replicatedVmUuid)).snapshots?.length ?? 0
          assert.ok(
            snapshotsAfterFirst >= 1,
            `Replicated VM should have ≥1 snapshot after first run, got ${snapshotsAfterFirst}`
          )
          log.debug('Replicated VM snapshot count after first run', { label, snapshots: snapshotsAfterFirst })

          log.debug('Checking CONTENT_KEY propagation after first run', { label })
          await assertContentKeyInvariants(jobId, replicatedVmUuid)
          log.debug('CONTENT_KEY invariants verified after first run', { label })

          // --- Run 2: incremental transfer, same VM reused ---
          log.debug('Running second replication (expected incremental, same VM reused)', { label })
          const result2 = await dispatchClient.backup.runJobAndGetLog(jobId, scheduleKey)
          assertBackupSuccess(result2, 'Second replication')
          assertFullOrDeltaForSr(result2, destSr.uuid, { mustBeFull: false })

          const bytes2 = getBackupTransferredBytes(result2)
          log.debug('Second run transferred (incremental)', { label, bytes: bytes2 })

          if (bytes1 !== null && bytes2 !== null) {
            assert.ok(
              bytes2 <= bytes1,
              `Incremental transfer (${bytes2} bytes) should be ≤ full transfer (${bytes1} bytes)`
            )
          }

          const newUuids2 = await findNewVmUuids(vmUuidsBefore)
          assert.strictEqual(
            newUuids2.length,
            1,
            `Second replication should NOT create a new VM — expected 1 total, got ${newUuids2.length}`
          )
          assert.strictEqual(
            newUuids2[0],
            replicatedVmUuid,
            `Second replication should reuse VM ${replicatedVmUuid}, got ${newUuids2[0]}`
          )

          const snapshotsAfterSecond = (await dispatchClient.vm.details(replicatedVmUuid)).snapshots?.length ?? 0
          assert.ok(
            snapshotsAfterSecond > snapshotsAfterFirst,
            `Replicated VM should accumulate snapshots across runs (before: ${snapshotsAfterFirst}, after: ${snapshotsAfterSecond})`
          )
          log.debug('VM reused', {
            label,
            uuid: replicatedVmUuid,
            snapshotsBefore: snapshotsAfterFirst,
            snapshotsAfter: snapshotsAfterSecond,
          })

          log.debug('Checking CONTENT_KEY propagation after second run', { label })
          await assertContentKeyInvariants(jobId, replicatedVmUuid)
          log.debug('CONTENT_KEY invariants verified after second run', { label })

          // --- Run 3: destination VM started (DR site in use), incremental but new VM ---
          //
          // Starting and stopping the replicated VM dirtied its active disk relative to the
          // last replication snapshot. IncrementalXapiWriter detects changed blocks on the
          // destination's active VDI and cannot update it in place — a new VM is created.
          // CONTENT_KEY still matches a common snapshot, so the transfer stays incremental.
          log.debug('Starting replicated VM to simulate DR site in use', { label })
          await dispatchClient.vm.start(replicatedVmUuid, { force: true })
          await dispatchClient.vm.waitForPowerState(replicatedVmUuid, 'Running', 60_000)
          log.debug('Replicated VM is running', { label })
          await new Promise(resolve => setTimeout(resolve, 30_000))
          await dispatchClient.vm.stop(replicatedVmUuid, { force: true })
          await dispatchClient.vm.waitForPowerState(replicatedVmUuid, 'Halted', 60_000)

          log.debug('Running third replication (delta transfer, but new VM expected)', { label })
          const result3 = await dispatchClient.backup.runJobAndGetLog(jobId, scheduleKey)
          assertBackupSuccess(result3, 'Third replication (after destination VM started)')
          assertFullOrDeltaForSr(result3, destSr.uuid, { mustBeFull: false })

          const newUuids3 = await findNewVmUuids(vmUuidsBefore)
          assert.strictEqual(
            newUuids3.length,
            2,
            `Third replication should have created a second VM on destination (got ${newUuids3.length} new VMs total)`
          )
          const secondReplicaUuid = newUuids3.find(u => u !== replicatedVmUuid)
          assert.ok(secondReplicaUuid, 'A distinct second replica VM should exist on the destination')
          assert.notStrictEqual(
            secondReplicaUuid,
            vm.uuid,
            `Second replica UUID must differ from source VM UUID (${vm.uuid})`
          )
          replicatedVmUuids.push(secondReplicaUuid)

          log.debug('New replica created', { label, newUuid: secondReplicaUuid, originalUuid: replicatedVmUuid })
        })
      })
    })
  }

  // ===========================================================================
  // Bi-directional replication — planned switch to disaster site
  //
  // Scenario: prod → DR (Job A, one run), then DR → prod (Job B, first run).
  // Job B has never run before, but CONTENT_KEY matching lets it reuse the
  // common snapshot from Job A, making the reverse transfer incremental.
  // ===========================================================================

  describe('Bi-directional — planned switch to disaster site', () => {
    /** @type {{uuid: string, name_label: string}} */
    let destSr
    /** @type {Array<string>} VMs created on destSr during this test */
    const replicatedVmUuids = []

    before(async () => {
      destSr = await dispatchClient.sr.details(REPLICATION_DESTINATION_SR_ID)
      assert.ok(destSr, `Destination SR "${REPLICATION_DESTINATION_SR_ID}" not found`)
      log.debug('DR SR', { name: destSr.name_label, uuid: destSr.uuid })
    })

    after(async () => cleanupVms(replicatedVmUuids))

    it('should transfer delta from DR to prod and update the source VM in place', async () => {
      // The source VM must be halted so its active disk is clean relative to
      // the last replication snapshot — this lets Job B update it in place.
      const currentVmState = await dispatchClient.vm.details(vm.uuid)
      if (currentVmState.power_state === 'Running') {
        log.debug('Stopping source VM for planned-switch test')
        await dispatchClient.vm.stop(vm.uuid, { force: true })
        await dispatchClient.vm.waitForPowerState(vm.uuid, 'Halted', 60_000)
      }

      // --- Job A: prod → DR (one run, full transfer) ---
      log.debug('Job A: replicating source VM to DR SR')
      const { jobId: jobAId, scheduleKey: scheduleKeyA } = await createReplicationJob(
        vm,
        destSr.uuid,
        'to disaster recovery site'
      )
      const vmUuidsBeforeA = new Set((await dispatchClient.vm.list()).map(v => v.uuid))

      const resultA = await dispatchClient.backup.runJobAndGetLog(jobAId, scheduleKeyA)
      assertBackupSuccess(resultA, 'Job A (prod → DR)')
      assertFullOrDeltaForSr(resultA, destSr.uuid, { mustBeFull: true })

      const newUuidsA = await findNewVmUuids(vmUuidsBeforeA)
      assert.strictEqual(newUuidsA.length, 1, 'Job A should create exactly one new VM on DR SR')
      const replicatedVmUuid = newUuidsA[0]
      assert.notStrictEqual(replicatedVmUuid, vm.uuid, 'Replicated VM UUID must differ from source VM UUID')
      replicatedVmUuids.push(replicatedVmUuid)

      const replicatedVm = await dispatchClient.vm.details(replicatedVmUuid)
      log.debug('Replicated VM on DR SR', { name: replicatedVm.name_label, uuid: replicatedVmUuid })

      // --- Job B: DR → prod ---
      log.debug('Job B: creating reverse replication job (DR → prod)')
      const { jobId: jobBId, scheduleKey: scheduleKeyB } = await createReplicationJob(
        replicatedVm,
        sourceVmSrUuid,
        'to PROD site'
      )

      // Force-start the replicated VM to simulate the DR site being in active use.
      log.debug('Force-starting replicated VM (DR site now active)')
      await dispatchClient.vm.start(replicatedVmUuid, { force: true })
      await dispatchClient.vm.waitForPowerState(replicatedVmUuid, 'Running', 60_000)
      await new Promise(resolve => setTimeout(resolve, 30_000))
      log.debug('Replicated VM is running on DR SR')

      const vmUuidsBeforeB = new Set((await dispatchClient.vm.list()).map(v => v.uuid))
      const snapshotsOnSourceBefore = (await dispatchClient.vm.details(vm.uuid)).snapshots?.length ?? 0

      const resultB = await dispatchClient.backup.runJobAndGetLog(jobBId, scheduleKeyB)
      assertBackupSuccess(resultB, 'Job B (DR → prod)')

      // Job B has never run before, but CONTENT_KEY matches the snapshot from
      // Job A → the transfer must be incremental, not a full copy.
      assertFullOrDeltaForSr(resultB, sourceVmSrUuid, { mustBeFull: false })

      // The source VM's active disk was clean (halted, no writes since the
      // Job A snapshot) → Job B updates it in place, no new VM on the source SR.
      const newUuidsAfterB = await findNewVmUuids(vmUuidsBeforeB)
      const unexpectedNewVms = newUuidsAfterB.filter(u => u !== replicatedVmUuid)
      assert.strictEqual(
        unexpectedNewVms.length,
        0,
        `Job B should update the source VM in place, not create a new VM (got ${unexpectedNewVms.length} unexpected new VM(s))`
      )

      // The source VM must carry a new snapshot written by Job B.
      const snapshotsOnSourceAfter = (await dispatchClient.vm.details(vm.uuid)).snapshots?.length ?? 0
      assert.ok(
        snapshotsOnSourceAfter > snapshotsOnSourceBefore,
        `Source VM should have gained a snapshot from Job B (before: ${snapshotsOnSourceBefore}, after: ${snapshotsOnSourceAfter})`
      )

      log.debug('Planned switch completed — delta transfer confirmed, source VM updated in place', {
        snapshotsBefore: snapshotsOnSourceBefore,
        snapshotsAfter: snapshotsOnSourceAfter,
      })
    })
  })

  // ===========================================================================
  // deleteFirst — regression coverage for IncrementalXapiWriter
  //
  // `deleteFirst` is meant to delete the replicas that retention is about to
  // prune *before* the new transfer starts, so the destination SR only ever
  // has to hold `copyRetention` replicas worth of space at once instead of
  // `copyRetention + 1`. A previous bug inverted the guard
  // (`settings.deleteFirst && settings.skipDeleteOldEntries` instead of
  // `!settings.skipDeleteOldEntries`), which silently disabled this behaviour
  // for normal (non-distributed) replication jobs: the stale replica was only
  // removed in `cleanup()`, *after* the new transfer had already completed —
  // the opposite of what a space-constrained destination SR needs, and the
  // cause of "not enough space" failures reported for this flag.
  // ===========================================================================

  describe('deleteFirst', () => {
    /** @type {{uuid: string, name_label: string}} */
    let destSr

    before(async () => {
      destSr = await dispatchClient.sr.details(REPLICATION_DESTINATION_SR_ID)
      assert.ok(destSr, `Destination SR "${REPLICATION_DESTINATION_SR_ID}" not found`)
      log.debug('deleteFirst destination SR', { name: destSr.name_label, uuid: destSr.uuid })
    })

    describe('copyRetention: 1 — frees space before the next transfer instead of after', () => {
      const replicatedVmUuids = []

      after(async () => cleanupVms(replicatedVmUuids))

      it('frees the pruned snapshot before the second transfer instead of after it', async () => {
        const { jobId, scheduleKey } = await createReplicationJob(vm, destSr.uuid, 'deleteFirst r1', {
          copyRetention: 1,
          deleteFirst: true,
        })
        const vmUuidsBefore = new Set((await dispatchClient.vm.list()).map(v => v.uuid))

        // --- Run 1: creates the first replica (baseline usage) ---
        const result1 = await dispatchClient.backup.runJobAndGetLog(jobId, scheduleKey)
        assertBackupSuccess(result1, 'First replication')
        assertFullOrDeltaForSr(result1, destSr.uuid, { mustBeFull: true })

        const newUuids1 = await findNewVmUuids(vmUuidsBefore)
        // Track before asserting the count, so a failed assertion can't leak
        // a replica onto the destination SR.
        replicatedVmUuids.push(...newUuids1)
        assert.strictEqual(newUuids1.length, 1, 'First replication should create exactly one replica VM')
        const replicaVmUuid = newUuids1[0]

        // The target VM persists across runs — only its snapshots are subject
        // to retention (see IncrementalXapiWriter._prepare). So the signal for
        // "was the old copy freed first" is the snapshot count on this VM and
        // the destination SR's usage, not whether the VM itself gets destroyed.
        const snapshotsAfterRun1 = (await dispatchClient.vm.details(replicaVmUuid)).snapshots?.length ?? 0
        assert.ok(snapshotsAfterRun1 > 0, 'The replica VM should have at least one snapshot after the first run')
        log.debug('Replica snapshot count after run 1', { snapshotsAfterRun1 })

        const usageAfterRun1 = (await dispatchClient.sr.details(destSr.uuid)).physical_usage
        assert.ok(usageAfterRun1 > 0, 'Destination SR usage should be > 0 after the first replica is created')
        log.debug('Destination SR usage after run 1', { usageAfterRun1 })

        // --- Run 2: with copyRetention 1, the run-1 snapshot is entirely
        // "old" and must be destroyed by _prepare() *before* the transfer,
        // not by cleanup() after it. Poll SR usage and the replica's snapshot
        // count while the job runs: with the bug, the old snapshot survives
        // until cleanup() and usage climbs towards ~2x during the transfer;
        // with the fix, the old snapshot should be gone well before the run
        // completes, and usage should stay close to a single replica's
        // footprint throughout.
        const pollState = { running: true }
        let peakUsage = 0
        let minSnapshotCountDuringRun = Infinity

        const pollUsage = (async () => {
          while (pollState.running) {
            try {
              const [sr, replicaVm] = await Promise.all([
                dispatchClient.sr.details(destSr.uuid),
                dispatchClient.vm.details(replicaVmUuid),
              ])
              peakUsage = Math.max(peakUsage, sr.physical_usage)
              minSnapshotCountDuringRun = Math.min(minSnapshotCountDuringRun, replicaVm.snapshots?.length ?? 0)
            } catch (error) {
              log.warn('Polling error (ignored)', { error })
            }
            await delay(1_000)
          }
        })()

        const result2 = await dispatchClient.backup.runJobAndGetLog(jobId, scheduleKey)
        pollState.running = false
        await pollUsage

        assertBackupSuccess(result2, 'Second replication')

        // --- Assertions ---

        // We must have observed the snapshot count drop below its run-1 level
        // at some point while polling during run 2 — i.e. the old snapshot
        // was destroyed as part of *this* run's preparation, not left
        // dangling until after the transfer (where it would instead briefly
        // rise to run1 + 1 before being pruned back down by cleanup()).
        assert.ok(
          minSnapshotCountDuringRun < snapshotsAfterRun1,
          `Expected the replica's snapshot count to drop below ${snapshotsAfterRun1} at some point during ` +
            `the second run (old snapshot freed first), but the minimum observed was ${minSnapshotCountDuringRun}. ` +
            'This would indicate the old snapshot was only removed after the new transfer completed.'
        )

        // The destination should never have needed to hold ~2 replicas' worth
        // of data at once. Some slack is allowed for VM/VDI metadata overhead
        // and the brief window it takes to issue the delete, but it must stay
        // well under "old + new" (which would show up as usage close to 2x
        // usageAfterRun1).
        assert.ok(
          peakUsage < usageAfterRun1 * 1.5,
          `Destination SR usage peaked at ${peakUsage} bytes during the second run, ` +
            `expected it to stay close to a single replica's footprint (~${usageAfterRun1} bytes). ` +
            `A peak near ${usageAfterRun1 * 2} bytes would indicate the old replica was not freed first.`
        )

        // Never delete too much: the replica VM itself must still be there
        // (it's reused, not recreated) and must still have exactly the
        // retained snapshot count — never zero, never more than retention.
        const newUuids2 = await findNewVmUuids(vmUuidsBefore)
        replicatedVmUuids.length = 0
        replicatedVmUuids.push(...newUuids2)
        assert.strictEqual(
          newUuids2.length,
          1,
          `Expected exactly 1 replica VM after run 2 with copyRetention: 1, got ${newUuids2.length}`
        )
        assert.strictEqual(newUuids2[0], replicaVmUuid, 'Run 2 should reuse the same replica VM, not create a new one')

        const snapshotsAfterRun2 = (await dispatchClient.vm.details(replicaVmUuid)).snapshots?.length ?? 0
        assert.strictEqual(
          snapshotsAfterRun2,
          snapshotsAfterRun1,
          `Expected the replica to end up with exactly ${snapshotsAfterRun1} snapshot(s) (copyRetention: 1) after ` +
            `run 2, got ${snapshotsAfterRun2} — never delete too much (0) or too little (>${snapshotsAfterRun1}).`
        )
      })
    })

    describe('copyRetention: 2 — must not delete the still-needed incremental base', () => {
      const replicatedVmUuids = []

      after(async () => cleanupVms(replicatedVmUuids))

      it('keeps the base replica intact across a deleteFirst run when retention allows more than one copy', async () => {
        const { jobId, scheduleKey } = await createReplicationJob(vm, destSr.uuid, 'deleteFirst r2', {
          copyRetention: 2,
          deleteFirst: true,
        })
        const vmUuidsBefore = new Set((await dispatchClient.vm.list()).map(v => v.uuid))

        const result1 = await dispatchClient.backup.runJobAndGetLog(jobId, scheduleKey)
        assertBackupSuccess(result1, 'First replication')
        assertFullOrDeltaForSr(result1, destSr.uuid, { mustBeFull: true })

        const newUuids1 = await findNewVmUuids(vmUuidsBefore)
        replicatedVmUuids.push(...newUuids1)
        assert.strictEqual(newUuids1.length, 1, 'First replication should create exactly one replica VM')
        const replicaA = newUuids1[0]

        // With copyRetention: 2 there is nothing yet to prune (only 1 entry
        // exists), so deleteFirst must not touch replicaA — it is the
        // mandatory base for the incremental transfer that follows.
        const result2 = await dispatchClient.backup.runJobAndGetLog(jobId, scheduleKey)
        assertBackupSuccess(result2, 'Second replication')
        assertFullOrDeltaForSr(result2, destSr.uuid, { mustBeFull: false })

        assert.strictEqual(
          await vmExists(replicaA),
          true,
          'The base replica must still exist after a deleteFirst run that has nothing to prune yet'
        )

        const newUuids2 = await findNewVmUuids(vmUuidsBefore)
        assert.strictEqual(
          newUuids2.length,
          1,
          `deleteFirst must not have created an extra replica or lost the base one, got ${newUuids2.length} total`
        )
        assert.strictEqual(newUuids2[0], replicaA, 'The second run should reuse/extend the same base replica')
      })
    })
  })
})
