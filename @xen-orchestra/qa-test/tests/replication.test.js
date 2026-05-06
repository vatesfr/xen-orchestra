import assert from 'node:assert'
import { after, before, describe, it } from 'node:test'

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
    vm = setupResult.vm

    assert.ok(vm, 'Setup should provide a test VM')

    // Determine the SR where the test VM's disks live so we can run the
    // "same SR" scenario without hard-coding an extra env variable.
    const vdis = await dispatchClient.vdi.getVdisForVm(vm.uuid)
    assert.ok(vdis.length > 0, 'Test VM should have at least one VDI')
    sourceVmSrUuid = vdis[0].SR
    assert.ok(sourceVmSrUuid, 'Could not determine source SR from VM VDIs')

    console.log(`Test VM: ${vm.name_label} (${vm.uuid}), source SR: ${sourceVmSrUuid}`)

    // Start the source VM so its disks are active during replication.
    // No need to wait for the OS to fully boot — the VM being in Running
    // state is enough to guarantee writes on the active VDI.
    await dispatchClient.vm.start(vm.uuid)
    console.log(`Source VM started (booting in background): ${vm.uuid}`)
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
        console.warn(`Failed to stop source VM before teardown: ${error.message}`)
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
        console.log(`Cleaned up VM: ${vmUuid}`)
      } catch (error) {
        console.warn(`Failed to clean up VM ${vmUuid}: ${error.message}`)
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
        console.log(`[${label}] Destination SR: ${destSr.name_label} (${destSr.uuid})`)
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
          console.log(`[${label}] Running first replication (expected full)...`)
          const result1 = await dispatchClient.backup.runJobAndGetLog(jobId, scheduleKey)
          assertBackupSuccess(result1, 'First replication')
          assertFullOrDeltaForSr(result1, destSr.uuid, { mustBeFull: true })

          const bytes1 = getBackupTransferredBytes(result1)
          console.log(`[${label}] First run transferred: ${bytes1} bytes (full)`)

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
          console.log(`[${label}] Replicated VM created: ${replicatedVm.name_label} (${replicatedVmUuid})`)

          const snapshotTask1 = findTaskByMessage(result1, 'target snapshot')
          assert.ok(snapshotTask1, 'First replication should include a "target snapshot" task')
          assert.strictEqual(snapshotTask1.status, 'success', 'Target snapshot task should succeed')

          const snapshotsAfterFirst = (await dispatchClient.vm.details(replicatedVmUuid)).snapshots?.length ?? 0
          assert.ok(
            snapshotsAfterFirst >= 1,
            `Replicated VM should have ≥1 snapshot after first run, got ${snapshotsAfterFirst}`
          )
          console.log(`[${label}] Replicated VM has ${snapshotsAfterFirst} snapshot(s) after first run`)

          console.log(`[${label}] Checking CONTENT_KEY propagation after first run...`)
          await assertContentKeyInvariants(jobId, replicatedVmUuid)
          console.log(`[${label}] CONTENT_KEY invariants verified after first run`)

          // --- Run 2: incremental transfer, same VM reused ---
          console.log(`[${label}] Running second replication (expected incremental, same VM reused)...`)
          const result2 = await dispatchClient.backup.runJobAndGetLog(jobId, scheduleKey)
          assertBackupSuccess(result2, 'Second replication')
          assertFullOrDeltaForSr(result2, destSr.uuid, { mustBeFull: false })

          const bytes2 = getBackupTransferredBytes(result2)
          console.log(`[${label}] Second run transferred: ${bytes2} bytes (incremental)`)

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
          console.log(
            `[${label}] VM ${replicatedVmUuid} reused: snapshots ${snapshotsAfterFirst} → ${snapshotsAfterSecond}`
          )

          console.log(`[${label}] Checking CONTENT_KEY propagation after second run...`)
          await assertContentKeyInvariants(jobId, replicatedVmUuid)
          console.log(`[${label}] CONTENT_KEY invariants verified after second run`)

          // --- Run 3: destination VM started (DR site in use), incremental but new VM ---
          //
          // Starting and stopping the replicated VM dirtied its active disk relative to the
          // last replication snapshot. IncrementalXapiWriter detects changed blocks on the
          // destination's active VDI and cannot update it in place — a new VM is created.
          // CONTENT_KEY still matches a common snapshot, so the transfer stays incremental.
          console.log(`[${label}] Starting replicated VM to simulate DR site in use...`)
          await dispatchClient.vm.start(replicatedVmUuid, { force: true })
          await dispatchClient.vm.waitForPowerState(replicatedVmUuid, 'Running', 60_000)
          console.log(`[${label}] Replicated VM is running`)
          await new Promise(resolve => setTimeout(resolve, 30_000))
          await dispatchClient.vm.stop(replicatedVmUuid, { force: true })
          await dispatchClient.vm.waitForPowerState(replicatedVmUuid, 'Halted', 60_000)

          console.log(`[${label}] Running third replication (delta transfer, but new VM expected)...`)
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

          console.log(`[${label}] New replica created: ${secondReplicaUuid} (original ${replicatedVmUuid} kept)`)
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
      console.log(`DR SR: ${destSr.name_label} (${destSr.uuid})`)
    })

    after(async () => cleanupVms(replicatedVmUuids))

    it('should transfer delta from DR to prod and update the source VM in place', async () => {
      // The source VM must be halted so its active disk is clean relative to
      // the last replication snapshot — this lets Job B update it in place.
      const currentVmState = await dispatchClient.vm.details(vm.uuid)
      if (currentVmState.power_state === 'Running') {
        console.log('Stopping source VM for planned-switch test...')
        await dispatchClient.vm.stop(vm.uuid, { force: true })
        await dispatchClient.vm.waitForPowerState(vm.uuid, 'Halted', 60_000)
      }

      // --- Job A: prod → DR (one run, full transfer) ---
      console.log('Job A: replicating source VM to DR SR...')
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
      console.log(`Replicated VM on DR SR: ${replicatedVm.name_label} (${replicatedVmUuid})`)

      // --- Job B: DR → prod ---
      console.log('Job B: creating reverse replication job (DR → prod)...')
      const { jobId: jobBId, scheduleKey: scheduleKeyB } = await createReplicationJob(
        replicatedVm,
        sourceVmSrUuid,
        'to PROD site'
      )

      // Force-start the replicated VM to simulate the DR site being in active use.
      console.log('Force-starting replicated VM (DR site now active)...')
      await dispatchClient.vm.start(replicatedVmUuid, { force: true })
      await dispatchClient.vm.waitForPowerState(replicatedVmUuid, 'Running', 60_000)
      await new Promise(resolve => setTimeout(resolve, 30_000))
      console.log('Replicated VM is running on DR SR')

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

      console.log(
        `Planned switch completed — delta transfer confirmed, source VM updated in place ` +
          `(snapshots: ${snapshotsOnSourceBefore} → ${snapshotsOnSourceAfter})`
      )
    })
  })
})
