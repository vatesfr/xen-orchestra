import { createLogger } from '@xen-orchestra/log'
import path from 'node:path'
import fs from 'node:fs/promises'
import { FilterBuilder } from './FilterBuilder.js'
import { BACKUP_JOB_NAME_PREFIX, getRequiredEnv } from '../utils/index.js'

const log = createLogger('cleanup')

/**
 * Allowed paths for automatic backup cleanup of file:// remotes.
 * SECURITY: Only test-scoped paths containing 'test', 'qa', or 'tmp/xo'.
 * Non-file:// remotes return an empty list (cleanup is delegated to XO API).
 *
 * Computed lazily so that `process.env.BACKUP_REPOSITORY_URL` is read at call
 * time rather than module-load time — otherwise ESM import hoisting would make
 * it evaluate before any in-code env loading runs.
 *
 * @returns {Array<string>}
 */
const getAllowedCleanupPaths = () => {
  const repoUrl = process.env.BACKUP_REPOSITORY_URL

  // Non-local remotes have no local path to safety-check
  if (!repoUrl?.startsWith('file://')) return []

  let repoPath
  try {
    repoPath = new URL(repoUrl).pathname
  } catch {
    log.warn('Rejected cleanup URL: invalid URL', { repoUrl })
    return []
  }

  // SECURITY: Reject paths containing path traversal sequences
  if (repoPath?.includes('..')) {
    log.warn('Rejected cleanup path: contains path traversal', { repoPath })
    return []
  }

  const normalized = repoPath ? path.resolve(repoPath).toLowerCase() : ''
  const isTestPath = ['test', 'qa', 'tmp/xo'].some(marker => normalized.includes(marker))

  if (!isTestPath) {
    if (repoPath) log.warn('Rejected cleanup path: not a test path', { repoPath })
    return []
  }

  return [path.resolve(repoPath)]
}

/**
 * Orchestration client for XenOrchestra cleanup operations.
 *
 * Provides automated cleanup functionality for test resources including
 * VMs, backups, snapshots, and associated artifacts. Handles both individual
 * resource deletion and batch cleanup operations.
 *
 * @class CleanupClient
 */
export class CleanupClient {
  /**
   * Reference to the DispatchClient instance
   * @type {DispatchClient}
   */
  dispatchClient

  /**
   * Creates a new CleanupClient instance.
   *
   * @param {DispatchClient} dispatchClient - The DispatchClient instance for API calls
   * @throws {Error} If dispatchClient is not provided
   */
  constructor(dispatchClient) {
    if (!dispatchClient) {
      throw new Error('DispatchClient instance is required')
    }
    this.dispatchClient = dispatchClient
  }

  /**
   * Ensures the client is connected before making API calls.
   *
   * @throws {Error} If client is not initialized or connected
   * @private
   */
  _ensureConnected() {
    if (!this.dispatchClient?.isConnected()) {
      throw new Error('Client not initialized. Call initialize() first.')
    }
  }
  /**
   * Generic method to delete resources in batch with error handling.
   *
   * @param {string} resourceType - Resource type for logging (e.g., 'VM', 'backup job')
   * @param {Function} findResourcesFn - Async function that returns array of resources to delete
   * @param {Function} deleteResourceFn - Async function that deletes a single resource
   * @param {Object} [options={}] - Deletion options
   * @param {boolean} [options.continueOnError=true] - Continue on individual failures
   * @returns {Promise<Object>} Deletion summary
   * @private
   */
  async _deleteResourcesBatch(resourceType, findResourcesFn, deleteResourceFn, options = {}) {
    const { continueOnError = true } = options
    const results = {
      scanned: 0,
      deleted: 0,
      failed: 0,
      errors: [],
      deletedResources: [],
    }

    try {
      const resources = await findResourcesFn()
      results.scanned = resources.length

      if (resources.length === 0) {
        log.debug('No resources found', { resourceType })
        return results
      }

      log.debug('Deleting resources', { count: resources.length, resourceType })

      for (const resource of resources) {
        try {
          await deleteResourceFn(resource)
          results.deleted++
          results.deletedResources.push({
            id: resource.id || resource.uuid,
            name: resource.name || resource.name_label,
            deletedAt: new Date().toISOString(),
          })
        } catch (error) {
          results.failed++
          results.errors.push({
            id: resource.id || resource.uuid,
            name: resource.name || resource.name_label,
            error: error.message,
          })

          if (!continueOnError) {
            throw error
          }
        }
      }

      if (results.failed > 0) {
        log.warn('Cleanup partially failed', { resourceType, deleted: results.deleted, failed: results.failed })
      }
    } catch (error) {
      log.warn('Cleanup failed', { resourceType, error })
      throw error
    }

    return results
  }

  /**
   * Extracts backup IDs from nested backup structure returned by backupNg.listVmBackups.
   *
   * Iterates through backupsByRemote → backupsByVm → vmBackups[] structure,
   * applying null/type/array checks and optionally filtering by jobId.
   *
   * @param {Object} backupsByRemote - Nested backup structure from backupNg.listVmBackups
   * @param {string|null} [targetJobId=null] - Optional job ID to filter backups
   * @returns {Array<string>} Array of backup IDs matching the criteria
   * @private
   */
  _extractBackupIds(backupsByRemote, targetJobId = null) {
    if (!backupsByRemote || typeof backupsByRemote !== 'object') {
      return []
    }

    return Object.values(backupsByRemote)
      .flatMap(backupsByVm => (backupsByVm && typeof backupsByVm === 'object' ? Object.values(backupsByVm) : []))
      .flatMap(vmBackups => (Array.isArray(vmBackups) ? vmBackups : []))
      .filter(backup => backup && (!targetJobId || backup.jobId === targetJobId))
      .map(backup => backup.id)
  }

  /**
   * Deletes all VMs matching EXACT QA test patterns.
   *
   * @param {Object} [options] - Cleanup options
   * @param {Array<string>} [options.namePatterns] - Name patterns to match for deletion
   * @param {Array<string>} [options.includeIds=[]] - Additional VM IDs to include
   * @param {boolean} [options.force=false] - Force deletion even if VMs are running
   * @param {boolean} [options.continueOnError=true] - Continue deletion on individual failures
   * @returns {Promise<Object>} Cleanup summary with deleted VMs and errors
   */
  async deleteQAVMs(options = {}) {
    this._ensureConnected()

    const vmPrefix = getRequiredEnv('VM_PREFIX')
    const config = {
      namePatterns: [`${vmPrefix}-QA-Test-*`],
      includeIds: [],
      force: false,
      continueOnError: true,
      ...options,
    }

    log.debug('Starting QA VM cleanup', { patterns: config.namePatterns })

    const findVMs = async () => {
      const pattern = config.namePatterns[0] || `${vmPrefix}-QA-Test-*`
      const filter = FilterBuilder.create().withGlob('name_label', pattern)
      const matchingVms = await this.dispatchClient.vm.list(filter)

      // Add explicitly included VMs
      const additionalVms = []
      for (const vmId of config.includeIds) {
        try {
          const vm = await this.dispatchClient.vm.details(vmId)
          if (vm && !matchingVms.find(v => v.uuid === vm.uuid)) {
            additionalVms.push(vm)
          }
        } catch (error) {
          log.warn('Could not fetch VM', { vmId, error })
        }
      }

      return [...matchingVms, ...additionalVms]
    }

    const deleteVM = async vm => {
      if (vm.power_state === 'Running') {
        try {
          await this.dispatchClient.vm.stop(vm.uuid, { force: true })
          await new Promise(resolve => setTimeout(resolve, 3_000))
        } catch (error) {
          log.warn('Could not stop VM before deletion', { uuid: vm.uuid, error })
        }
      }

      await this.dispatchClient.vm.delete(vm.uuid, {
        deleteDisks: true,
        force: true,
        forceBlockedOperation: true,
      })
    }

    return await this._deleteResourcesBatch('QA VM', findVMs, deleteVM, {
      continueOnError: config.continueOnError,
    })
  }

  /**
   * Deletes backup jobs matching test patterns.
   *
   * @param {Object} [options] - Cleanup options
   * @param {Array<string>} [options.namePatterns] - Name patterns to match for deletion
   * @param {Array<string>} [options.includeIds=[]] - Additional backup job IDs to include
   * @param {boolean} [options.deleteBackupFiles=true] - Whether to delete associated backup files
   * @param {boolean} [options.continueOnError=true] - Continue deletion on individual failures
   * @returns {Promise<Object>} Cleanup summary with deleted jobs and errors
   */
  async deleteBackupJobs(options = {}) {
    this._ensureConnected()

    const config = {
      namePatterns: [BACKUP_JOB_NAME_PREFIX],
      includeIds: [],
      deleteBackupFiles: true,
      continueOnError: true,
      ...options,
    }

    log.debug('Starting backup job cleanup', { patterns: config.namePatterns })

    const findJobs = async () => {
      const allJobs = await this.dispatchClient.backup.list()
      return allJobs.filter(
        job => config.includeIds.includes(job.id) || config.namePatterns.some(pattern => job.name?.includes(pattern))
      )
    }

    const deleteJob = async job => {
      // Delete physical backup files BEFORE deleting the job metadata
      if (config.deleteBackupFiles) {
        try {
          const jobDetails = await this.dispatchClient.backup.details(job.id)
          const jobRemotes = jobDetails.remotes?.id ? [jobDetails.remotes.id] : Object.keys(jobDetails.remotes || {})

          if (jobRemotes.length > 0) {
            const backupsByRemote = await this.dispatchClient.backup.listVmBackups(jobRemotes)
            const backupIds = this._extractBackupIds(backupsByRemote, job.id)

            if (backupIds.length > 0) {
              log.debug('Deleting backup files for job', { count: backupIds.length, jobName: job.name })
              for (let i = 0; i < backupIds.length; i += 10) {
                try {
                  await this.dispatchClient.backup.deleteVmBackups(backupIds.slice(i, i + 10))
                } catch (batchError) {
                  log.warn('Delete VM backups failed', { error: batchError })
                }
              }
            }
          }
        } catch (error) {
          log.warn('Backup files cleanup failed for job', { jobId: job.id, error })
        }
      }

      // Mirror backup jobs require mirrorBackup.deleteJob, standard jobs use backupNg.deleteJob.
      // The REST API may not expose the type field for mirror jobs, so fall back when backupNg
      // returns "no such job" (error.data.type === 'job').
      if (job.type === 'mirrorBackup') {
        await this.dispatchClient.backup.deleteMirrorBackupJob(job.id)
      } else {
        try {
          await this.dispatchClient.backup.deleteBackupJob(job.id)
        } catch (error) {
          if (error?.data?.type !== 'job') {
            throw error
          }
          // backupNg doesn't know this job — may be a mirror backup job; try the mirror method
          try {
            await this.dispatchClient.backup.deleteMirrorBackupJob(job.id)
          } catch (mirrorError) {
            if (mirrorError?.data?.type === 'job') {
              // Job is unreachable through both RPCs (orphaned from a previous run) — skip silently
              log.debug('Backup job not found via any delete method, skipping', { jobId: job.id })
              return
            }
            throw mirrorError
          }
        }
      }
    }

    return await this._deleteResourcesBatch('backup job', findJobs, deleteJob, {
      continueOnError: config.continueOnError,
    })
  }

  /**
   * Deletes schedules matching test patterns.
   *
   * @param {Object} [options] - Cleanup options
   * @param {Array<string>} [options.namePatterns] - Name patterns to match for deletion
   * @param {Array<string>} [options.includeIds=[]] - Additional schedule IDs to include
   * @param {boolean} [options.continueOnError=true] - Continue deletion on individual failures
   * @returns {Promise<Object>} Cleanup summary with deleted schedules and errors
   */
  async deleteSchedules(options = {}) {
    this._ensureConnected()

    const config = {
      namePatterns: [BACKUP_JOB_NAME_PREFIX],
      includeIds: [],
      continueOnError: true,
      ...options,
    }

    const findSchedules = async () => {
      const allSchedules = await this.dispatchClient.xoClient.call('schedule.getAll')
      const schedulesArray = Array.isArray(allSchedules) ? allSchedules : Object.values(allSchedules)
      return schedulesArray.filter(
        schedule =>
          config.includeIds.includes(schedule.id) ||
          config.namePatterns.some(pattern => schedule.name?.includes(pattern))
      )
    }

    const deleteSchedule = async schedule => {
      await this.dispatchClient.xoClient.call('schedule.delete', { id: schedule.id })
    }

    return await this._deleteResourcesBatch('schedule', findSchedules, deleteSchedule, {
      continueOnError: config.continueOnError,
    })
  }

  /**
   * Deletes exported test files (VHD, XVA).
   *
   * SECURITY: Only deletes files from allowed test paths.
   *
   * @param {Object} [options={}] - Cleanup options
   * @param {Array<string>} [options.filePaths=[]] - Specific file paths to delete
   * @param {string} [options.directory] - Directory to scan for export files
   * @param {Array<string>} [options.extensions=['.vhd', '.xva']] - File extensions to match
   * @param {boolean} [options.continueOnError=true] - Continue deletion on individual failures
   * @returns {Promise<Object>} Cleanup summary with deleted files and errors
   */
  async deleteExportedFiles(options = {}) {
    const config = {
      filePaths: [],
      directory: options.directory ?? getRequiredEnv('VHD_EXPORT_PATH'),
      extensions: ['.vhd', '.xva'],
      continueOnError: true,
      ...options,
    }

    const results = {
      scanned: 0,
      deleted: 0,
      failed: 0,
      errors: [],
      deletedFiles: [],
    }

    log.debug('Starting export file cleanup')

    // SECURITY: Reject paths containing path traversal sequences
    if (config.directory.includes('..')) {
      log.warn('Rejected cleanup path: contains path traversal', { directory: config.directory })
      return results
    }

    // Verify directory is in allowed paths
    const normalizedDir = path.resolve(config.directory)
    const isTestPath = ['test', 'qa', 'tmp/xo', 'tmp/'].some(marker => normalizedDir.toLowerCase().includes(marker))

    if (!isTestPath) {
      log.warn('Rejected cleanup path: not a test path', { directory: config.directory })
      return results
    }

    // Collect files to delete
    /** @type {Array<string>} */
    let filesToDelete = [...config.filePaths]

    // Scan directory if specified
    if (config.directory) {
      try {
        const files = await fs.readdir(config.directory)
        const matchingFiles = files
          .filter(file => config.extensions.some(ext => file.endsWith(ext)))
          .map(file => path.join(config.directory, file))
        filesToDelete.push(...matchingFiles)
      } catch (error) {
        log.warn('Could not read directory', { directory: config.directory, error })
      }
    }

    // Deduplicate
    filesToDelete = [...new Set(filesToDelete)]
    results.scanned = filesToDelete.length

    if (filesToDelete.length === 0) {
      log.debug('No export files found to cleanup')
      return results
    }

    log.debug('Deleting export files', { count: filesToDelete.length })

    for (const filePath of filesToDelete) {
      try {
        await fs.unlink(filePath)
        results.deleted++
        results.deletedFiles.push({
          path: filePath,
          deletedAt: new Date().toISOString(),
        })
        log.debug('Deleted export file', { file: path.basename(filePath) })
      } catch (error) {
        results.failed++
        results.errors.push({
          path: filePath,
          error: error.message,
        })

        if (!config.continueOnError) {
          throw error
        }
      }
    }

    if (results.failed > 0) {
      log.warn('Export file cleanup partially failed', { deleted: results.deleted, failed: results.failed })
    } else {
      log.debug('Export file cleanup completed', { deleted: results.deleted })
    }

    return results
  }

  /**
   * Deletes restored VMs created during export/import tests.
   *
   * @param {Object} [options={}] - Cleanup options
   * @param {Array<string>} [options.vmIds=[]] - VM IDs to delete
   * @param {boolean} [options.force=true] - Force deletion even if VMs are running
   * @param {boolean} [options.deleteDisks=true] - Delete associated disks
   * @param {boolean} [options.continueOnError=true] - Continue deletion on individual failures
   * @returns {Promise<Object>} Cleanup summary with deleted VMs and errors
   */
  async deleteRestoredVMs(options = {}) {
    this._ensureConnected()

    const config = {
      vmIds: [],
      force: true,
      deleteDisks: true,
      continueOnError: true,
      ...options,
    }

    if (config.vmIds.length === 0) {
      log.debug('No restored VMs to cleanup')
      return {
        scanned: 0,
        deleted: 0,
        failed: 0,
        errors: [],
        deletedResources: [],
      }
    }

    log.debug('Starting restored VM cleanup', { count: config.vmIds.length })

    const findVMs = async () => {
      const vms = []
      for (const vmId of config.vmIds) {
        try {
          const vm = await this.dispatchClient.vm.details(vmId)
          if (vm) {
            vms.push(vm)
          }
        } catch (error) {
          log.warn('Could not fetch VM', { vmId, error })
        }
      }
      return vms
    }

    const deleteVM = async vm => {
      // Stop VM first if running
      if (vm.power_state === 'Running' && config.force) {
        try {
          await this.dispatchClient.vm.stop(vm.uuid, { force: true })
          // Wait briefly for shutdown
          await new Promise(resolve => setTimeout(resolve, 2000))
        } catch (error) {
          log.warn('Could not stop VM', { uuid: vm.uuid, error })
        }
      }

      await this.dispatchClient.vm.delete(vm.uuid, {
        deleteDisks: config.deleteDisks,
        force: config.force,
        forceBlockedOperation: config.force,
      })
    }

    return await this._deleteResourcesBatch('restored VM', findVMs, deleteVM, {
      continueOnError: config.continueOnError,
    })
  }

  /**
   * Deletes a backup repository.
   *
   * @param {string} backupRepositoryId - ID of the backup repository to delete
   * @returns {Promise<Object>} Deletion result
   * @throws {Error} If deletion fails
   */
  async deleteBackupRepository(backupRepositoryId) {
    this._ensureConnected()

    if (!backupRepositoryId) {
      throw new Error('Backup repository ID is required')
    }

    log.debug('Deleting test backup repository', { backupRepositoryId })

    try {
      // Get repository path and check if it's in allowed cleanup paths
      let repoPath = null
      try {
        const repoDetails = await this.dispatchClient.backupRepository.details(backupRepositoryId)
        if (repoDetails?.url?.startsWith('file://')) {
          repoPath = repoDetails.url.replace('file://', '')
        }
      } catch (error) {
        log.warn('Could not get repository details', { error })
      }

      // Clean up backup files if path is allowed
      const normalizedPath = repoPath ? path.normalize(repoPath) : null
      const isAllowed = normalizedPath && getAllowedCleanupPaths().some(p => normalizedPath.startsWith(p))

      if (isAllowed) {
        try {
          const backups = await this.dispatchClient.backup.listVmBackups([backupRepositoryId])
          const backupIds = this._extractBackupIds(backups)

          if (backupIds.length > 0) {
            log.debug('Deleting backup files', { count: backupIds.length })
            for (let i = 0; i < backupIds.length; i += 10) {
              try {
                await this.dispatchClient.backup.deleteVmBackups(backupIds.slice(i, i + 10))
              } catch (error) {
                log.warn('Failed to delete backup batch', { error })
              }
            }
          }
        } catch (error) {
          log.warn('Backup files cleanup failed', { error })
        }
      } else if (repoPath) {
        log.warn('Skipping backup cleanup: path not in allowed paths', { repoPath })
      }

      const result = await this.dispatchClient.backupRepository.delete(backupRepositoryId)
      log.debug('Backup repository deleted successfully')

      return result
    } catch (error) {
      log.warn('Backup repository deletion failed', { error })
      throw error
    }
  }

  /**
   * Performs comprehensive cleanup of all test resources.
   *
   * @param {Object} [options] - Comprehensive cleanup options
   * @param {boolean} [options.cleanupVMs=true] - Whether to cleanup QA VMs
   * @param {boolean} [options.cleanupBackupJobs=true] - Whether to cleanup backup jobs
   * @param {boolean} [options.cleanupSchedules=true] - Whether to cleanup schedules
   * @param {string|null} [options.backupRepositoryId=null] - Backup repository ID to delete
   * @param {Array<string>} [options.additionalVmIds=[]] - Additional VM IDs to cleanup
   * @param {Array<string>} [options.additionalJobIds=[]] - Additional job IDs to cleanup
   * @param {Array<string>} [options.additionalScheduleIds=[]] - Additional schedule IDs to cleanup
   * @returns {Promise<Object>} Complete cleanup summary
   */
  async fullCleanup(options = {}) {
    const config = {
      cleanupVMs: true,
      cleanupBackupJobs: true,
      cleanupSchedules: true,
      backupRepositoryId: null,
      additionalVmIds: [],
      additionalJobIds: [],
      additionalScheduleIds: [],
      ...options,
    }

    const fullResults = {
      startedAt: new Date().toISOString(),
      vms: null,
      backupJobs: null,
      schedules: null,
      backupRepository: null,
      completedAt: null,
      totalDeleted: 0,
      totalFailed: 0,
      success: false,
    }

    log.debug('Cleaning up test resources')

    try {
      // Cleanup in order: Jobs → Schedules → VMs → Repository
      if (config.cleanupBackupJobs) {
        fullResults.backupJobs = await this.deleteBackupJobs({ includeIds: config.additionalJobIds })
        fullResults.totalDeleted += fullResults.backupJobs.deleted
        fullResults.totalFailed += fullResults.backupJobs.failed
      }

      if (config.cleanupSchedules) {
        fullResults.schedules = await this.deleteSchedules({ includeIds: config.additionalScheduleIds })
        fullResults.totalDeleted += fullResults.schedules.deleted
        fullResults.totalFailed += fullResults.schedules.failed
      }

      if (config.cleanupVMs) {
        fullResults.vms = await this.deleteQAVMs({ includeIds: config.additionalVmIds, force: false })
        fullResults.totalDeleted += fullResults.vms.deleted
        fullResults.totalFailed += fullResults.vms.failed
      }

      if (config.backupRepositoryId) {
        try {
          fullResults.backupRepository = await this.deleteBackupRepository(config.backupRepositoryId)
          fullResults.totalDeleted++
        } catch (error) {
          log.warn('Repository cleanup failed', { error })
          fullResults.backupRepository = { error: error.message }
          fullResults.totalFailed++
        }
      }

      fullResults.completedAt = new Date().toISOString()
      fullResults.success = fullResults.totalFailed === 0

      const duration = (new Date(fullResults.completedAt) - new Date(fullResults.startedAt)) / 1000
      log.debug('Cleanup completed', { totalDeleted: fullResults.totalDeleted, durationSec: Math.round(duration) })
    } catch (error) {
      fullResults.completedAt = new Date().toISOString()
      fullResults.error = error.message
      fullResults.success = false
      log.warn('Full cleanup failed', { error })
      throw error
    }

    return fullResults
  }
}
