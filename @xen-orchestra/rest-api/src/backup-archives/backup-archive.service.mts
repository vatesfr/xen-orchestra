import { noSuchObject } from 'xo-common/api-errors.js'
import type { XoBackupDiskPartition, XoBackupRepository, XoVm, XoVmBackupArchive } from '@vates/types'

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

  #getRemoteId(archiveId: XoVmBackupArchive['id']): XoBackupRepository['id'] {
    const match = archiveId.match(BACKUP_ARCHIVE_ID_REGEX)
    if (match === null) {
      throw noSuchObject(archiveId, 'backup-archive')
    }
    return match[1] as XoBackupRepository['id']
  }

  listPartitions(archiveId: XoVmBackupArchive['id'], diskId: string): Promise<XoBackupDiskPartition[]> {
    return this.#restApi.xoApp.listBackupNgDiskPartitions(this.#getRemoteId(archiveId), diskId)
  }

  listFiles(
    archiveId: XoVmBackupArchive['id'],
    diskId: string,
    partitionId: string | undefined,
    path: string
  ): Promise<Record<string, { size?: number; mtime?: number }>> {
    return this.#restApi.xoApp.listBackupNgPartitionFiles(this.#getRemoteId(archiveId), diskId, partitionId, path)
  }

  fetchFiles(
    archiveId: XoVmBackupArchive['id'],
    diskId: string,
    partitionId: string | undefined,
    paths: string[],
    format: string
  ): Promise<NodeJS.ReadableStream> {
    return this.#restApi.xoApp.fetchBackupNgPartitionFiles(
      this.#getRemoteId(archiveId),
      diskId,
      partitionId,
      paths,
      format
    )
  }
}
