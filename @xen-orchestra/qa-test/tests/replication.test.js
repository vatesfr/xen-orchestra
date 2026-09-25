import assert from 'node:assert'
import { after, before, describe, it } from 'node:test'
import { createLogger } from '@xen-orchestra/log'

import {
  assertFullOrDeltaForSr,
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
   * @returns {Promise<{jobId: string, scheduleKey: string}>}
   */
  const createReplicationJob = async (sourceVm, targetSrUuid, baseName = '') => {
    const name = baseName + ' ' + generateBackupJobName()
    const schedule = getDefaultSchedule()
    const config = {
      name,
      mode: 'delta',
      schedules: { '': schedule },
      settings: { '': { timezone: 'Europe/Paris', copyRetention: 3, preferNbd: true, bypassVdiChainsCheck: true } },
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
  // ADDITIONS to replication.test.js — retention regression coverage for the
  // setOldReplicaList() scheduleId fix in AbstractAggregatedXapiWriter.
  //
  // Assumptions to verify/adjust against the actual backup job API before running:
  //   1. `getDefaultSchedule()` / job creation shape for multiple schedules on one
  //      job — adjust `schedules`/`settings` keys below to match how your
  //      dispatchClient actually keys multiple schedules (this mirrors the
  //      single-schedule `{ '': schedule }` pattern used elsewhere in the file,
  //      extended to two named keys).
  //   2. `dispatchClient.backup.runJobAndGetLog(jobId, scheduleKey)` — assumed to
  //      run only the given schedule's writers, not all schedules on the job.
  //   3. `settings.fullInterval` — if your delta backup settings don't expose a
  //      `fullInterval` at all (some setups always look for a common ancestor
  //      snapshot rather than forcing a full every N runs), replace
  //      `fullInterval` below with 1 and simply iterate more times; the
  //      important thing for this regression is running enough times to exceed
  //      `copyRetention` and confirm the count stabilizes rather than growing
  //      unbounded or being pruned incorrectly.
  // ===========================================================================

  describe('Retention regression — setOldReplicaList scheduleId fix', () => {
    /** @type {{uuid: string, name_label: string}} */
    let destSr
    /** @type {Array<string>} */
    const replicatedVmUuids = []

    before(async () => {
      if (!REPLICATION_DESTINATION_SR_ID) return
      destSr = await dispatchClient.sr.details(REPLICATION_DESTINATION_SR_ID)
      assert.ok(destSr, `Destination SR "${REPLICATION_DESTINATION_SR_ID}" not found`)
    })

    after(async () => cleanupVms(replicatedVmUuids))

    // -------------------------------------------------------------------------
    // Scenario 1: run a single-schedule replication job fullInterval + 1 times
    // and confirm the number of snapshots/replicated VMs on the target matches
    // retention — neither growing unbounded (retention never applied because
    // scheduleId was undefined and nothing matched) nor over-pruned (retention
    // applied against the wrong / empty schedule scope).
    // -------------------------------------------------------------------------
    describe('single schedule, run fullInterval + 1 times', () => {
      it('prunes old replicas down to copyRetention after fullInterval + 1 runs', async function () {
        if (!REPLICATION_DESTINATION_SR_ID) return this.skip('REPLICATION_DESTINATION_SR_ID not configured')

        const copyRetention = 3
        const fullInterval = 2 // adjust to your job settings' actual semantics, see note above
        const runs = fullInterval + 1

        const name = 'retention single schedule ' + generateBackupJobName()
        const schedule = getDefaultSchedule()
        const config = {
          name,
          mode: 'delta',
          schedules: { '': schedule },
          settings: {
            '': { timezone: 'Europe/Paris', copyRetention, fullInterval, preferNbd: true, bypassVdiChainsCheck: true },
          },
          vms: { [vm.uuid]: vm },
          srs: { [destSr.uuid]: true },
        }

        const jobId = await dispatchClient.backup.createBackupJob(config)
        tracker.trackResource('backupJob', jobId, { name, mode: 'delta' })
        const job = await dispatchClient.backup.details(jobId)
        const scheduleKey = getScheduleKey(job)
        tracker.trackResource('schedule', scheduleKey, { name, backupJobId: jobId })

        const vmUuidsBefore = new Set((await dispatchClient.vm.list()).map(v => v.uuid))

        let replicatedVmUuid
        for (let i = 1; i <= runs; i++) {
          log.debug(`Retention run ${i}/${runs}`, { jobId })
          const result = await dispatchClient.backup.runJobAndGetLog(jobId, scheduleKey)
          assertBackupSuccess(result, `Retention run ${i}`)

          const newUuids = await findNewVmUuids(vmUuidsBefore)
          assert.strictEqual(newUuids.length, 1, `Run ${i} should reuse a single replicated VM, not create extras`)
          replicatedVmUuid = newUuids[0]
        }
        replicatedVmUuids.push(replicatedVmUuid)

        const finalSnapshotCount = (await dispatchClient.vm.details(replicatedVmUuid)).snapshots?.length ?? 0

        // The retained snapshot count must not exceed copyRetention (allowing for the
        // in-flight snapshot of the run that just completed) and, critically, must not
        // be 0 or unbounded — both of which indicate the scheduleId scoping bug.
        assert.ok(
          finalSnapshotCount > 0,
          'Replicated VM must retain at least one snapshot — 0 indicates retention deleted everything ' +
            '(scheduleId mismatch causing every replica to match "old")'
        )
        assert.ok(
          finalSnapshotCount <= copyRetention,
          `Replicated VM should retain at most copyRetention (${copyRetention}) snapshots after ${runs} runs, ` +
            `got ${finalSnapshotCount} — indicates retention was never applied (scheduleId was undefined and ` +
            'matched nothing)'
        )

        log.debug('Retention verified after fullInterval + 1 runs', {
          runs,
          copyRetention,
          finalSnapshotCount,
        })
      })
    })

    // -------------------------------------------------------------------------
    // Scenario 2: one job, two schedules targeting the same VM + same SR, each
    // with a DIFFERENT copyRetention. This is exactly the case the bug breaks:
    // before the fix, scheduleId was undefined, so listReplicatedVms could not
    // scope replicas to their own schedule — either schedule A's retention
    // would prune schedule B's replicas (or vice versa), or nothing would be
    // pruned at all.
    // -------------------------------------------------------------------------
    describe('multiple schedules, same VM and SR, distinct retentions', () => {
      it('applies each schedule’s own copyRetention independently', async function () {
        if (!REPLICATION_DESTINATION_SR_ID) return this.skip('REPLICATION_DESTINATION_SR_ID not configured')

        const retentionA = 2
        const retentionB = 4
        const runsA = retentionA + 2 // exceed retention so pruning must have kicked in
        const runsB = retentionB + 2

        const name = 'retention multi schedule ' + generateBackupJobName()
        const scheduleA = getDefaultSchedule()
        const scheduleB = getDefaultSchedule()

        const config = {
          name,
          mode: 'delta',
          schedules: { scheduleA, scheduleB },
          settings: {
            scheduleA: {
              timezone: 'Europe/Paris',
              copyRetention: retentionA,
              preferNbd: true,
              bypassVdiChainsCheck: true,
            },
            scheduleB: {
              timezone: 'Europe/Paris',
              copyRetention: retentionB,
              preferNbd: true,
              bypassVdiChainsCheck: true,
            },
          },
          vms: { [vm.uuid]: vm },
          srs: { [destSr.uuid]: true },
        }

        const jobId = await dispatchClient.backup.createBackupJob(config)
        tracker.trackResource('backupJob', jobId, { name, mode: 'delta' })
        const job = await dispatchClient.backup.details(jobId)
        log.debug('Created multi-schedule job', {
          jobId,
          schedules: job.schedules,
          settings: job.settings,
        })

        // job.schedules is expected to be keyed the same way it was created;
        // adjust this lookup if getScheduleKey() only supports a single schedule.
        const scheduleKeys = Object.keys(job.settings ?? {}).filter(key => key !== '')
        assert.strictEqual(
          scheduleKeys.length,
          2,
          `Job should have exactly two schedules; settings=${JSON.stringify(job.settings)}`
        )

        for (const key of scheduleKeys) tracker.trackResource('schedule', key, { name, backupJobId: jobId })
        const [scheduleKeyA, scheduleKeyB] = scheduleKeys

        const vmUuidsBefore = new Set((await dispatchClient.vm.list()).map(v => v.uuid))

        // Run schedule A to just past its own retention.
        let replicaA
        for (let i = 1; i <= runsA; i++) {
          log.debug(`Schedule A run ${i}/${runsA}`, { jobId })
          const result = await dispatchClient.backup.runJobAndGetLog(jobId, scheduleKeyA)
          assertBackupSuccess(result, `Schedule A run ${i}`)
          const newUuids = await findNewVmUuids(vmUuidsBefore)
          // First run creates the VM; subsequent runs of the SAME schedule should
          // reuse it. If schedule B has not run yet, exactly one new VM should exist.
          replicaA = newUuids.find(u => u !== vm.uuid)
          assert.ok(replicaA, `Schedule A run ${i} should have a replicated VM`)
        }

        const snapshotsA_afterA = (await dispatchClient.vm.details(replicaA)).snapshots?.length ?? 0
        assert.ok(
          snapshotsA_afterA > 0 && snapshotsA_afterA <= retentionA,
          `Schedule A's replica should retain at most retentionA (${retentionA}) snapshots after ${runsA} runs, ` +
            `got ${snapshotsA_afterA}`
        )

        // Now run schedule B the same number of extra times. If the bug is present,
        // running B could (a) create its own separate replica VM that never gets
        // pruned to retentionB, or (b) — worse — prune schedule A's replica against
        // retentionB (or vice-versa) because both writers resolved scheduleId to
        // undefined and could not tell the two schedules' replicas apart.
        let replicaB
        for (let i = 1; i <= runsB; i++) {
          log.debug(`Schedule B run ${i}/${runsB}`, { jobId })
          const result = await dispatchClient.backup.runJobAndGetLog(jobId, scheduleKeyB)
          assertBackupSuccess(result, `Schedule B run ${i}`)
          const newUuids = await findNewVmUuids(vmUuidsBefore)
          const candidates = newUuids.filter(u => u !== vm.uuid && u !== replicaA)
          assert.ok(candidates.length >= 1, `Schedule B run ${i} should have its own replicated VM, distinct from A's`)
          replicaB = candidates[0]
        }

        replicatedVmUuids.push(replicaA, replicaB)

        assert.notStrictEqual(replicaA, replicaB, 'Schedule A and schedule B must produce distinct replicated VMs')

        const snapshotsA_final = (await dispatchClient.vm.details(replicaA)).snapshots?.length ?? 0
        const snapshotsB_final = (await dispatchClient.vm.details(replicaB)).snapshots?.length ?? 0

        // Core regression assertion: each schedule's retention must hold, independently,
        // after the OTHER schedule has also run several times against the same VM/SR.
        assert.ok(
          snapshotsA_final > 0 && snapshotsA_final <= retentionA,
          `Schedule A's replica should still respect retentionA (${retentionA}) after schedule B also ran, ` +
            `got ${snapshotsA_final} — a value > retentionA would indicate schedule B's retention run affected ` +
            `schedule A's replicas (or vice versa)`
        )
        assert.ok(
          snapshotsB_final > 0 && snapshotsB_final <= retentionB,
          `Schedule B's replica should respect retentionB (${retentionB}), got ${snapshotsB_final}`
        )

        log.debug('Multi-schedule retention verified', {
          retentionA,
          snapshotsA_final,
          retentionB,
          snapshotsB_final,
        })
      })
    })
  })
})
