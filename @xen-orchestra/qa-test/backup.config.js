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
export function backupConfig(name, schedule, vm, backupRepository, options = {}) {
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
    vms: {
      [vm.uuid]: vm,
    },
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

  return config
}

// One delta job over a whole fleet (a future fleetFullBackupConfig covers mode: 'full').
// mergeBackupsSynchronously folds merge/cleanup into the job's own duration, so start/end
// alone is the total cost — nothing extra to measure.
export function fleetDeltaBackupConfig(name, schedule, vmIds, backupRepositoryIds, options = {}) {
  const { concurrency = 2, exportRetention = 2 } = options

  return {
    name,
    mode: 'delta',
    schedules: {
      '': schedule,
    },
    settings: {
      '': {
        timezone: 'Europe/Paris',
        concurrency,
        exportRetention,
        mergeBackupsSynchronously: true,
        bypassVdiChainsCheck: true,
      },
    },
    vms: Object.fromEntries(vmIds.map(id => [id, true])),
    remotes: Object.fromEntries(backupRepositoryIds.map(id => [id, true])),
  }
}
