import assert from 'node:assert'

/**
 * Asserts that a backup repository is empty (contains no VM backups).
 *
 * This safety check prevents tests from running against repositories that
 * already contain data, which could lead to accidental data loss if the
 * repository is misconfigured to point at a production remote.
 *
 * @param {import('../client/dispatchClient.js').DispatchClient} dispatchClient
 * @param {{id: string, name: string}} repository - The backup repository to check
 * @throws {Error} If the repository contains existing backups
 */
export const assertRepositoryEmpty = async (dispatchClient, repository) => {
  const backups = await dispatchClient.backup.listVmBackups([repository.id])
  const count = Object.values(backups).flatMap(vmBackups => Object.values(vmBackups).flat()).length

  if (count > 0) {
    throw new Error(
      `Repository "${repository.name}" (${repository.id}) contains ${count} existing backup(s). ` +
        `Tests require empty repositories to avoid accidental data loss. ` +
        `Please purge the backups manually or use a dedicated test repository.`
    )
  }
}

/**
 * Extracts an error message from a backup task's result or error fields.
 *
 * XO backup logs store errors in various locations depending on the error type:
 * - `task.result` as an object with `message` (most common for XAPI errors)
 * - `task.result` as a plain string
 * - `task.result.code` with optional `task.result.params`
 * - `task.error` with a `message` property
 *
 * @param {Object} task - A backup task object from the log
 * @returns {string} Human-readable error message
 */
const extractTaskError = task => {
  // Check task.result (most common location for XO backup errors)
  if (task.result != null) {
    if (typeof task.result === 'string') {
      return task.result
    }
    if (typeof task.result === 'object') {
      if (task.result.message) {
        const code = task.result.code ? `[${task.result.code}] ` : ''
        return `${code}${task.result.message}`
      }
      if (task.result.code) {
        const params = task.result.params ? ` (${task.result.params.join(', ')})` : ''
        return `${task.result.code}${params}`
      }
    }
  }

  // Fallback to task.error
  if (task.error?.message) {
    return task.error.message
  }

  return 'unknown error'
}

/**
 * Recursively extracts error messages from backup result tasks.
 * @param {Object} result - Backup log result
 * @returns {string[]} List of error messages found in failed tasks
 */
export const extractBackupErrors = result => {
  const errors = []
  const walkTasks = tasks => {
    for (const task of tasks ?? []) {
      if (task.status === 'failure') {
        errors.push(`[${task.message}] ${extractTaskError(task)}`)
      }
      if (task.tasks) {
        walkTasks(task.tasks)
      }
    }
  }
  walkTasks(result.tasks)
  return errors
}

/**
 * Asserts that a backup result has succeeded, with detailed error reporting on failure.
 * @param {Object} result - Backup log result
 * @param {string} [context] - Additional context for the error message
 */
export const assertBackupSuccess = (result, context = 'Backup') => {
  if (result.status !== 'success') {
    const errors = extractBackupErrors(result)
    const details = errors.length > 0 ? errors.join(' | ') : 'no task-level error details'
    console.error(`${context} failed — raw backup log tasks:`, JSON.stringify(result.tasks, null, 2))
    assert.strictEqual(result.status, 'success', `${context} should succeed, got '${result.status}': ${details}`)
  }
}
