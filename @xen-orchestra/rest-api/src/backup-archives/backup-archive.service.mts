import { noSuchObject } from 'xo-common/api-errors.js'
import type { Readable } from 'node:stream'
import type { XoApp, XoBackupDiskPartition, XoBackupRepository, XoVm, XoVmBackupArchive } from '@vates/types'

import type { RestApi } from '../rest-api/rest-api.mjs'

// BR uuid/xo-vm-backups/VM uuid/(ISO 8601 compact).json
const BACKUP_ARCHIVE_ID_REGEX = /^([0-9a-fA-F-]{36})\/+xo-vm-backups\/+([0-9a-fA-F-]{36})\/+(\d{8}T\d{6}Z)\.json$/

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

  async getBackupArchive(id: XoVmBackupArchive['id']): Promise<XoVmBackupArchive> {
    const match = id.match(BACKUP_ARCHIVE_ID_REGEX)
    if (match === null) {
      throw noSuchObject(id, 'backup-archive')
    }

    const [, brId, vmId] = match as [XoVmBackupArchive['id'], XoBackupRepository['id'], XoVm['id'], string]

    const backupArchive = (await this.#restApi.xoApp.listVmBackupsNg([brId]))[brId]?.[vmId]?.find(ba => ba.id === id)
    if (backupArchive === undefined) {
      throw noSuchObject(id, 'backup-archive')
    }

    return backupArchive
  }

  #getBackupRepositoryId(archiveId: XoVmBackupArchive['id']): XoBackupRepository['id'] {
    const match = archiveId.match(BACKUP_ARCHIVE_ID_REGEX)
    if (match === null) {
      throw noSuchObject(archiveId, 'backup-archive')
    }
    return match[1] as XoBackupRepository['id']
  }

  async listPartitions(archiveId: XoVmBackupArchive['id'], diskId: string): Promise<XoBackupDiskPartition[]> {
    const archive = await this.getBackupArchive(archiveId)
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
    const archive = await this.getBackupArchive(archiveId)

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
