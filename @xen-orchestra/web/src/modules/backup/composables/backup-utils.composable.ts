import type { AnyXoBackupJob, XoMetadataBackupJob, XoMirrorBackupJob, XoVmBackupJob } from '@vates/types'
import { useI18n } from 'vue-i18n'

export function useBackupUtils() {
  const { t } = useI18n()

  const hasSnapshotRetention = (backupJob: XoVmBackupJob) =>
    Object.values(backupJob.settings).some(
      settingsGroup =>
        settingsGroup &&
        'snapshotRetention' in settingsGroup &&
        typeof settingsGroup.snapshotRetention === 'number' &&
        settingsGroup.snapshotRetention > 0
    )

  function getVmBackupModes(backupJob: XoVmBackupJob) {
    const modes = []

    // Rolling Snapshot - check if any settings have snapshotRetention > 0
    if (hasSnapshotRetention(backupJob)) {
      modes.push(t('backup:rolling-snapshot'))
    }

    const hasRemotes = hasIds(backupJob.remotes?.id)

    const hasSrs = hasIds(backupJob.srs?.id)

    if (backupJob.mode === 'full') {
      if (hasRemotes) {
        modes.push(t('backup:full'))
      }

      if (hasSrs) {
        modes.push(t('backup:full-replication'))
      }
    } else if (backupJob.mode === 'delta') {
      if (hasRemotes) {
        modes.push(t('backup:incremental'))
      }

      if (hasSrs) {
        modes.push(t('backup:incremental-replication'))
      }
    }

    return modes
  }

  function getMetadataBackupModes(backupJob: XoMetadataBackupJob) {
    const modes = []

    if (hasIds(backupJob.pools?.id)) {
      modes.push(t('backup:pool-metadata'))
    }

    if (backupJob.xoMetadata) {
      modes.push(t('backup:xo-config'))
    }

    return modes
  }

  function getMirrorBackupModes(backupJob: XoMirrorBackupJob): string[] {
    const modes = []

    if (backupJob.mode === 'full') {
      modes.push(t('backup:mirror:full'))
    } else if (backupJob.mode === 'delta') {
      modes.push(t('backup:mirror:incremental'))
    }

    return modes
  }

  function getModeLabels(backupJob: AnyXoBackupJob): string[] {
    switch (backupJob.type) {
      case 'mirrorBackup':
        return getMirrorBackupModes(backupJob)
      case 'backup':
        return getVmBackupModes(backupJob)
      case 'metadataBackup':
        return getMetadataBackupModes(backupJob)
      default:
        return []
    }
  }
  function toIds<TId extends string>(input: TId | { __or: TId[] } | undefined): TId[] {
    if (typeof input === 'string') {
      return [input]
    }

    if (input && '__or' in input) {
      return input.__or
    }

    return []
  }

  function hasIds<TId extends string>(input: TId | { __or: TId[] } | undefined): boolean {
    return toIds(input).length > 0
  }

  return {
    hasIds,
    toIds,
    getModeLabels,
    getVmBackupModes,
    getMetadataBackupModes,
    getMirrorBackupModes,
    hasSnapshotRetention,
  }
}
