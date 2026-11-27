import { noSuchObject } from 'xo-common/api-errors.js'
import type { Readable } from 'node:stream'
import type {
  AnyXoBackupArchive,
  XoApp,
  XoBackupDiskPartition,
  XoBackupRepository,
  XoConfigBackupArchive,
  XoPool,
  XoPoolBackupArchive,
  XoVm,
  XoVmBackupArchive,
} from '@vates/types'

import type { RestApi } from '../rest-api/rest-api.mjs'

export const BACKUP_ARCHIVE_TYPES = ['xo-vm-backup', 'xo-config-backup', 'xo-pool-metadata-backup'] as const
export type BackupArchiveType = AnyXoBackupArchive['type']

// BR uuid/xo-vm-backups/VM uuid/(ISO 8601 compact).json
const BACKUP_ARCHIVE_ID_REGEX = /^([0-9a-fA-F-]{36})\/+xo-vm-backups\/+([0-9a-fA-F-]{36})\/+(\d{8}T\d{6}Z)\.json$/
// BR uuid/xo-config-backups/schedule uuid/(ISO 8601 compact)
const CONFIG_BACKUP_ARCHIVE_ID_REGEX = /^([0-9a-fA-F-]{36})\/+xo-config-backups\/+([0-9a-fA-F-]{36})\/+(\d{8}T\d{6}Z)$/
// BR uuid/xo-pool-metadata-backups/schedule uuid/pool uuid/(ISO 8601 compact)
const POOL_BACKUP_ARCHIVE_ID_REGEX =
  /^([0-9a-fA-F-]{36})\/+xo-pool-metadata-backups\/+([0-9a-fA-F-]{36})\/+([0-9a-fA-F-]{36})\/+(\d{8}T\d{6}Z)$/

// Fold a free-form label (VM/disk/partition name) into a portion safe for both a filesystem
// name and an HTTP Content-Disposition header: diacritics are stripped to ASCII and every
// other unsafe character is collapsed to "_". An empty result means "nothing usable".
const slugify = (value: string): string =>
  value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // strip combining diacritics
    .replace(/[^\w.-]+/g, '_')
    .replace(/^[_.]+|[_.]+$/g, '')

// Build a human-friendly download name from the backup labels, e.g.
// "my-vm_data-disk_root_2026-06-26.tgz". Falls back to a generic name when no label is usable.
const buildDownloadFilename = ({
  archive,
  disk,
  partition,
  format,
}: {
  readonly archive: XoVmBackupArchive
  readonly disk: XoVmBackupArchive['disks'][number]
  readonly partition?: XoBackupDiskPartition
  readonly format: string
}): string => {
  const date = new Date(archive.timestamp).toISOString().slice(0, 10) // YYYY-MM-DD
  const parts = [archive.vm.name_label, disk.name, partition?.name, date]
    .map(part => (part === undefined ? '' : slugify(part)))
    .filter(part => part !== '')
  const base = parts.length > 0 ? parts.join('_') : 'backup-archive'
  return `${base}.${format}`
}

export class BackupArchiveService {
  #restApi: RestApi

  constructor(restApi: RestApi) {
    this.#restApi = restApi
  }

  /**
   * Lists the archives of the given types stored on the given backup repositories.
   * A backup repository that cannot be read is skipped (see `listVmBackupsNg` and `listMetadataBackups`).
   */
  async listBackupArchives(
    backupRepositoryIds: XoBackupRepository['id'][],
    types: readonly BackupArchiveType[] = BACKUP_ARCHIVE_TYPES
  ): Promise<AnyXoBackupArchive[]> {
    const wantVm = types.includes('xo-vm-backup')
    const wantConfig = types.includes('xo-config-backup')
    const wantPool = types.includes('xo-pool-metadata-backup')

    const [vmBackupsByBr, metadataBackups] = await Promise.all([
      wantVm ? this.#restApi.xoApp.listVmBackupsNg(backupRepositoryIds) : undefined,
      wantConfig || wantPool ? this.#restApi.xoApp.listMetadataBackups(backupRepositoryIds) : undefined,
    ])

    const archives: AnyXoBackupArchive[] = []
    if (vmBackupsByBr !== undefined) {
      for (const backupsByVm of Object.values(vmBackupsByBr)) {
        if (backupsByVm !== null) {
          archives.push(...Object.values(backupsByVm).flat())
        }
      }
    }
    if (metadataBackups !== undefined) {
      if (wantConfig) {
        archives.push(...Object.values(metadataBackups.xo).flat())
      }
      if (wantPool) {
        for (const backupsByPool of Object.values(metadataBackups.pool)) {
          archives.push(...Object.values(backupsByPool).flat())
        }
      }
    }

    return archives
  }

  /**
   * Returns a backup archive of any type (VM, XO config or pool metadata).
   */
  async getBackupArchive(id: AnyXoBackupArchive['id']): Promise<AnyXoBackupArchive> {
    let match = id.match(BACKUP_ARCHIVE_ID_REGEX)
    if (match !== null) {
      return this.getVmBackupArchive(id as XoVmBackupArchive['id'])
    }

    match = id.match(CONFIG_BACKUP_ARCHIVE_ID_REGEX)
    if (match !== null) {
      const brId = match[1] as XoBackupRepository['id']
      const { xo } = await this.#restApi.xoApp.listMetadataBackups([brId])
      return this.#findArchive<XoConfigBackupArchive>(xo[brId], id)
    }

    match = id.match(POOL_BACKUP_ARCHIVE_ID_REGEX)
    if (match !== null) {
      const brId = match[1] as XoBackupRepository['id']
      const poolId = match[3] as XoPool['id']
      const { pool } = await this.#restApi.xoApp.listMetadataBackups([brId])
      return this.#findArchive<XoPoolBackupArchive>(pool[brId]?.[poolId], id)
    }

    throw noSuchObject(id, 'backup-archive')
  }

  /**
   * Returns a VM backup archive, the only type that has disks (needed by the mount/files routes).
   */
  async getVmBackupArchive(id: XoVmBackupArchive['id']): Promise<XoVmBackupArchive> {
    const match = id.match(BACKUP_ARCHIVE_ID_REGEX)
    if (match === null) {
      throw noSuchObject(id, 'backup-archive')
    }

    const [, brId, vmId] = match as [XoVmBackupArchive['id'], XoBackupRepository['id'], XoVm['id'], string]

    const backupArchives = (await this.#restApi.xoApp.listVmBackupsNg([brId]))[brId]?.[vmId]
    return this.#findArchive(backupArchives ?? undefined, id)
  }

  #findArchive<T extends AnyXoBackupArchive>(archives: T[] | undefined, id: string): T {
    const archive = archives?.find(archive => archive.id === id)
    if (archive === undefined) {
      throw noSuchObject(id, 'backup-archive')
    }
    return archive
  }

  #getBackupRepositoryId(archiveId: XoVmBackupArchive['id']): XoBackupRepository['id'] {
    const match = archiveId.match(BACKUP_ARCHIVE_ID_REGEX)
    if (match === null) {
      throw noSuchObject(archiveId, 'backup-archive')
    }
    return match[1] as XoBackupRepository['id']
  }

  async listPartitions(archiveId: XoVmBackupArchive['id'], diskId: string): Promise<XoBackupDiskPartition[]> {
    const archive = await this.getVmBackupArchive(archiveId)
    // archive.disks is an array of { id, name, uuid } (see formatVmBackups), so look up by id
    if (archive.disks.find(disk => disk.id === diskId) === undefined) {
      throw noSuchObject(diskId, 'backup-archive-disk')
    }
    return this.#restApi.xoApp.listBackupNgDiskPartitions(this.#getBackupRepositoryId(archiveId), diskId)
  }

  async listFiles(
    archiveId: XoVmBackupArchive['id'],
    diskId: string,
    partitionId: string | undefined,
    path: string
  ): ReturnType<XoApp['listBackupNgPartitionFiles']> {
    const partitions = await this.listPartitions(archiveId, diskId)
    // partitionId is undefined for bare disks (no partition table); only validate when requested
    if (partitionId !== undefined && !partitions.find(partition => partition.id === partitionId)) {
      throw noSuchObject(partitionId, 'backup-archive-disk-partition')
    }
    return this.#restApi.xoApp.listBackupNgPartitionFiles(
      this.#getBackupRepositoryId(archiveId),
      diskId,
      partitionId,
      path
    )
  }

  async fetchFiles({
    archiveId,
    diskId,
    partitionId,
    paths,
    format,
  }: {
    readonly archiveId: XoVmBackupArchive['id']
    readonly diskId: string
    readonly partitionId?: string
    readonly paths: string[]
    readonly format: 'tgz' | 'zip'
  }): Promise<{ stream: Readable; filename: string }> {
    const archive = await this.getVmBackupArchive(archiveId)

    const disk = archive.disks.find(disk => disk.id === diskId)
    if (disk === undefined) {
      throw noSuchObject(diskId, 'backup-archive-disk')
    }

    const backupRepositoryId = this.#getBackupRepositoryId(archiveId)

    // partitionId is undefined for bare disks (no partition table); only resolve and validate a
    // partition when the caller actually requested one.
    let partition: XoBackupDiskPartition | undefined
    if (partitionId !== undefined) {
      const partitions = await this.#restApi.xoApp.listBackupNgDiskPartitions(backupRepositoryId, diskId)
      partition = partitions.find(partition => partition.id === partitionId)
      if (partition === undefined) {
        throw noSuchObject(partitionId, 'backup-archive-disk-partition')
      }
    }

    const stream = await this.#restApi.xoApp.fetchBackupNgPartitionFiles(
      backupRepositoryId,
      diskId,
      partitionId,
      paths,
      format
    )

    return { stream, filename: buildDownloadFilename({ archive, disk, partition, format }) }
  }
}
