// installs the transports, including the one capturing every debug record to a file in
// os.tmpdir() — must come first so nothing is logged before it is configured
import '../logSetup.js'

import assert from 'node:assert/strict'
import { after, before, describe, it } from 'node:test'

import { createLogger } from '@xen-orchestra/log'

import { DispatchClient } from '../client/dispatchClient.js'
import { createResourceTracker } from '../utils/resourceTracker.js'
import { getRequiredEnv } from '../utils/index.js'
import { formatBytes } from '../utils/exportUtils.js'
import {
  assertRawExportsAreIdentical,
  assertSourceIsRunningWithoutSnapshot,
  assertTransferSequence,
  churnSourceByReset,
  connectToEsxi,
  getAndLogSourceState,
  getEsxiConfig,
  getEsxiSkipReason,
  getOrderedDisks,
  optionalEnv,
  resetSourceState,
  waitForBlockedOperations,
  waitForSourceSnapshot,
} from '../utils/esxiMigrationUtils.js'

const log = createLogger('qa:import:esxi')

const XO_SNAPSHOT_NAME = '[V2V] migration to XCP-ng'

describe('ESXi migration (V2V)', { skip: getEsxiSkipReason() }, () => {
  /** @type {import('../client/dispatchClient.js').DispatchClient} */
  let dispatchClient
  /** @type {Object} */
  let tracker
  /** @type {import('@xen-orchestra/vmware-explorer/esxi.mjs').default} */
  let esxi
  /** @type {ReturnType<typeof getEsxiConfig>} */
  let esxiConfig
  /** @type {Object} */
  let sourceMetadata
  /** Parameters shared by every `vm.importFromEsxi` call */
  let migrationParams

  before(async () => {
    esxiConfig = getEsxiConfig()

    dispatchClient = new DispatchClient()
    await dispatchClient.initialize()
    tracker = createResourceTracker()

    esxi = await connectToEsxi(esxiConfig)
    sourceMetadata = await assertSourceIsRunningWithoutSnapshot(esxi, esxiConfig.vmId)

    const sr = await dispatchClient.sr.details(getRequiredEnv('SR_ID'))
    assert.notEqual(sr, undefined, 'SR_ID does not resolve to an SR')

    migrationParams = {
      host: esxiConfig.host,
      user: esxiConfig.user,
      password: esxiConfig.password,
      sslVerify: esxiConfig.sslVerify,
      vm: esxiConfig.vmId,
      sr: sr.uuid,
      network: await findNetwork(dispatchClient, sr.$pool),
      template: await findTemplate(dispatchClient, sr.$pool),
    }

    log.info('Ready to migrate source VM', {
      name: sourceMetadata.name_label,
      vmId: esxiConfig.vmId,
      disks: sourceMetadata.disks.length,
      sr: sr.name_label,
    })
    log.debug('Migration parameters', { ...migrationParams, password: '<redacted>' })
    log.debug('Resolved timings', {
      requestTimeoutMinutes: Math.round(esxiConfig.timeout / 60_000),
      resetSettleSeconds: Math.round(esxiConfig.resetSettleMs / 1000),
    })
    log.debug('Target pool objects resolved', {
      pool: sr.$pool,
      sr: { uuid: sr.uuid, name_label: sr.name_label },
      network: migrationParams.network,
      template: migrationParams.template,
    })
  })

  after(async () => {
    // put the source back to running without snapshots, so the suite can be run again
    // without touching ESXi by hand
    if (esxi !== undefined) {
      try {
        await resetSourceState(esxi, esxiConfig.vmId)
      } catch (error) {
        log.warn(`Failed to reset the source VM, remove its "${XO_SNAPSHOT_NAME}" snapshot by hand`, { error })
      }
    }

    if (tracker !== undefined) {
      const vmIds = tracker.getTrackedResourcesByType('vm').map(({ id }) => id)
      if (vmIds.length > 0) {
        try {
          await dispatchClient.cleanup.fullCleanup({
            cleanupVMs: true,
            cleanupBackupJobs: false,
            cleanupSchedules: false,
            additionalVmIds: vmIds,
          })
        } catch (error) {
          log.warn('Failed to delete the migrated VMs', { vmIds, error })
        }
      }
    }

    await dispatchClient?.close()
  })

  // -----------------------------------------------------------------------------
  // The scenario XO users actually run: one call, source running, no snapshot yet. XO
  // snapshots the source, transfers everything up to that snapshot while the guest keeps
  // running, then stops it and transfers what was written since.
  //
  // What makes this the scenario that covers the regression: `migrationfromEsxi` reads the
  // source metadata once, right after taking its snapshot, and `#importDisks` uses that same
  // chain for both passes. At that instant the delta still carries the CID of its parent, so
  // the delta pass always sees the two disks with an identical CID — whatever the guest wrote
  // in between. Matching disks on their CID made the delta look already imported and skipped
  // it silently. Re-reading the metadata later, as a second migration would, hides this: by
  // then VMware has rewritten the CID of any disk the guest touched.
  //
  // The guest is rebooted while the base transfers, so the delta holds real data and the byte
  // comparison in step 3 has something to chew on.
  //
  //   step 1: one call, stopSource → base + delta, VM startable afterwards
  //   step 2: same, now halted source → new VM, whole chain in one pass
  //   step 3: step 1 and step 2 disks must be byte for byte identical
  //   step 4: from a clean source again, the resume path and its unstartable partial VM
  //
  // Kept in a single test because every step depends on the state left by the previous one:
  // splitting them would report several misleading failures instead of the one that matters.
  // -----------------------------------------------------------------------------
  it('rebuilds the same disks from a snapshot plus its delta as from a single full transfer', async () => {
    // --- Step 1/4: one migration, with the guest writing while the base transfers ---
    log.info('Step 1/4: migrating a running source in one call, churning the guest meanwhile')
    const migration = migrate({ stopSource: true })
    let migrationSettled = false
    migration.then(
      () => {
        migrationSettled = true
      },
      () => {
        migrationSettled = true
      }
    )

    // churn failures must not fail the run: the delta is then only what the guest happened to
    // write, which still exercises the regression, just with less data
    const churning = (async () => {
      await waitForSourceSnapshot(esxi, esxiConfig.vmId)
      if (migrationSettled) {
        log.warn('Migration finished before the guest could be churned, the delta will be small')
        return
      }
      await churnSourceByReset(esxi, esxiConfig.vmId, { settleMs: esxiConfig.resetSettleMs })
    })().catch(error => log.warn('Could not churn the source during the transfer', { error }))

    const twoStepVmUuid = await migration
    await churning
    tracker.trackResource('vm', twoStepVmUuid, { name: 'V2V two step' })

    const sourceAfter = await getAndLogSourceState(esxi, esxiConfig.vmId, 'after the two step migration')
    assert.equal(sourceAfter.powerState, 'poweredOff', 'the source should have been stopped before the last transfer')
    assert.equal(
      sourceAfter.snapshots?.snapshots.find(({ uid }) => uid === sourceAfter.snapshots.current)?.displayName,
      XO_SNAPSHOT_NAME,
      'the current source snapshot should be the one XO took for the migration'
    )

    const twoStepDisks = await getOrderedDisks(dispatchClient, twoStepVmUuid)
    assert.equal(twoStepDisks.length, sourceMetadata.disks.length, 'every source disk should have been created')
    for (const disk of twoStepDisks) {
      // a single `base` is the regression: the delta pass decided there was nothing to import.
      // A second `base` would mean the whole disk was transferred again instead of a delta
      const [base, delta] = assertTransferSequence(disk, ['base', 'snapshot'])
      assert.ok(
        delta.megabytes <= base.megabytes,
        `the delta of disk ${disk.position} should not be larger than the base transfer ` +
          `(delta ${delta.megabytes} MB, base ${base.megabytes} MB)`
      )
      log.info('Disk transferred in two passes', {
        position: disk.position,
        vdi: disk.uuid,
        baseMB: base.megabytes,
        deltaMB: delta.megabytes,
      })
      if (delta.megabytes === 0) {
        // not a failure: the sequence assertion above already proves the delta pass ran. But
        // step 3 only compares zeroes then, so the run is weaker than it looks
        log.warn('Empty delta, the raw comparison will not exercise much', {
          position: disk.position,
          hint: 'raise ESXI_RESET_SETTLE_MS so the guest has time to write after the reset',
        })
      }
    }

    await waitForBlockedOperations(dispatchClient, twoStepVmUuid, { blocked: false })

    // --- Step 2/4: migrate the now halted source in one pass ---------------------
    // the source has not been touched since, so this VM must hold exactly the same content
    log.info('Step 2/4: migrating the halted source')
    const fullTransferVmUuid = await migrate({ stopSource: true })
    tracker.trackResource('vm', fullTransferVmUuid, { name: 'V2V full transfer' })

    assert.notEqual(
      fullTransferVmUuid,
      twoStepVmUuid,
      'migrating a completed source again should create a new VM, not reuse the previous one'
    )

    await waitForBlockedOperations(dispatchClient, fullTransferVmUuid, { blocked: false })

    const fullTransferDisks = await getOrderedDisks(dispatchClient, fullTransferVmUuid)
    assert.equal(fullTransferDisks.length, twoStepDisks.length, 'both VMs should have the same number of disks')
    for (const disk of fullTransferDisks) {
      assertTransferSequence(disk, ['base'])
    }

    // --- Step 3/4: both reconstructions must be identical ------------------------
    log.info('Step 3/4: comparing the raw exports')
    for (const [index, twoStepDisk] of twoStepDisks.entries()) {
      const fullTransferDisk = fullTransferDisks[index]

      assert.equal(
        twoStepDisk.size,
        fullTransferDisk.size,
        `disk ${twoStepDisk.position} should have the same virtual size in both VMs`
      )

      log.info('Comparing raw exports', {
        position: twoStepDisk.position,
        size: formatBytes(twoStepDisk.size),
        twoStep: twoStepDisk.uuid,
        fullTransfer: fullTransferDisk.uuid,
      })

      await assertRawExportsAreIdentical(dispatchClient.restApiClient, {
        referenceVdi: fullTransferDisk.uuid,
        candidateVdi: twoStepDisk.uuid,
        size: fullTransferDisk.size,
        timeout: esxiConfig.timeout,
      })
    }

    // --- Step 4/4: the resume path, from a clean source again --------------------
    // a migration that leaves the source running produces a VM holding only the data up to
    // the snapshot: it must not be bootable, and a later run must continue it rather than
    // start over. This needs a snapshot free source, hence the reset
    log.info('Step 4/4: resuming an interrupted migration, from a clean source')
    await resetSourceState(esxi, esxiConfig.vmId)
    await getAndLogSourceState(esxi, esxiConfig.vmId, 'before the resume scenario')

    const partialVmUuid = await migrate({ stopSource: false })
    tracker.trackResource('vm', partialVmUuid, { name: 'V2V resume' })

    const partialDisks = await getOrderedDisks(dispatchClient, partialVmUuid)
    assert.equal(partialDisks.length, sourceMetadata.disks.length, 'every source disk should have been created')
    for (const disk of partialDisks) {
      assertTransferSequence(disk, ['base'])
    }

    await waitForBlockedOperations(dispatchClient, partialVmUuid, { blocked: true })
    await assert.rejects(
      () => dispatchClient.vm.start(partialVmUuid),
      'starting a partially transferred VM should be refused'
    )

    const resumedVmUuid = await migrate({ stopSource: true })
    assert.equal(
      resumedVmUuid,
      partialVmUuid,
      'the second migration should resume the VM left by the first one, not create another'
    )

    for (const disk of await getOrderedDisks(dispatchClient, resumedVmUuid)) {
      assertTransferSequence(disk, ['base', 'snapshot'])
    }
    await waitForBlockedOperations(dispatchClient, resumedVmUuid, { blocked: false })
  })

  /**
   * Runs a migration of the configured source VM and returns the UUID of the XCP-ng VM.
   * @private
   */
  async function migrate({ stopSource }) {
    const startTime = Date.now()
    log.debug('Calling vm.importFromEsxi', { vm: esxiConfig.vmId, stopSource })

    let result
    try {
      result = await dispatchClient.xoClient.call('vm.importFromEsxi', { ...migrationParams, stopSource })
    } catch (cause) {
      // `succeeded` maps the source VM to the XCP-ng VM created before the failure, and is
      // the only way to find the leftover VM to clean up
      log.warn('Migration failed', { stopSource, succeeded: cause.succeeded, error: cause })
      throw cause
    }

    const vmUuid = result[esxiConfig.vmId]
    log.debug('vm.importFromEsxi returned', { result })

    assert.equal(typeof vmUuid, 'string', `vm.importFromEsxi did not return a VM for ${esxiConfig.vmId}`)
    log.info('Migration done', { stopSource, vmUuid, durationSeconds: Math.round((Date.now() - startTime) / 1000) })

    return vmUuid
  }
})

/**
 * Picks a network the migrated VM can be attached to, on the same pool as the target SR.
 * @private
 */
async function findNetwork(dispatchClient, poolId) {
  const override = optionalEnv('ESXI_NETWORK_ID')
  if (override !== undefined) {
    return override
  }

  const networks = await dispatchClient.restApiClient.getObjects('/rest/v0/networks')
  // a network without PIF is not connected to anything physical
  const network = networks.find(candidate => candidate.$pool === poolId && candidate.PIFs?.length > 0)

  assert.notEqual(network, undefined, `no network with a PIF found on pool ${poolId} — set ESXI_NETWORK_ID`)
  return network.uuid
}

/**
 * Picks the template the migrated VM is built from, on the same pool as the target SR.
 * @private
 */
async function findTemplate(dispatchClient, poolId) {
  const override = optionalEnv('ESXI_TEMPLATE_ID')
  if (override !== undefined) {
    return override
  }

  const name = optionalEnv('ESXI_TEMPLATE_NAME') ?? 'Other install media'
  const templates = await dispatchClient.restApiClient.getObjects('/rest/v0/vm-templates')
  const template = templates.find(candidate => candidate.$pool === poolId && candidate.name_label === name)

  assert.notEqual(template, undefined, `template "${name}" not found on pool ${poolId} — set ESXI_TEMPLATE_ID`)
  return template.uuid
}
