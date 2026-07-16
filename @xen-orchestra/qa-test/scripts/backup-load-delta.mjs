#!/usr/bin/env node
/**
 * Delta (incremental) backup load test.
 *
 * Clones N VMs from REFERENCE_VM_ID into a single fleet, then repeatedly:
 *   1. churns every VM's disk over SSH (a fixed % of its virtual size)
 *   2. runs ONE delta backup job spanning the whole fleet
 *   3. records the job's total duration and transferred bytes
 * Once all runs are done, restores the latest backup of one fleet VM onto SR_ID to
 * validate the chain is actually restorable, before the fleet/job get cleaned up.
 *
 * A sibling `backup-load-full.mjs` will follow the same shape for full backup jobs.
 *
 * The job uses `mergeBackupsSynchronously: true`, so once `--retention` is exceeded
 * the VHD merge/cleanup for a run happens inside that run's own job duration instead
 * of a background worker — the recorded duration is already export + merge, nothing
 * extra to add up.
 *
 * Usage:
 *   node --env-file-if-exists=.env scripts/backup-load-delta.mjs \
 *     --vms 16 --concurrency 4 --churn-percent 5 --runs 10 --retention 3 \
 *     [--repositories <name>[,<name>...]]
 *
 * --repositories defaults to [BACKUP_REPOSITORY_NAME], created from BACKUP_REPOSITORY_URL
 * if it doesn't exist yet. Extra names must already exist in XO (no URL to create them with).
 *
 * --keep leaves the whole fleet, job, schedule and backups in place (nothing is cleaned up).
 * --keep-backups deletes only the fleet VMs, leaving the job/schedule/backup data untouched —
 * for inspecting the repository's on-disk state afterward (e.g. dedup ratio on a dedup backend).
 *
 * Optional env: TEST_VM_SSH_USER (default 'root'), TEST_VM_SSH_KEY (private key path).
 * Leave TEST_VM_SSH_KEY unset if the operator's default identity/ssh-agent is already
 * authorized on REFERENCE_VM_ID — ssh will use it without a -i flag.
 *
 * Results are written to --output-dir (default: load-test-results/<jobName>/) as one
 * JSON file per run plus a summary.json — feed them back for analysis the same way as
 * any other backup log dump.
 */
import '../logSetup.js'
import { parseArgs } from 'node:util'
import { mkdir, writeFile } from 'node:fs/promises'
import { createLogger } from '@xen-orchestra/log'
import { asyncEach } from '@vates/async-each'
import { DispatchClient } from '../client/dispatchClient.js'
import { createResourceTracker } from '../utils/resourceTracker.js'
import { cloneFleet } from '../utils/fleetUtils.js'
import { churnVm, churnSizeMb } from '../utils/vmChurn.js'
import { fleetDeltaBackupConfig } from '../backup.config.js'
import {
  getRequiredEnv,
  getDefaultSchedule,
  getScheduleKey,
  generateBackupJobName,
  formatDuration,
  sumBackupTransferredBytes,
  sumBackupPhaseDurations,
} from '../utils/index.js'
import { assertBackupSuccess, resolveOrCreateBackupRepository } from '../utils/backupUtils.js'

const log = createLogger('qa:load:backup:delta')

function parseCliArgs() {
  const { values } = parseArgs({
    options: {
      vms: { type: 'string', default: '4' },
      concurrency: { type: 'string', default: '2' },
      'churn-percent': { type: 'string', default: '5' },
      runs: { type: 'string', default: '5' },
      retention: { type: 'string', default: '2' },
      repositories: { type: 'string' },
      'output-dir': { type: 'string' },
      keep: { type: 'boolean', default: false },
      'keep-backups': { type: 'boolean', default: false },
    },
  })

  return {
    vmCount: Number(values.vms),
    concurrency: Number(values.concurrency),
    churnPercent: Number(values['churn-percent']),
    runs: Number(values.runs),
    retention: Number(values.retention),
    // Undefined means "use BACKUP_REPOSITORY_NAME", resolved (and auto-created if needed) in main().
    repositoryNames: values.repositories
      ?.split(',')
      .map(name => name.trim())
      .filter(Boolean),
    outputDir: values['output-dir'],
    keep: values.keep,
    keepBackups: values['keep-backups'],
  }
}

// Reuses/creates the default (env-configured) repository; any other requested repository
// must already exist in XO, since only BACKUP_REPOSITORY_URL gives us a URL to create with.
async function resolveBackupRepositories({ dispatchClient, tracker, repositoryNames }) {
  const defaultName = getRequiredEnv('BACKUP_REPOSITORY_NAME')
  const names = repositoryNames ?? [defaultName]

  const repositories = []
  for (const name of names) {
    if (name === defaultName) {
      repositories.push(
        await resolveOrCreateBackupRepository(dispatchClient, tracker, {
          name,
          url: getRequiredEnv('BACKUP_REPOSITORY_URL'),
        })
      )
      continue
    }

    const repository = await dispatchClient.backupRepository.get({ name })
    if (!repository) {
      throw new Error(`Backup repository "${name}" not found — only BACKUP_REPOSITORY_NAME can be auto-created`)
    }
    repositories.push(repository)
  }

  return repositories
}

// Assumes a single meaningfully-sized data disk per VM (churns the largest user VDI).
async function resolveChurnTargets({ dispatchClient, fleet, churnPercent, concurrency }) {
  const targets = []

  await asyncEach(
    fleet,
    async ({ id, ip }) => {
      const vdis = await dispatchClient.vdi.getVdisForVm(id)
      if (vdis.length === 0) {
        throw new Error(`VM ${id} has no user VDI to churn`, { cause: { vmId: id } })
      }

      const primaryVdi = vdis.reduce((largest, vdi) => (vdi.virtual_size > largest.virtual_size ? vdi : largest))
      targets.push({ id, ip, sizeMb: churnSizeMb(primaryVdi.virtual_size, churnPercent) })
    },
    { concurrency }
  )

  return targets
}

// Validates the backup chain is actually restorable after all the churn/merge activity,
// not just that the job reported success. Picks one VM (fleet[0]) and its most recent backup.
async function restoreLatestBackup({ dispatchClient, tracker, fleet, backupRepositories, srId }) {
  const vmId = fleet[0].id
  const backupsByRemote = await dispatchClient.backup.listVmBackups(backupRepositories.map(r => r.id))

  const repository = backupRepositories.find(r => backupsByRemote[r.id]?.[vmId]?.length > 0)
  if (!repository) {
    throw new Error(`No backups found for VM ${vmId} in any configured repository`)
  }

  const backups = backupsByRemote[repository.id][vmId]
  const latestBackup = [...backups].sort((a, b) => a.timestamp - b.timestamp).at(-1)

  const restoredVmId = await dispatchClient.backup.importVmBackup(latestBackup.id, srId)
  tracker?.trackResource('restoredVm', restoredVmId, { sourceVmId: vmId, backupId: latestBackup.id })
  return restoredVmId
}

async function main() {
  const { vmCount, concurrency, churnPercent, runs, retention, repositoryNames, outputDir, keep, keepBackups } =
    parseCliArgs()

  if (retention >= runs) {
    log.warn(
      'exportRetention >= runs: no restore point will ever be pruned during this test, so no merge ' +
        'will be triggered and the total-duration measurement will not reflect merge/cleanup cost',
      { retention, runs }
    )
  }

  const dispatchClient = new DispatchClient()
  await dispatchClient.initialize()
  const tracker = createResourceTracker()

  try {
    const setupStart = Date.now()

    const referenceVmId = getRequiredEnv('REFERENCE_VM_ID')
    const referenceVm = await dispatchClient.vm.details(referenceVmId)
    if (!referenceVm) {
      throw new Error(`Reference VM ${referenceVmId} not found`)
    }

    const backupRepositories = await resolveBackupRepositories({ dispatchClient, tracker, repositoryNames })

    // Both optional: unset falls back to ssh's own default identity files / ssh-agent.
    const sshUser = process.env.TEST_VM_SSH_USER || 'root'
    const sshKey = process.env.TEST_VM_SSH_KEY

    const name = generateBackupJobName()
    const outputPath = outputDir ?? `load-test-results/${name}`
    await mkdir(outputPath, { recursive: true })

    log.info('Cloning fleet', { vmCount, concurrency })
    const fleet = await cloneFleet({
      dispatchClient,
      referenceVm,
      count: vmCount,
      namePrefix: `${getRequiredEnv('VM_PREFIX')}-QA-Load-${tracker.getSessionId()}`,
      tracker,
      concurrency,
    })

    const churnTargets = await resolveChurnTargets({ dispatchClient, fleet, churnPercent, concurrency })

    const schedule = getDefaultSchedule()
    const jobConfig = fleetDeltaBackupConfig(
      name,
      schedule,
      fleet.map(vm => vm.id),
      backupRepositories.map(repository => repository.id),
      { concurrency, exportRetention: retention }
    )

    const jobId = await dispatchClient.backup.createBackupJob(jobConfig)
    tracker.trackResource('backupJob', jobId, { name })
    const job = await dispatchClient.backup.details(jobId)
    const scheduleId = getScheduleKey(job)
    tracker.trackResource('schedule', scheduleId, { name, jobId })

    // Fleet clone/boot/IP-wait dominates this and is excluded from per-run job timings below.
    const setupDurationMs = Date.now() - setupStart
    log.info('Fleet + job setup complete', { duration: formatDuration(setupDurationMs) })

    const results = []
    for (let run = 1; run <= runs; run++) {
      log.info(`Run ${run}/${runs}: churning fleet`, { vmCount, churnPercent })
      const churnStart = Date.now()
      await asyncEach(
        churnTargets,
        target => churnVm({ ip: target.ip, identityFile: sshKey, user: sshUser, sizeMb: target.sizeMb }),
        { concurrency }
      )
      const churnDurationMs = Date.now() - churnStart

      log.info(`Run ${run}/${runs}: running backup job`, { jobId, scheduleId })
      const result = await dispatchClient.backup.runJobAndGetLog(jobId, scheduleId)
      assertBackupSuccess(result, `Load test run ${run}/${runs}`)

      const jobDurationMs = result.end - result.start
      const transferredBytes = sumBackupTransferredBytes(result)
      const { snapshotDurationMs, cleanVmBeforeDurationMs, cleanVmAfterDurationMs } = sumBackupPhaseDurations(result)
      const summary = {
        run,
        churnDurationMs,
        jobDurationMs,
        snapshotDurationMs,
        cleanVmBeforeDurationMs,
        cleanVmAfterDurationMs,
        transferredBytes,
        throughputMBps: transferredBytes / 1024 / 1024 / (jobDurationMs / 1000),
      }
      results.push(summary)

      await writeFile(`${outputPath}/run-${run}.json`, JSON.stringify(result, null, 2))
      log.info(`Run ${run}/${runs} done`, {
        churnDuration: formatDuration(churnDurationMs),
        duration: formatDuration(jobDurationMs),
        snapshotDuration: formatDuration(snapshotDurationMs),
        cleanVmAfterDuration: formatDuration(cleanVmAfterDurationMs),
        transferredGiB: (transferredBytes / 1024 ** 3).toFixed(2),
        throughputMBps: summary.throughputMBps.toFixed(1),
      })
    }

    const sumField = field => results.reduce((total, result) => total + result[field], 0)
    const runDurationMs = sumField('jobDurationMs')
    const totalChurnDurationMs = sumField('churnDurationMs')
    const totalSnapshotDurationMs = sumField('snapshotDurationMs')
    const totalCleanVmBeforeDurationMs = sumField('cleanVmBeforeDurationMs')
    const totalCleanVmAfterDurationMs = sumField('cleanVmAfterDurationMs')
    const totalTransferredBytes = sumField('transferredBytes')

    const srId = getRequiredEnv('SR_ID')
    log.info('Restoring latest backup to validate the chain', { srId })
    const restoreStart = Date.now()
    const restoredVmId = await restoreLatestBackup({ dispatchClient, tracker, fleet, backupRepositories, srId })
    const restoreDurationMs = Date.now() - restoreStart
    log.info('Restore validation complete', { restoredVmId, duration: formatDuration(restoreDurationMs) })

    await writeFile(
      `${outputPath}/summary.json`,
      JSON.stringify(
        {
          vmCount,
          concurrency,
          churnPercent,
          retention,
          runs,
          setupDurationMs,
          runDurationMs,
          restoreDurationMs,
          totalChurnDurationMs,
          totalSnapshotDurationMs,
          totalCleanVmBeforeDurationMs,
          totalCleanVmAfterDurationMs,
          totalTransferredBytes,
          results,
        },
        null,
        2
      )
    )
    log.info('Load test complete', { outputPath, runDuration: formatDuration(runDurationMs) })
  } finally {
    if (!keep) {
      log.info(
        keepBackups
          ? 'Cleaning up load-test VMs (--keep-backups: leaving job, schedule and backup data in place)'
          : 'Cleaning up load-test resources'
      )
      const cleanupStart = Date.now()
      const trackedResources = tracker.getTrackedResources()
      await dispatchClient.cleanup.fullCleanup({
        cleanupVMs: true,
        cleanupBackupJobs: !keepBackups,
        cleanupSchedules: !keepBackups,
        // Only deletes the repository if resolveOrCreateBackupRepository tracked one it created —
        // a reused pre-existing repository (the common case) is left untouched. Never deleted with
        // --keep-backups, since that removes the physical backup files along with the config.
        backupRepositoryId: keepBackups ? null : trackedResources.backupRepository?.id || null,
        additionalVmIds: trackedResources.vms.map(vm => vm.id),
        additionalJobIds: trackedResources.backupJobs.map(job => job.id),
        additionalScheduleIds: trackedResources.schedules.map(schedule => schedule.id),
      })
      // Not part of fullCleanup: the VM restored for chain validation.
      await dispatchClient.cleanup.deleteRestoredVMs({ vmIds: trackedResources.restoredVms.map(vm => vm.id) })
      log.info('Cleanup complete', { duration: formatDuration(Date.now() - cleanupStart) })
    } else {
      log.info('Skipping cleanup (--keep)')
    }
    await dispatchClient.close()
  }
}

main().catch(error => {
  log.warn('Load test failed', { error })
  process.exitCode = 1
})
