import {
  Example,
  Extension,
  Get,
  Middlewares,
  Path,
  Query,
  Request,
  Response,
  Route,
  Security,
  SuccessResponse,
  Tags,
} from 'tsoa'
import { inject } from 'inversify'
import { provide } from 'inversify-binding-decorators'
import { pipeline } from 'node:stream/promises'
import { type Request as ExRequest, type Response as ExResponse } from 'express'
import type { XoBackupDiskPartition, XoBackupRepository, XoVmBackupArchive } from '@vates/types'

import {
  badRequestResp,
  forbiddenOperationResp,
  notFoundResp,
  unauthorizedResp,
  Unbrand,
} from '../open-api/common/response.common.mjs'
import { XoController } from '../abstract-classes/xo-controller.mjs'
import { RestApi } from '../rest-api/rest-api.mjs'
import {
  backupArchive,
  backupArchiveIds,
  partialBackupArchives,
} from '../open-api/oa-examples/backup-archive.oa-example.mjs'
import { SendObjects } from '../helpers/helper.type.mjs'
import { BackupArchiveService } from './backup-archive.service.mjs'
import { acl, autoBindService } from '../middlewares/acl.middleware.mjs'

// MIME type of the archive streamed by the file-download routes, by requested format.
const DOWNLOAD_CONTENT_TYPES = {
  tgz: 'application/gzip',
  zip: 'application/zip',
} as const

@Route('backup-archives')
@Security('*')
@Response(badRequestResp.status, badRequestResp.description)
@Response(unauthorizedResp.status, unauthorizedResp.description)
@Tags('backup-archives')
@provide(BackupArchiveController)
export class BackupArchiveController extends XoController<XoVmBackupArchive> {
  #backupArchiveService: BackupArchiveService

  constructor(
    @inject(RestApi) restApi: RestApi,
    @inject(BackupArchiveService) backupArchiveService: BackupArchiveService
  ) {
    super('backup-archive', restApi)
    this.#backupArchiveService = backupArchiveService
  }

  async getAllCollectionObjects({
    backupRepositories = [],
  }: { backupRepositories?: (XoBackupRepository['id'] | '*')[] } = {}): Promise<XoVmBackupArchive[]> {
    const backupRepositoryIds: XoBackupRepository['id'][] = []

    if (backupRepositories.includes('*')) {
      const allBackupRepositories = await this.restApi.xoApp.getAllRemotes()
      allBackupRepositories.forEach(br => backupRepositoryIds.push(br.id))
    } else {
      for (const brId of backupRepositories) {
        const br = await this.restApi.xoApp.getRemote(brId as XoBackupRepository['id'])
        backupRepositoryIds.push(br.id)
      }
    }

    const backupArchivesByRemote = await this.restApi.xoApp.listVmBackupsNg(backupRepositoryIds)
    const vmBackupArchives = Object.values(backupArchivesByRemote)
      .filter(backupsByVm => backupsByVm !== undefined)
      .map(backupsByVm => Object.values(backupsByVm))
      .flat(2)

    return vmBackupArchives
  }

  getCollectionObject(id: XoVmBackupArchive['id']): Promise<XoVmBackupArchive> {
    return this.#backupArchiveService.getBackupArchive(id)
  }

  /**
   * Returns all backup archives that match the following privilege:
   * - resource: backup-archive, action: read
   *
   * You can use the alias "*" in "backup-repository" to select all backup repositories.
   *
   * @example backupRepositories ["c4284e12-37c9-7967-b9e8-83ef229c3e03", "1af95910-01b4-4e87-9c2f-d895cafe0776"]
   * @example fields "id,backupRepository,disks"
   * @example filter "disks:length:>0"
   * @example limit 42
   */
  @Example(backupArchiveIds)
  @Example(partialBackupArchives)
  @Extension('x-mcp-exposure', 'allow')
  @Get('')
  @Security('*', ['acl'])
  @Response(notFoundResp.status, notFoundResp.description)
  async getBackupArchives(
    @Request() req: ExRequest,
    @Query('backup-repository') backupRepositories?: string[],
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() markdown?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): SendObjects<Partial<Unbrand<XoVmBackupArchive>>> {
    const backupArchives = await this.getObjects({ backupRepositories, filter })
    return this.sendObjects(Object.values(backupArchives), req, {
      limit,
      privilege: { action: 'read', resource: 'backup-archive' },
    })
  }

  /**
   * Required privilege:
   * - resource: backup-archive, action: read
   *
   * @example id "231264c3-af43-4ec0-a3be-394c5b1fdbfc/xo-vm-backups/6ef7c09e-677b-1e6f-0546-7ab30413c61c/20250801T080832Z.json"
   */
  @Example(backupArchive)
  @Extension('x-mcp-exposure', 'allow')
  @Get('{id}')
  @Middlewares(
    acl({
      resource: 'backup-archive',
      action: 'read',
      objectId: 'params.id',
      getObject: autoBindService(BackupArchiveService, 'getBackupArchive'),
    })
  )
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  async getBackupArchive(@Path() id: string): Promise<Unbrand<XoVmBackupArchive>> {
    const backupArchive = await this.getObject(id as XoVmBackupArchive['id'])
    return backupArchive
  }

  /**
   * Returns the list of partitions of a disk in a backup archive.
   * Returns an empty array for disks without a partition table (use the files endpoints directly).
   *
   * Required privilege:
   * - resource: backup-archive, action: mount
   *
   * @example id "231264c3-af43-4ec0-a3be-394c5b1fdbfc/xo-vm-backups/6ef7c09e-677b-1e6f-0546-7ab30413c61c/20250801T080832Z.json"
   * @example diskId "/xo-vm-backups/6ef7c09e-677b-1e6f-0546-7ab30413c61c/vdis/8b650248-ddd6-4188-ad8b-c0502865ac6c/f1f3c902-dcaa-4ec6-943e-6162c9d85fb2/20250801T080832Z.vhd"
   */
  @Extension('x-mcp-exposure', 'deny')
  @Get('{id}/disks/{diskId}/partitions')
  @Middlewares(
    acl({
      resource: 'backup-archive',
      action: 'mount',
      objectId: 'params.id',
      getObject: autoBindService(BackupArchiveService, 'getBackupArchive'),
    })
  )
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  async getBackupArchiveDiskPartitions(@Path() id: string, @Path() diskId: string): Promise<XoBackupDiskPartition[]> {
    return this.#backupArchiveService.listPartitions(id as XoVmBackupArchive['id'], diskId)
  }

  // tsoa route-collision check (checkForPathParamSignatureDuplicates) is declaration-order
  // sensitive: a `…/files.{format}` route declared AFTER the plain `…/files` route is wrongly
  // flagged as overlapping (it does a startsWith, not an equality, on the last segment). So each
  // `.{format}` download route MUST stay declared before its plain listing sibling. Do not reorder.

  /**
   * Downloads the selected files from a partition of a backup archive disk as a tgz or zip archive.
   *
   * Required privilege:
   * - resource: backup-archive, action: mount
   *
   * @example id "231264c3-af43-4ec0-a3be-394c5b1fdbfc/xo-vm-backups/6ef7c09e-677b-1e6f-0546-7ab30413c61c/20250801T080832Z.json"
   * @example diskId "/xo-vm-backups/6ef7c09e-677b-1e6f-0546-7ab30413c61c/vdis/8b650248-ddd6-4188-ad8b-c0502865ac6c/f1f3c902-dcaa-4ec6-943e-6162c9d85fb2/20250801T080832Z.vhd"
   * @example partitionId "6c2d1b4a-0f3e-4c8d-9a1b-2e5f7c9d0a3b"
   * @example format "tgz"
   * @example paths ["/etc/passwd", "/etc/hosts"]
   */
  @Extension('x-mcp-exposure', 'deny')
  @Get('{id}/disks/{diskId}/partitions/{partitionId}/files.{format}')
  @Middlewares(
    acl([
      {
        resource: 'backup-archive',
        action: 'mount',
        objectId: 'params.id',
        getObject: autoBindService(BackupArchiveService, 'getBackupArchive'),
      },
      {
        resource: 'backup-archive',
        action: 'read',
        objectId: 'params.id',
        getObject: autoBindService(BackupArchiveService, 'getBackupArchive'),
      },
    ])
  )
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  @SuccessResponse(200, 'Download started', 'application/octet-stream')
  async downloadBackupArchivePartitionFiles(
    @Request() req: ExRequest,
    @Path() id: string,
    @Path() diskId: string,
    @Path() partitionId: string,
    @Path() format: 'tgz' | 'zip',
    @Query() paths: string[]
  ): Promise<void> {
    const res = req.res as ExResponse
    const { stream, filename } = await this.#backupArchiveService.fetchFiles({
      archiveId: id as XoVmBackupArchive['id'],
      diskId,
      partitionId,
      paths,
      format,
    })
    res.setHeader('content-type', DOWNLOAD_CONTENT_TYPES[format])
    res.setHeader('content-disposition', `attachment; filename="${filename}"`)
    req.on('close', () => stream.destroy())
    await pipeline(stream, res)
  }

  /**
   * Returns the list of files at the given path inside a partition of a backup archive disk.
   *
   * Required privilege:
   * - resource: backup-archive, action: mount
   *
   * @example id "231264c3-af43-4ec0-a3be-394c5b1fdbfc/xo-vm-backups/6ef7c09e-677b-1e6f-0546-7ab30413c61c/20250801T080832Z.json"
   * @example diskId "/xo-vm-backups/6ef7c09e-677b-1e6f-0546-7ab30413c61c/vdis/8b650248-ddd6-4188-ad8b-c0502865ac6c/f1f3c902-dcaa-4ec6-943e-6162c9d85fb2/20250801T080832Z.vhd"
   * @example partitionId "6c2d1b4a-0f3e-4c8d-9a1b-2e5f7c9d0a3b"
   * @example path "/etc"
   */
  @Extension('x-mcp-exposure', 'deny')
  @Get('{id}/disks/{diskId}/partitions/{partitionId}/files')
  @Middlewares(
    acl([
      {
        resource: 'backup-archive',
        action: 'mount',
        objectId: 'params.id',
        getObject: autoBindService(BackupArchiveService, 'getBackupArchive'),
      },
      {
        resource: 'backup-archive',
        action: 'read',
        objectId: 'params.id',
        getObject: autoBindService(BackupArchiveService, 'getBackupArchive'),
      },
    ])
  )
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  async getBackupArchivePartitionFiles(
    @Path() id: string,
    @Path() diskId: string,
    @Path() partitionId: string,
    @Query() path?: string
  ): Promise<{ name: string; isFile: boolean; size?: number }[]> {
    const rawFiles = await this.#backupArchiveService.listFiles(
      id as XoVmBackupArchive['id'],
      diskId,
      partitionId,
      path ?? '/'
    )
    return Object.entries(rawFiles).map(([name, info]) => ({
      name,
      isFile: !name.endsWith('/'),
      size: info?.size,
    }))
  }

  /**
   * Downloads the selected files from a bare disk (no partition table) of a backup archive as a tgz or zip archive.
   *
   * Required privilege:
   * - resource: backup-archive, action: mount
   *
   * @example id "231264c3-af43-4ec0-a3be-394c5b1fdbfc/xo-vm-backups/6ef7c09e-677b-1e6f-0546-7ab30413c61c/20250801T080832Z.json"
   * @example diskId "/xo-vm-backups/6ef7c09e-677b-1e6f-0546-7ab30413c61c/vdis/8b650248-ddd6-4188-ad8b-c0502865ac6c/f1f3c902-dcaa-4ec6-943e-6162c9d85fb2/20250801T080832Z.vhd"
   * @example format "tgz"
   * @example paths ["/etc/passwd"]
   */
  @Extension('x-mcp-exposure', 'deny')
  @Get('{id}/disks/{diskId}/files.{format}')
  @Middlewares(
    acl([
      {
        resource: 'backup-archive',
        action: 'export',
        objectId: 'params.id',
        getObject: autoBindService(BackupArchiveService, 'getBackupArchive'),
      },
      {
        resource: 'backup-archive',
        action: 'mount',
        objectId: 'params.id',
        getObject: autoBindService(BackupArchiveService, 'getBackupArchive'),
      },
      {
        resource: 'backup-archive',
        action: 'read',
        objectId: 'params.id',
        getObject: autoBindService(BackupArchiveService, 'getBackupArchive'),
      },
    ])
  )
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  @SuccessResponse(200, 'Download started', 'application/octet-stream')
  async downloadBackupArchiveDiskFiles(
    @Request() req: ExRequest,
    @Path() id: string,
    @Path() diskId: string,
    @Path() format: 'tgz' | 'zip',
    @Query() paths: string[]
  ): Promise<void> {
    const res = req.res as ExResponse
    const { stream, filename } = await this.#backupArchiveService.fetchFiles({
      archiveId: id as XoVmBackupArchive['id'],
      diskId,
      paths,
      format,
    })
    res.setHeader('content-type', DOWNLOAD_CONTENT_TYPES[format])
    res.setHeader('content-disposition', `attachment; filename="${filename}"`)
    req.on('close', () => stream.destroy())
    await pipeline(stream, res)
  }

  /**
   * Returns the list of files at the given path on a bare disk (no partition table) of a backup archive.
   *
   * Required privilege:
   * - resource: backup-archive, action: mount
   *
   * @example id "231264c3-af43-4ec0-a3be-394c5b1fdbfc/xo-vm-backups/6ef7c09e-677b-1e6f-0546-7ab30413c61c/20250801T080832Z.json"
   * @example diskId "/xo-vm-backups/6ef7c09e-677b-1e6f-0546-7ab30413c61c/vdis/8b650248-ddd6-4188-ad8b-c0502865ac6c/f1f3c902-dcaa-4ec6-943e-6162c9d85fb2/20250801T080832Z.vhd"
   * @example path "/etc"
   */
  @Extension('x-mcp-exposure', 'deny')
  @Get('{id}/disks/{diskId}/files')
  @Middlewares(
    acl({
      resource: 'backup-archive',
      action: 'mount',
      objectId: 'params.id',
      getObject: autoBindService(BackupArchiveService, 'getBackupArchive'),
    })
  )
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  async getBackupArchiveDiskFiles(
    @Path() id: string,
    @Path() diskId: string,
    @Query() path?: string
  ): Promise<{ name: string; isFile: boolean; size?: number }[]> {
    const rawFiles = await this.#backupArchiveService.listFiles(
      id as XoVmBackupArchive['id'],
      diskId,
      undefined,
      path ?? '/'
    )
    return Object.entries(rawFiles).map(([name, info]) => ({
      name,
      isFile: !name.endsWith('/'),
      size: info?.size,
    }))
  }
}
