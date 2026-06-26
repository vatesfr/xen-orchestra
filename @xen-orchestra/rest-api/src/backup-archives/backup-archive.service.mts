import { noSuchObject } from 'xo-common/api-errors.js'
import type { XoApp, XoBackupDiskPartition, XoBackupRepository, XoVm, XoVmBackupArchive } from '@vates/types'

import type { RestApi } from '../rest-api/rest-api.mjs'

// BR uuid/xo-vm-backups/VM uuid/(ISO 8601 compact).json
const BACKUP_ARCHIVE_ID_REGEX = /^([0-9a-fA-F-]{36})\/+xo-vm-backups\/+([0-9a-fA-F-]{36})\/+(\d{8}T\d{6}Z)\.json$/

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
    if (archive.disks[diskId] === undefined) {
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
    if (!partitions.find(partition => partition.id === partitionId)) {
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
  }): Promise<NodeJS.ReadableStream> {
    const partitions = await this.listPartitions(archiveId, diskId)
    if (!partitions.find(partition => partition.id === partitionId)) {
      throw noSuchObject(partitionId, 'backup-archive-disk-partition')
    }
    return this.#restApi.xoApp.fetchBackupNgPartitionFiles(
      this.#getBackupRepositoryId(archiveId),
      diskId,
      partitionId,
      paths,
      format
    )
  }
}
