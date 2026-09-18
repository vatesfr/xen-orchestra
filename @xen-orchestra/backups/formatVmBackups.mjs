// @ts-check

import mapValues from 'lodash/mapValues.js'
import { dirname } from 'node:path'
import { normalize } from '@xen-orchestra/fs/path'

/**
 * A journal event whose backup has been resolved to its current metadata, as
 * `RemoteAdapter#readBackupJournalEvents()` returns it.
 *
 * @typedef {object} ResolvedJournalEvent
 * @property {string} event
 * @property {string} vmUuid
 * @property {string} filename normalized path of the backup metadata
 * @property {object} [metadata] current metadata of the backup, on `add` and `change`
 */

/**
 * A journal event whose backup has been formatted for the users.
 *
 * @typedef {object} FormattedJournalEvent
 * @property {string} event
 * @property {string} vmUuid
 * @property {string} filename normalized path of the backup metadata
 * @property {object} [backup] current value of the backup, on `add` and `change`
 */

export function formatVmBackup(backup) {
  const { isVhdDifferencing, vmSnapshot } = backup

  let differencingVhds
  let dynamicVhds
  // some backups don't use snapshots, therefore cannot be with memory
  const withMemory = vmSnapshot !== undefined && vmSnapshot.suspend_VDI !== 'OpaqueRef:NULL'
  // isVhdDifferencing is either undefined or an object
  if (isVhdDifferencing !== undefined) {
    differencingVhds = Object.values(isVhdDifferencing).filter(t => t).length
    dynamicVhds = Object.values(isVhdDifferencing).filter(t => !t).length
    if (withMemory) {
      // the suspend VDI (memory) is always a dynamic
      dynamicVhds -= 1
    }
  }
  return {
    type: 'xo-vm-backup',
    backupRepository: backup.backupRepositoryId,
    disks:
      backup.vhds === undefined
        ? []
        : Object.keys(backup.vhds).map(vdiId => {
            const vdi = backup.vdis[vdiId]
            return {
              id: `${dirname(backup._filename)}/${backup.vhds[vdiId]}`,
              name: vdi.name_label,
              uuid: vdi.uuid,
            }
          }),

    id: backup.id,
    isImmutable: backup.isImmutable,
    jobId: backup.jobId,
    mode: backup.mode,
    scheduleId: backup.scheduleId,
    size: backup.size,
    timestamp: backup.timestamp,
    vm: {
      uuid: backup.vm.uuid,
      name_description: backup.vm.name_description,
      name_label: backup.vm.name_label,
      tags: backup.vm.tags,
    },
    tags: backup.tags ?? [],
    differencingVhds,
    dynamicVhds,
    withMemory,
  }
}

// The single place which decides how a backup is identified.
//
// A backup is named by the path of its metadata, which reaches this module from several sources
// which don't agree on the leading slash: the on-repository cache and `writeVmBackupMetadata()`
// prepend it, the journal entries don't necessarily. Normalizing here, once, is what makes a
// backup keep the same id whether it was listed or replayed from the journal.
/**
 * @param {object} metadata as read back from the repository
 * @param {string} filename path of the backup metadata, normalized or not
 * @param {string} backupRepositoryId
 * @returns {object}
 */
export function formatVmBackupAt(metadata, filename, backupRepositoryId) {
  const normalized = normalize(filename)
  return formatVmBackup({ ...metadata, _filename: normalized, backupRepositoryId, id: normalized })
}

/**
 * format all backups as returned by RemoteAdapter#listAllVmBackups()
 * @param {Record<string, object[]>} backupsByVM
 * @param {string} backupRepositoryId
 * @returns {Record<string, object[]>}
 */
export function formatVmBackups(backupsByVM, backupRepositoryId) {
  return mapValues(backupsByVM, backups =>
    backups.map(backup => formatVmBackupAt(backup, backup._filename, backupRepositoryId))
  )
}

/**
 * Resolves the backups carried by journal events, so that a listing can be brought up to date from
 * the result alone.
 *
 * Events without metadata (`del`, and the event kinds this version does not know) are passed
 * through untouched: it is up to the caller to decide what to do with them.
 *
 * @param {ResolvedJournalEvent[]} events
 * @param {string} backupRepositoryId
 * @returns {FormattedJournalEvent[]}
 */
export function formatJournalEvents(events, backupRepositoryId) {
  return events.map(({ event, vmUuid, filename, metadata }) =>
    metadata === undefined
      ? { event, vmUuid, filename }
      : { event, vmUuid, filename, backup: formatVmBackupAt(metadata, filename, backupRepositoryId) }
  )
}
