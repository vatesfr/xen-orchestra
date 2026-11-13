import { TEMPORARY_SCHEDULE_ID } from './utils/index.js'

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
      [TEMPORARY_SCHEDULE_ID]: schedule, // Default schedule slot
    },
    settings: {
      // General settings left empty, required by the REST API for backup and mirror jobs, and the settings go to the schedule
      '': {},
      [TEMPORARY_SCHEDULE_ID]: {
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
    config.settings[TEMPORARY_SCHEDULE_ID].healthCheckSr = options.healthCheckSr
  }

  // Add NBD settings if provided
  if (options.preferNbd !== undefined) {
    config.settings[TEMPORARY_SCHEDULE_ID].preferNbd = options.preferNbd
  }

  if (options.nbdConcurrency !== undefined) {
    config.settings[TEMPORARY_SCHEDULE_ID].nbdConcurrency = options.nbdConcurrency
  }

  if (options.snapshotConcurrency !== undefined) {
    config.settings[TEMPORARY_SCHEDULE_ID].snapshotConcurrency = options.snapshotConcurrency
  }

  if (options.synchronizedSnapshot !== undefined) {
    config.settings[TEMPORARY_SCHEDULE_ID].synchronizedSnapshot = options.synchronizedSnapshot
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
      [TEMPORARY_SCHEDULE_ID]: schedule,
    },
    settings: {
      '': {},
      [TEMPORARY_SCHEDULE_ID]: {
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
