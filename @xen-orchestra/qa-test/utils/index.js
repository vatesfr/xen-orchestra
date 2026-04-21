import assert from 'node:assert/strict'
import fs from 'node:fs/promises'

// =============================================================================
// VALIDATION UTILITIES
// =============================================================================

/**
 * Asserts that a value is a non-empty string.
 *
 * @param {unknown} value - Value to validate
 * @param {string} errorMessage - Error message if validation fails
 * @param {string} [errorCode] - Optional error code to attach
 * @throws {Error} If value is not a valid non-empty string
 */
export function assertNonEmptyString(value, errorMessage, errorCode) {
  if (!value || typeof value !== 'string') {
    const error = new Error(errorMessage)
    if (errorCode) {
      error.code = errorCode
    }
    throw error
  }
}

/**
 * Asserts that a file exists at the given path.
 *
 * Uses native fs.access() which throws ENOENT if file doesn't exist.
 * Re-throws with additional context while preserving original error as cause.
 *
 * @param {string} filePath - Path to check
 * @throws {Error} If file does not exist (code: ENOENT, with cause)
 */
export async function assertFileExists(filePath) {
  try {
    await fs.access(filePath)
  } catch (cause) {
    const error = new Error(`File not found: ${filePath}`)
    error.code = cause.code ?? 'ENOENT'
    error.cause = cause
    throw error
  }
}

// =============================================================================
// SCHEDULE UTILITIES
// =============================================================================

/**
 * Creates a default schedule configuration for backup jobs.
 *
 * Returns a standard schedule object configured for daily execution
 * at midnight. This is commonly used for test backup jobs that need
 * a valid schedule configuration.
 *
 * @returns {Object} Schedule configuration object
 * @returns {string} returns.cron - Cron expression for daily execution at midnight ('0 0 * * *')
 */
export const getDefaultSchedule = () => ({
  cron: '0 0 * * *',
})

/**
 * Simple delay function.
 *
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise<void>} Resolves after the specified delay
 */
export const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

/**
 * Formats a duration from milliseconds to a human-readable string.
 *
 * @param {number} ms - Duration in milliseconds
 * @returns {string} Human-readable duration string
 */
export const formatDuration = ms => {
  if (ms < 1000) return `${ms}ms`

  const seconds = Math.floor(ms / 1000)
  if (seconds < 60) return `${seconds}s`

  const minutes = Math.floor(seconds / 60)
  return `${minutes}m ${seconds % 60}s`
}

// =============================================================================
// UTILITIES NEEDED BY EXISTING TESTS
// =============================================================================

/**
 * Prefix used for backup job names.
 * Used for both name generation and cleanup pattern matching.
 * @constant {string}
 */
export const BACKUP_JOB_NAME_PREFIX = 'QA-Test-'

/**
 * Generates a unique backup job name with timestamp.
 * @returns {string} Backup job name in format: QA-Test-{timestamp}
 */
export function generateBackupJobName() {
  return `${BACKUP_JOB_NAME_PREFIX}${Date.now()}`
}

export async function waitUntil(conditionFn, interval = 1000, timeout = 15_000, options = {}) {
  const startTime = Date.now()
  let currentInterval = interval

  while (Date.now() - startTime < timeout) {
    try {
      const result = await conditionFn()
      if (result !== false) {
        return result
      }
    } catch (error) {
      // Continue waiting on errors
      console.debug('waitUntil condition error:', error.message)
    }

    await delay(currentInterval)

    // Apply exponential backoff if configured
    if (options.exponentialBackoff && options.backoffMultiplier) {
      currentInterval = Math.min(currentInterval * options.backoffMultiplier, options.maxInterval || 30_000)
    }
  }

  throw new Error(`waitUntil timed out after ${timeout}ms`)
}

/**
 * Determines whether a backup was full or incremental for a specific backup repository.
 *
 * Analyzes backup log entries to determine the backup type (full vs incremental)
 * for a specific backup repository location. Recursively searches through all tasks
 * and subtasks to find export operations matching the specified backup repository UUID.
 *
 * @param {Object} logEntry - Backup log entry object from XenOrchestra
 * @param {Object} logEntry.tasks - Array of backup tasks and subtasks
 * @param {string} backupRepositoryUuid - UUID of the backup repository to check
 * @returns {boolean|undefined} True if full backup, false if incremental, undefined if not found
 */
export function getIsFullForBackupRepository(logEntry, backupRepositoryUuid) {
  if (!logEntry || typeof logEntry !== 'object') {
    throw new Error('Valid log entry object is required')
  }

  assertNonEmptyString(backupRepositoryUuid, 'Valid backup repository UUID string is required')

  /**
   * Recursively searches through backup tasks to find export operations.
   *
   * @param {Array} tasks - Array of backup task objects
   * @returns {boolean|undefined} Backup type or undefined if not found
   * @private
   */
  function searchTasks(tasks) {
    if (!Array.isArray(tasks)) {
      return undefined
    }

    for (const task of tasks) {
      // Check if this task is an export operation for the specified backup repository
      if (
        task.message === 'export' &&
        task.data &&
        task.data.id === backupRepositoryUuid &&
        task.data.type === 'remote' &&
        typeof task.data.isFull === 'boolean'
      ) {
        return task.data.isFull
      }

      // Recursively search nested tasks
      if (task.tasks && task.tasks.length > 0) {
        const result = searchTasks(task.tasks)
        if (result !== undefined) {
          return result
        }
      }
    }

    return undefined
  }

  // Search through the backup log tasks
  if (logEntry.tasks && logEntry.tasks.length > 0) {
    const result = searchTasks(logEntry.tasks)
    if (result !== undefined) {
      return result
    }
  }

  return undefined // Export operation not found for this backup repository
}

// =============================================================================
// SR REPLICATION (CR/DR MODE) UTILITIES
// =============================================================================

/**
 * Determines whether a replication was full or incremental for a specific SR.
 *
 * Similar to getIsFullForBackupRepository but checks for SR-type exports
 * (used in CR mode — delta replication to SR).
 *
 * @param {Object} logEntry - Backup log entry object from XenOrchestra
 * @param {string} srUuid - UUID of the target SR
 * @returns {boolean|undefined} True if full, false if incremental, undefined if not found
 */
export function getIsFullForSr(logEntry, srUuid) {
  if (!logEntry || typeof logEntry !== 'object') {
    throw new Error('Valid log entry object is required')
  }

  assertNonEmptyString(srUuid, 'Valid SR UUID string is required')

  function searchTasks(tasks) {
    if (!Array.isArray(tasks)) {
      return undefined
    }

    for (const task of tasks) {
      if (
        task.message === 'export' &&
        task.data &&
        task.data.id === srUuid &&
        task.data.type === 'SR' &&
        typeof task.data.isFull === 'boolean'
      ) {
        return task.data.isFull
      }

      if (task.tasks && task.tasks.length > 0) {
        const result = searchTasks(task.tasks)
        if (result !== undefined) {
          return result
        }
      }
    }

    return undefined
  }

  if (logEntry.tasks && logEntry.tasks.length > 0) {
    const result = searchTasks(logEntry.tasks)
    if (result !== undefined) {
      return result
    }
  }

  return undefined
}

/**
 * Asserts replication type (full or delta) for a given target SR.
 *
 * @param {Object} result - Backup log result
 * @param {string} srUuid - UUID of the target SR
 * @param {Object} options
 * @param {boolean} options.mustBeFull - Whether replication should be full
 * @throws {Error} If replication type does not match expectation
 */
export function assertFullOrDeltaForSr(result, srUuid, { mustBeFull }) {
  const isFull = getIsFullForSr(result, srUuid)
  assert.strictEqual(
    isFull,
    mustBeFull,
    `SR replication should be ${mustBeFull ? 'full' : 'delta'}, got ${isFull === undefined ? 'not found' : isFull ? 'full' : 'delta'}`
  )
}

/**
 * Finds the first task matching a given message name in a backup log entry.
 *
 * Recursively searches through all tasks and subtasks.
 *
 * @param {Object} logEntry - Backup log entry from XenOrchestra
 * @param {string} message - Task message to search for (e.g., 'target snapshot', 'transfer')
 * @returns {Object|null} The matching task or null if not found
 */
export function findTaskByMessage(logEntry, message) {
  function search(tasks) {
    if (!Array.isArray(tasks)) {
      return null
    }

    for (const task of tasks) {
      if (task.message === message) {
        return task
      }

      if (task.tasks && task.tasks.length > 0) {
        const result = search(task.tasks)
        if (result) {
          return result
        }
      }
    }

    return null
  }

  return search(logEntry.tasks || [])
}

// =============================================================================
// BACKUP ASSERTION UTILITIES
// =============================================================================

/**
 * Asserts backup type (full or delta) for a given backup repository.
 *
 * @param {Object} result - Backup log result
 * @param {string} backupRepositoryId - UUID of the backup repository
 * @param {Object} options
 * @param {boolean} options.mustBeFull - Whether backup should be full
 * @throws {Error} If backup type does not match expectation
 */
export function assertFullOrDelta(result, backupRepositoryId, { mustBeFull }) {
  const isFull = getIsFullForBackupRepository(result, backupRepositoryId)
  assert.strictEqual(
    isFull,
    mustBeFull,
    `Backup should be ${mustBeFull ? 'full' : 'delta'}, got ${isFull ? 'full' : 'delta'}`
  )
}

/**
 * Extracts the first schedule key from a backup job's settings.
 *
 * @param {Object} job - Backup job object
 * @returns {string|undefined} The first schedule key, or undefined if not found
 */
export function getScheduleKey(job) {
  if (!job?.settings || typeof job.settings !== 'object') return undefined
  return Object.keys(job.settings).find(key => key !== '')
}

// =============================================================================
// HEALTH CHECK UTILITIES
// =============================================================================

/**
 * Extracts health check information from a backup log entry.
 *
 * Recursively searches through backup log tasks to find health check task
 * and extracts relevant information including status, timing, and error details.
 *
 * @param {Object} logEntry - Backup log entry from XenOrchestra
 * @param {Array} logEntry.tasks - Array of backup tasks and subtasks
 * @returns {Object} Health check data
 * @returns {boolean} returns.exists - Whether health check was found
 * @returns {Object|null} returns.task - The health check task object
 * @returns {string|null} returns.status - Health check status (success/failure/skipped)
 * @returns {number|null} returns.duration - Duration in milliseconds
 * @returns {Object|null} returns.error - Error object if failed
 */
export function extractHealthCheckData(logEntry) {
  if (!logEntry || typeof logEntry !== 'object') {
    throw new Error('Valid log entry object is required')
  }

  /**
   * Recursively searches backup tasks for health check task.
   *
   * @param {Array} tasks - Array of backup task objects
   * @returns {Object|null} Health check task or null if not found
   * @private
   */
  function findHealthCheckTask(tasks) {
    if (!Array.isArray(tasks)) {
      return null
    }

    for (const task of tasks) {
      // Check if this is a health check task
      if (task.message === 'health check') {
        return task
      }

      // Recursively search nested tasks
      if (task.tasks && task.tasks.length > 0) {
        const result = findHealthCheckTask(task.tasks)
        if (result) {
          return result
        }
      }
    }

    return null
  }

  const healthCheckTask = findHealthCheckTask(logEntry.tasks || [])

  if (!healthCheckTask) {
    return {
      exists: false,
      task: null,
      status: null,
      duration: null,
      error: null,
    }
  }

  const duration = healthCheckTask.end && healthCheckTask.start ? healthCheckTask.end - healthCheckTask.start : null

  return {
    exists: true,
    task: healthCheckTask,
    status: healthCheckTask.status,
    duration,
    error: healthCheckTask.result?.error || healthCheckTask.error || null,
  }
}

/**
 * Asserts that a health check exists in the backup log.
 *
 * @param {Object} logEntry - Backup log entry
 * @param {string} [message] - Custom assertion message
 * @throws {Error} If health check is not found
 */
export function assertHealthCheckExists(logEntry, message = 'Health check task should exist in backup log') {
  const healthCheckData = extractHealthCheckData(logEntry)

  if (!healthCheckData.exists) {
    throw new Error(message)
  }
}

/**
 * Asserts that a health check has the expected status.
 *
 * @param {Object} logEntry - Backup log entry
 * @param {string} expectedStatus - Expected status (success/failure/skipped)
 * @param {string} [message] - Custom assertion message
 * @throws {Error} If status doesn't match or health check not found
 */
export function assertHealthCheckStatus(logEntry, expectedStatus, message) {
  const healthCheckData = extractHealthCheckData(logEntry)

  if (!healthCheckData.exists) {
    throw new Error('Health check task not found in backup log')
  }

  if (healthCheckData.status !== expectedStatus) {
    const details = [
      `Expected: '${expectedStatus}'`,
      `Actual: '${healthCheckData.status}'`,
      healthCheckData.duration ? `Duration: ${healthCheckData.duration}ms` : null,
      healthCheckData.error ? `Error: ${healthCheckData.error.message || healthCheckData.error}` : null,
    ]
      .filter(Boolean)
      .join(', ')

    const commonCauses =
      healthCheckData.status === 'failure'
        ? '\n  Common causes: VM without Xen Tools installed, insufficient Storage Repository space, network issues'
        : ''

    const msg = message || `Health check status mismatch - ${details}${commonCauses}`
    throw new Error(msg)
  }
}

/**
 * Asserts that a health check succeeded.
 *
 * @param {Object} logEntry - Backup log entry
 * @param {string} [message] - Custom assertion message
 * @throws {Error} If health check failed or is missing
 */
export function assertHealthCheckSuccess(logEntry, message) {
  assertHealthCheckStatus(logEntry, 'success', message)
}

/**
 * Asserts that a health check was skipped.
 *
 * @param {Object} logEntry - Backup log entry
 * @param {string} [message] - Custom assertion message
 * @throws {Error} If health check was not skipped
 */
export function assertHealthCheckSkipped(logEntry, message) {
  assertHealthCheckStatus(logEntry, 'skipped', message)
}

/**
 * Checks if a health check error indicates an unhealthy VDI chain.
 *
 * @param {Object} healthCheckData - Health check data from extractHealthCheckData
 * @returns {boolean} True if error is unhealthy VDI chain
 */
export function isUnhealthyVdiChainError(healthCheckData) {
  if (!healthCheckData.error) {
    return false
  }

  const errorMessage = healthCheckData.error.message || String(healthCheckData.error)
  return errorMessage.toLowerCase().includes('unhealthy vdi chain')
}

/**
 * Gets a human-readable summary of health check results.
 *
 * @param {Object} logEntry - Backup log entry
 * @returns {string} Human-readable summary
 */
export function getHealthCheckSummary(logEntry) {
  const healthCheckData = extractHealthCheckData(logEntry)

  if (!healthCheckData.exists) {
    return 'No health check performed'
  }

  const parts = [
    `Status: ${healthCheckData.status}`,
    healthCheckData.duration ? `Duration: ${healthCheckData.duration}ms` : null,
    healthCheckData.error ? `Error: ${healthCheckData.error.message || healthCheckData.error}` : null,
  ].filter(Boolean)

  return parts.join(', ')
}

// =============================================================================
// BACKUP SIZE UTILITIES
// =============================================================================

/**
 * Gets the number of bytes transferred during a backup.
 *
 * Extracts size information from transfer/merge tasks in the backup log.
 * Size data is stored in task.result.size for tasks with message 'transfer' or 'merge'.
 *
 * This is useful for verifying incremental backup efficiency - incremental
 * backups should transfer fewer bytes than full backups.
 *
 * @param {Object} logEntry - Backup log entry from XenOrchestra
 * @returns {number|null} Bytes transferred, or null if not found
 */
export function getBackupTransferredBytes(logEntry) {
  if (!logEntry || typeof logEntry !== 'object') {
    throw new Error('Valid log entry object is required')
  }

  function findTransferSize(tasks) {
    if (!Array.isArray(tasks)) {
      return null
    }

    for (const task of tasks) {
      // Size is in transfer or merge task.result
      if ((task.message === 'transfer' || task.message === 'merge') && task.result?.size !== undefined) {
        return task.result.size
      }

      // Recursively search nested tasks
      if (task.tasks?.length > 0) {
        const result = findTransferSize(task.tasks)
        if (result !== null) {
          return result
        }
      }
    }

    return null
  }

  return findTransferSize(logEntry.tasks || [])
}

/**
 * Asserts that incremental backup transferred fewer bytes or equal bytes than the baseline.
 *
 * This validates that incremental backups are efficient. Delta backups typically
 * transfer significantly less data than full backups. Equal size is acceptable
 * when no changes were made to the VM since the last backup.
 *
 * @param {Object} incrementalLog - Backup log entry for incremental backup
 * @param {Object} baselineLog - Backup log entry for baseline (typically full backup)
 * @param {string} [message] - Custom assertion message
 * @throws {Error} If incremental backup transferred more bytes than baseline or size data unavailable
 */
export function assertIncrementalBackupEfficiency(incrementalLog, baselineLog, message) {
  const incrementalBytes = getBackupTransferredBytes(incrementalLog)
  const baselineBytes = getBackupTransferredBytes(baselineLog)

  if (incrementalBytes === null || baselineBytes === null) {
    throw new Error(
      'Cannot validate incremental backup efficiency: size data not available in backup logs. ' +
        'This may indicate a problem with backup log structure.'
    )
  }

  if (incrementalBytes > baselineBytes) {
    const msg =
      message ||
      `Incremental backup transferred MORE data than full backup (unexpected). ` +
        `Incremental: ${(incrementalBytes / 1024 / 1024).toFixed(2)} MB, ` +
        `Baseline: ${(baselineBytes / 1024 / 1024).toFixed(2)} MB`
    throw new Error(msg)
  }

  // Equal or less is OK (equal means no changes since last backup)
}
