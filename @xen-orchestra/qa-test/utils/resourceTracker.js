/**
 * Resource Tracker Utility - Factory Pattern for isolated test resource tracking.
 *
 * @example
 * const tracker = createResourceTracker('session-id');
 * tracker.trackResource('vm', 'vm-id', { name: 'Test VM' });
 * const resources = tracker.getTrackedResources();
 * tracker.clearTrackedResources();
 */

// Resource type configuration
const RESOURCE_TYPES = {
  vm: { array: true, label: 'VM' },
  backupJob: { array: true, label: 'backup job' },
  schedule: { array: true, label: 'schedule' },
  backupRepository: { array: false, label: 'backup repository' },
  exportedFile: { array: true, label: 'exported file' },
  restoredVm: { array: true, label: 'restored VM' },
  importedVdi: { array: true, label: 'imported VDI' },
}

// Reserved metadata keys that cannot be overridden
const RESERVED_KEYS = ['id', 'type', 'createdAt', 'sessionId']

/**
 * Creates a new resource tracker instance with isolated state.
 * @param {string} [sessionId] - Session identifier
 * @returns {Object} Resource tracker instance
 */
export function createResourceTracker(sessionId = null) {
  const resources = {
    vms: [],
    backupJobs: [],
    backupRepository: null,
    schedules: [],
    exportedFiles: [],
    restoredVms: [],
    importedVdis: [],
    testSessionId: sessionId || `test-session-${Date.now()}`,
  }

  console.log(`🎯 Created resource tracker for session: ${resources.testSessionId}`)

  /**
   * Track a resource of a specific type.
   * @param {string} type - Resource type
   * @param {string} id - Resource ID
   * @param {Object} [metadata={}] - Additional metadata
   * @throws {Error} If resource ID is missing or type is unknown
   */
  function trackResource(type, id, metadata = {}) {
    if (!id) throw new Error('Resource ID is required')
    if (!RESOURCE_TYPES[type]) throw new Error(`Unknown resource type: ${type}`)

    // Filter out reserved keys and build resource data
    const filteredMetadata = Object.fromEntries(
      Object.entries(metadata).filter(([key]) => !RESERVED_KEYS.includes(key))
    )

    const resourceData = {
      ...filteredMetadata,
      id,
      type,
      createdAt: new Date().toISOString(),
      sessionId: resources.testSessionId,
    }

    const config = RESOURCE_TYPES[type]

    if (config.array) {
      const arrayName = type + 's' // vm -> vms, backupJob -> backupJobs, etc.
      const existingIndex = resources[arrayName].findIndex(r => r.id === id)
      if (existingIndex === -1) {
        resources[arrayName].push(resourceData)
      } else {
        resources[arrayName][existingIndex] = resourceData
      }
    } else {
      resources[type] = resourceData
    }

    console.log(`📝 Tracked ${type}: ${id}${metadata.name ? ` (${metadata.name})` : ''}`)
  }

  // Helper for shallow copy
  const _shallowCopy = data => {
    if (Array.isArray(data)) return data.map(item => ({ ...item }))
    if (data && typeof data === 'object') return { ...data }
    return data
  }

  /**
   * Get all tracked resources with defensive shallow copies.
   * @returns {Object} All tracked resources
   */
  function getTrackedResources() {
    const vms = _shallowCopy(resources.vms)
    const backupJobs = _shallowCopy(resources.backupJobs)
    const schedules = _shallowCopy(resources.schedules)
    const backupRepository = _shallowCopy(resources.backupRepository)
    const exportedFiles = _shallowCopy(resources.exportedFiles)
    const restoredVms = _shallowCopy(resources.restoredVms)
    const importedVdis = _shallowCopy(resources.importedVdis)

    return {
      vms,
      backupJobs,
      schedules,
      backupRepository,
      exportedFiles,
      restoredVms,
      importedVdis,
      testSessionId: resources.testSessionId,
      summary: {
        totalVms: vms.length,
        totalBackupJobs: backupJobs.length,
        totalSchedules: schedules.length,
        hasBackupRepository: !!backupRepository,
        totalExportedFiles: exportedFiles.length,
        totalRestoredVms: restoredVms.length,
        totalImportedVdis: importedVdis.length,
      },
    }
  }

  /**
   * Get tracked resources of a specific type.
   * @param {string} type - Resource type
   * @returns {Array|Object|null} Defensive copy of resources
   * @throws {Error} If resource type is unknown
   */
  function getTrackedResourcesByType(type) {
    if (!RESOURCE_TYPES[type]) throw new Error(`Unknown resource type: ${type}`)

    const arrayName = RESOURCE_TYPES[type].array ? type + 's' : type
    return _shallowCopy(resources[arrayName])
  }

  /**
   * Remove a resource from tracking.
   * @param {string} type - Resource type
   * @param {string} id - Resource ID to remove
   * @returns {boolean} True if resource was removed
   */
  function untrackResource(type, id) {
    if (!RESOURCE_TYPES[type]) throw new Error(`Unknown resource type: ${type}`)

    const config = RESOURCE_TYPES[type]

    if (config.array) {
      const arrayName = type + 's'
      const index = resources[arrayName].findIndex(r => r.id === id)
      if (index !== -1) {
        resources[arrayName].splice(index, 1)
        console.log(`✅ Untracked ${config.label}: ${id}`)
        return true
      }
      return false
    }

    if (resources[type]?.id === id) {
      resources[type] = null
      console.log(`✅ Untracked ${config.label}: ${id}`)
      return true
    }

    return false
  }

  /**
   * Clear all tracked resources.
   * @returns {Object} Summary of cleared resources
   */
  function clearTrackedResources() {
    const summaryText = getResourceSummary() // Get summary BEFORE clearing
    const summary = getTrackedResources().summary

    resources.vms = []
    resources.backupJobs = []
    resources.schedules = []
    resources.backupRepository = null
    resources.exportedFiles = []
    resources.restoredVms = []
    resources.importedVdis = []

    console.log(`🧹 Cleared: ${summaryText}`)
    return summary
  }

  /**
   * Get a human-readable summary of tracked resources.
   * @returns {string} Summary string
   */
  function getResourceSummary() {
    const { summary: s } = getTrackedResources()
    const parts = [
      s.totalVms > 0 && `${s.totalVms} VM${s.totalVms > 1 ? 's' : ''}`,
      s.totalBackupJobs > 0 && `${s.totalBackupJobs} backup job${s.totalBackupJobs > 1 ? 's' : ''}`,
      s.totalSchedules > 0 && `${s.totalSchedules} schedule${s.totalSchedules > 1 ? 's' : ''}`,
      s.hasBackupRepository && '1 backup repository',
      s.totalExportedFiles > 0 && `${s.totalExportedFiles} exported file${s.totalExportedFiles > 1 ? 's' : ''}`,
      s.totalRestoredVms > 0 && `${s.totalRestoredVms} restored VM${s.totalRestoredVms > 1 ? 's' : ''}`,
      s.totalImportedVdis > 0 && `${s.totalImportedVdis} imported VDI${s.totalImportedVdis > 1 ? 's' : ''}`,
    ].filter(Boolean)

    return parts.length > 0 ? parts.join(', ') : 'no resources'
  }

  /** Get the current session ID */
  function getSessionId() {
    return resources.testSessionId
  }

  // Return public API
  return {
    trackResource,
    getTrackedResources,
    getTrackedResourcesByType,
    untrackResource,
    clearTrackedResources,
    getResourceSummary,
    getSessionId,
  }
}
