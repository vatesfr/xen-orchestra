import '../logSetup.js'
import { createLogger } from '@xen-orchestra/log'
import { getSyncedHandler } from '@xen-orchestra/fs'
import { DispatchClient } from '../client/dispatchClient.js'
import { createResourceTracker } from '../utils/resourceTracker.js'
import { getRequiredEnv } from '../utils/index.js'
import { assertRepositoryMatchesConfig } from '../utils/backupUtils.js'

const log = createLogger('setup')

/**
 * Generates incremental VM name by finding the highest existing number.
 * @private
 */
async function generateIncrementalVmName(dispatchClient, baseName) {
  try {
    const allVms = await dispatchClient.vm.list()
    const prefix = `${baseName}-`

    const maxNumber = allVms
      .filter(vm => vm.name_label?.startsWith(prefix))
      .reduce((max, vm) => {
        const num = parseInt(vm.name_label.slice(prefix.length), 10)
        return isNaN(num) ? max : Math.max(max, num)
      }, 0)

    return `${baseName}-${maxNumber + 1}`
  } catch (error) {
    log.warn('Failed to generate incremental name', { error })
    return `${baseName}-${Date.now()}`
  }
}

/**
 * Test setup with automatic resource creation and tracking.
 * @param {Object} options - Setup options
 * @param {string} [options.referenceVmId] - Optional reference VM ID to clone for testing
 * @param {string} [options.requiredVmQty] - Optional number of clone to create, defaults to 1
 * @returns {Promise<Object>} Setup result with dispatchClient and created resources
 */
export const setup = async ({ referenceVmId, requiredVmQty = 1 } = {}) => {
  log.debug('Setting up test environment')

  const tracker = createResourceTracker()
  const dispatchClient = new DispatchClient()
  await dispatchClient.initialize()

  const createdResources = {
    vms: [],
    backupRepository: null,
    sessionId: tracker.getSessionId(),
  }

  try {
    // Find and clone reference VM — use provided ID or fall back to REFERENCE_VM_ID env var
    const referenceVm = referenceVmId
      ? await dispatchClient.vm.details(referenceVmId)
      : await findReferenceVm(dispatchClient)

    if (!referenceVm) {
      throw new Error(`Reference VM with ID "${referenceVmId}" not found`)
    }

    const vmPrefix = getRequiredEnv('VM_PREFIX')
    let testVmName = ''
    let testVmId = ''
    for (let i = 0; i < requiredVmQty; i++) {
      testVmName = await generateIncrementalVmName(dispatchClient, `${vmPrefix}-QA-Test`)

      log.debug('Creating test VM', { name: testVmName })

      testVmId = await dispatchClient.vm.clone(referenceVm.uuid, testVmName, {
        description: `Test VM for QA tests`,
        fastClone: true,
      })

      log.debug('Starting test VM', { id: testVmId })
      await dispatchClient.vm.start(testVmId)
      await dispatchClient.vm.waitForPowerState(testVmId, 'Running', 120_000)

      createdResources.vms.push(await dispatchClient.vm.details(testVmId))
      tracker.trackResource('vm', testVmId, { name: testVmName, source: referenceVm.name_label })
    }

    // Create or get backup repository
    const backupRepositoryName = getRequiredEnv('BACKUP_REPOSITORY_NAME')
    const repoUrl = getRequiredEnv('BACKUP_REPOSITORY_URL')

    // For file:// remotes: ensure the local directory exists before XO tries to use it.
    // Other backends (s3://, nfs://, …) are managed by XO — their connectivity is
    // validated when the backup job actually runs.
    if (repoUrl.startsWith('file://')) {
      const { dispose } = await getSyncedHandler({ url: repoUrl })
      await dispose()
    }

    let backupRepository = await dispatchClient.backupRepository.get({ name: backupRepositoryName })

    if (backupRepository) {
      log.debug('Using existing backup repository', { name: backupRepositoryName })
      assertRepositoryMatchesConfig(backupRepository, repoUrl)
    } else {
      const backupRepositoryId = await dispatchClient.backupRepository.create(backupRepositoryName, {
        url: repoUrl,
      })

      backupRepository = await dispatchClient.backupRepository.get({ id: backupRepositoryId })
      if (!backupRepository) {
        throw new Error(`Failed to retrieve created backup repository ${backupRepositoryId}`)
      }

      tracker.trackResource('backupRepository', backupRepositoryId, { name: backupRepositoryName })
    }

    createdResources.backupRepository = backupRepository

    log.debug('Setup completed', { tracked: tracker.getResourceSummary() })
  } catch (error) {
    log.warn('Setup failed', { error })

    try {
      log.debug('Cleaning up partial resources')
      await performCleanup(dispatchClient, tracker, true)
    } catch (cleanupError) {
      log.warn('Cleanup failed', { error: cleanupError.message })
    }

    throw error
  }

  return { dispatchClient, tracker, ...createdResources }
}

/**
 * Test teardown with automatic resource cleanup.
 * @param {DispatchClient} dispatchClient - The dispatch client instance
 * @param {Object} tracker - The resource tracker instance
 * @returns {Promise<void>}
 */
export const teardown = async (dispatchClient, tracker) => {
  log.debug('Starting test teardown')

  if (tracker !== undefined) {
    try {
      await performCleanup(dispatchClient, tracker)
      log.debug('Teardown completed')
    } catch (error) {
      log.warn('Teardown failed', { error })
    }
  }

  if (dispatchClient !== undefined) {
    try {
      await dispatchClient.close()
    } catch (error) {
      log.warn('Failed to close connections', { error })
    }
  }
}

/**
 * Finds reference VM by ID only.
 * @private
 */
async function findReferenceVm(dispatchClient) {
  const referenceVmId = getRequiredEnv('REFERENCE_VM_ID')

  log.debug('Searching reference VM by ID', { referenceVmId })
  const referenceVm = await dispatchClient.vm.details(referenceVmId)

  if (!referenceVm) {
    throw new Error(`Reference VM with ID "${referenceVmId}" not found`)
  }

  log.debug('Found reference VM', { name: referenceVm.name_label })
  return referenceVm
}

/**
 * Performs comprehensive cleanup of tracked test resources.
 * @private
 */
async function performCleanup(dispatchClient, tracker, forceCleanup = false) {
  const trackedResources = tracker.getTrackedResources()

  if (
    trackedResources.summary.totalVms === 0 &&
    trackedResources.summary.totalBackupJobs === 0 &&
    !trackedResources.summary.hasBackupRepository
  ) {
    log.debug('No resources to cleanup')
    return
  }

  log.debug('Cleaning up resources', { summary: tracker.getResourceSummary() })

  try {
    const cleanupResult = await dispatchClient.cleanup.fullCleanup({
      cleanupVMs: true,
      cleanupBackupJobs: true,
      cleanupSchedules: true,
      backupRepositoryId: trackedResources.backupRepository?.id || null,
      additionalVmIds: trackedResources.vms.map(vm => vm.id),
      additionalJobIds: trackedResources.backupJobs.map(job => job.id),
      additionalScheduleIds: trackedResources.schedules.map(schedule => schedule.id),
    })

    if (cleanupResult.success) {
      log.debug('Cleanup succeeded', { totalDeleted: cleanupResult.totalDeleted })
    } else {
      log.warn('Cleanup completed with failures', { totalFailed: cleanupResult.totalFailed })
    }

    tracker.clearTrackedResources()
  } catch (error) {
    log.warn('Cleanup failed', { error })
    if (!forceCleanup) {
      throw error
    }
  }
}
