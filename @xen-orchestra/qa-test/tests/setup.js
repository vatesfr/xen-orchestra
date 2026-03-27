import { DispatchClient } from '../client/dispatchClient.js'
import { createResourceTracker } from '../utils/resourceTracker.js'

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
    console.warn(`⚠️ Failed to generate incremental name:`, error.message)
    return `${baseName}-${Date.now()}`
  }
}

/**
 * Test setup with automatic resource creation and tracking.
 * @returns {Promise<Object>} Setup result with dispatchClient and created resources
 */
export const setup = async () => {
  console.log('🚀 Setting up test environment...')

  const tracker = createResourceTracker()
  const dispatchClient = new DispatchClient()
  await dispatchClient.initialize({
    xoUrl: process.env.HOSTNAME,
    username: process.env.USERNAME,
    password: process.env.PASSWORD,
  })

  const createdResources = {
    vm: null,
    backupRepository: null,
    sessionId: tracker.getSessionId(),
  }

  try {
    // Find and clone reference VM (ID is required)
    const referenceVm = await findReferenceVm(dispatchClient)

    const vmPrefix = process.env.VM_PREFIX || 'TST'
    const testVmName = await generateIncrementalVmName(dispatchClient, `${vmPrefix}-QA-Test`)

    console.log(`🔄 Creating test VM: ${testVmName}`)

    const testVmId = await dispatchClient.vm.clone(referenceVm.uuid, testVmName, {
      description: `Test VM for QA tests`,
      fastClone: true,
    })

    createdResources.vm = await dispatchClient.vm.details(testVmId)
    tracker.trackResource('vm', testVmId, { name: testVmName, source: referenceVm.name_label })

    // Create or get backup repository
    const backupRepositoryName = process.env.BACKUP_REPOSITORY_NAME || 'Test backup QA'
    let backupRepository = await dispatchClient.backupRepository.get({ name: backupRepositoryName })

    if (backupRepository) {
      console.log(`✅ Using existing backup repository: ${backupRepositoryName}`)
    } else {
      const backupRepositoryId = await dispatchClient.backupRepository.create(backupRepositoryName, {
        path: process.env.BACKUP_REPOSITORY_PATH || '/tmp/xo-test-backups',
      })

      backupRepository = await dispatchClient.backupRepository.get({ id: backupRepositoryId })
      if (!backupRepository) {
        throw new Error(`Failed to retrieve created backup repository ${backupRepositoryId}`)
      }

      tracker.trackResource('backupRepository', backupRepositoryId, { name: backupRepositoryName })
    }

    createdResources.backupRepository = backupRepository

    console.log(`✅ Setup completed. Tracked: ${tracker.getResourceSummary()}`)
  } catch (error) {
    console.error('❌ Setup failed:', error.message)

    try {
      console.log('🧹 Cleaning up partial resources...')
      await performCleanup(dispatchClient, tracker, true)
    } catch (cleanupError) {
      console.error('❌ Cleanup failed:', cleanupError.message)
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
  console.log('🧹 Starting test teardown...')

  try {
    await performCleanup(dispatchClient, tracker)
    console.log('✅ Teardown completed')
  } catch (error) {
    console.error('❌ Teardown failed:', error.message)
  } finally {
    try {
      await dispatchClient.close()
    } catch (error) {
      console.error('❌ Failed to close connections:', error.message)
    }
  }
}

/**
 * Finds reference VM by ID only.
 * @private
 */
async function findReferenceVm(dispatchClient) {
  const referenceVmId = process.env.REFERENCE_VM_ID

  if (!referenceVmId) {
    throw new Error('REFERENCE_VM_ID environment variable is required but not set')
  }

  console.log(`🔍 Searching reference VM by ID: ${referenceVmId}`)
  const referenceVm = await dispatchClient.vm.details(referenceVmId)

  if (!referenceVm) {
    throw new Error(`Reference VM with ID "${referenceVmId}" not found`)
  }

  console.log(`✅ Found reference VM by ID: ${referenceVm.name_label}`)
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
    console.log('✅ No resources to cleanup')
    return
  }

  console.log(`🧹 Cleaning up: ${tracker.getResourceSummary()}`)

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
      console.log(`✅ Cleanup succeeded: ${cleanupResult.totalDeleted} resources deleted`)
    } else {
      console.warn(`⚠️ Cleanup completed with ${cleanupResult.totalFailed} failures`)
    }

    tracker.clearTrackedResources()
  } catch (error) {
    console.error('❌ Cleanup failed:', error.message)
    if (!forceCleanup) {
      throw error
    }
  }
}
