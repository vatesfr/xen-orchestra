/**
 * Generates backup job configuration with optional health check and NBD support.
 *
 * @param {string} name - Backup job name
 * @param {Object} schedule - Schedule configuration
 * @param {Object} vm - VM object to backup
 * @param {Object} backupRepository - Backup repository (remote) object
 * @param {Object} [options={}] - Additional options
 * @param {string} [options.healthCheckSr] - SR UUID for health checks
 * @param {boolean} [options.preferNbd] - Use NBD protocol for backup transfers
 * @param {number} [options.nbdConcurrency] - Number of concurrent NBD connections (default: 1)
 * @returns {Object} Complete backup job configuration
 */
export function backupConfig(name, schedule, vms, backupRepository, options = {}) {
  const config = {
    name,
    mode: 'delta', // Will be overridden by tests
    schedules: {
      '': schedule, // Default schedule slot
    },
    settings: {
      '': {
        timezone: 'Europe/Paris',
        exportRetention: 2,
        mergeBackupsSynchronously: true,
        bypassVdiChainsCheck: true,
      },
    },
    vms: Array.isArray(vms) ? Object.fromEntries(vms.map(vm => [vm.uuid, vm])) : { [vms.uuid]: vms },
    remotes: {
      [backupRepository.id]: backupRepository,
    },
  }

  // Add health check SR if provided
  if (options.healthCheckSr) {
    config.settings[''].healthCheckSr = options.healthCheckSr
  }

  // Add NBD settings if provided
  if (options.preferNbd !== undefined) {
    config.settings[''].preferNbd = options.preferNbd
  }

  if (options.nbdConcurrency !== undefined) {
    config.settings[''].nbdConcurrency = options.nbdConcurrency
  }

  if (options.snapshotConcurrency !== undefined) {
    config.settings[''].snapshotConcurrency = options.snapshotConcurrency
  }

  if (options.synchronizedSnapshot !== undefined) {
    config.settings[''].synchronizedSnapshot = options.synchronizedSnapshot
  }

  return config
}
