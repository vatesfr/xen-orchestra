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
import type { Readable } from 'node:stream'
import { type Request as ExRequest, type Response as ExResponse } from 'express'
import type { BackupDiskPartition, XoBackupRepository, XoVm, XoVmBackupArchive } from '@vates/types'

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
import { encodeDavSeg, encodePartitionSeg } from './backup-archive-dav.router.mjs'

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
   * Returns the list of disks in a backup archive.
   *
   * Required privilege:
   * - resource: backup-archive, action: read
   */
  @Extension('x-mcp-exposure', 'confirm')
  @Get('{id}/disks')
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
  async getBackupArchiveDisks(@Path() id: string): Promise<XoVmBackupArchive['disks']> {
    const archive = await this.getObject(id as XoVmBackupArchive['id'])
    return archive.disks
  }

  /**
   * Returns the list of partitions of a disk in a backup archive.
   * Returns an empty array for disks without a partition table (use the files endpoints directly).
   *
   * Required privilege:
   * - resource: backup-archive, action: read
   */
  @Extension('x-mcp-exposure', 'deny')
  @Get('{id}/disks/{diskId}/partitions')
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
  async getBackupArchiveDiskPartitions(@Path() id: string, @Path() diskId: string): Promise<BackupDiskPartition[]> {
    return this.#backupArchiveService.listPartitions(id as XoVmBackupArchive['id'], diskId)
  }

  /**
   * Returns the list of files at the given path inside a partition of a backup archive disk.
   *
   * Required privilege:
   * - resource: backup-archive, action: read
   *
   * @example path "/etc"
   */
  @Extension('x-mcp-exposure', 'deny')
  @Get('{id}/disks/{diskId}/partitions/{partitionId}/files')
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
   * Returns the list of files at the given path on a bare disk (no partition table) of a backup archive.
   *
   * Required privilege:
   * - resource: backup-archive, action: read
   *
   * @example path "/etc"
   */
  @Extension('x-mcp-exposure', 'deny')
  @Get('{id}/disks/{diskId}/files')
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

  /**
   * Returns the WebDAV URL path for a specific partition of a backup archive disk.
   * Mount this URL with any WebDAV client (rclone, davfs2, Finder, Windows Explorer) to browse
   * the partition content directly. Use the partition IDs from `GET …/partitions`.
   * For disks without a partition table use the special partition ID `_bare_`.
   *
   * Required privilege:
   * - resource: backup-archive, action: read
   *
   * @example partitionId "2"
   * @example partitionId "_bare_"
   */
  @Extension('x-mcp-exposure', 'confirm')
  @Get('{id}/disks/{diskId}/partitions/{partitionId}/webdav')
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
  getBackupArchivePartitionWebdavUrl(
    @Request() req: ExRequest,
    @Path() id: string,
    @Path() diskId: string,
    @Path() partitionId: string,
    @Query() addAuth: boolean = false
  ): { url: string } {
    // Encode segments with the exact scheme the DAV router decodes: base64url for the
    // slash-containing archive/disk ids, conditional base64url for the partition id.
    const path = `/rest/v0/backup-archives/${encodeDavSeg(id)}/dav/${encodeDavSeg(diskId)}/${encodePartitionSeg(partitionId)}/`

    // Resolve protocol and host, respecting reverse-proxy headers
    const proto = (req.headers['x-forwarded-proto'] as string | undefined) ?? req.protocol ?? 'http'
    const host = (req.headers['x-forwarded-host'] as string | undefined) ?? (req.headers.host as string) ?? 'localhost'

    let auth = ''
    if (addAuth) {
      const { cookies } = req as ExRequest & { cookies: Record<string, string> }
      const cookieToken = cookies.authenticationToken ?? cookies.token
      if (cookieToken !== undefined) {
        // Token auth: embed as ":token@host" — WebDAV clients send it as Basic with empty username
        auth = `:${encodeURIComponent(cookieToken)}@`
      } else {
        const authorization = req.headers.authorization
        if (authorization !== undefined) {
          const encoded = authorization.split(' ')[1]
          if (encoded !== undefined) {
            const decoded = Buffer.from(encoded, 'base64').toString()
            const colonIdx = decoded.indexOf(':')
            const username = decoded.slice(0, colonIdx)
            const password = decoded.slice(colonIdx + 1)
            if (username === '') {
              // Already a token embedded as ":token" — re-embed as-is
              auth = `:${encodeURIComponent(password)}@`
            } else {
              auth = `${encodeURIComponent(username)}:${encodeURIComponent(password)}@`
            }
          }
        }
      }
    }

    return { url: `${proto}://${auth}${host}${path}` }
  }

  /**
   * Downloads the selected files from a partition of a backup archive disk as a tgz or zip archive.
   *
   * Required privilege:
   * - resource: backup-archive, action: read
   *
   * @example paths ["/etc/passwd", "/etc/hosts"]
   */
  @Extension('x-mcp-exposure', 'deny')
  @Get('{id}/disks/{diskId}/partitions/{partitionId}/files.{format}')
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
    res.setHeader('content-type', 'application/octet-stream')
    res.setHeader('content-disposition', 'attachment')
    const stream = await this.#backupArchiveService.fetchFiles(
      id as XoVmBackupArchive['id'],
      diskId,
      partitionId,
      paths,
      format
    )
    req.on('close', () => (stream as NodeJS.ReadableStream & { destroy?: () => void }).destroy?.())
    await pipeline(stream as unknown as Readable, res)
  }

  /**
   * Downloads the selected files from a bare disk (no partition table) of a backup archive as a tgz or zip archive.
   *
   * Required privilege:
   * - resource: backup-archive, action: read
   *
   * @example paths ["/etc/passwd"]
   */
  @Extension('x-mcp-exposure', 'deny')
  @Get('{id}/disks/{diskId}/files.{format}')
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
  @SuccessResponse(200, 'Download started', 'application/octet-stream')
  async downloadBackupArchiveDiskFiles(
    @Request() req: ExRequest,
    @Path() id: string,
    @Path() diskId: string,
    @Path() format: 'tgz' | 'zip',
    @Query() paths: string[]
  ): Promise<void> {
    const res = req.res as ExResponse
    res.setHeader('content-type', 'application/octet-stream')
    res.setHeader('content-disposition', 'attachment')
    const stream = await this.#backupArchiveService.fetchFiles(
      id as XoVmBackupArchive['id'],
      diskId,
      undefined,
      paths,
      format
    )
    req.on('close', () => (stream as NodeJS.ReadableStream & { destroy?: () => void }).destroy?.())
    await pipeline(stream as unknown as Readable, res)
  }
}
