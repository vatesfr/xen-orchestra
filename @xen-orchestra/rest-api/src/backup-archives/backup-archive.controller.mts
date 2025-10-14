import { Get, Path, Query, Request, Response, Route, Security, Tags } from 'tsoa'
import type { Request as ExRequest } from 'express'
import { XoController } from '../abstract-classes/xo-controller.mjs'
import { unauthorizedResp } from '../open-api/common/response.common.mjs'
import { provide } from 'inversify-binding-decorators'
import { AnyXoBackupArchive, XoBackupRepository } from '@vates/types'

@Route('backup-archives')
@Security('*')
@Response(unauthorizedResp.status, unauthorizedResp.description)
@Tags('backup-archives')
@provide(BackupArchiveController)
export class BackupArchiveController extends XoController<AnyXoBackupArchive> {
  async getAllCollectionObjects({
    backupRepositories = [],
  }: { backupRepositories?: (XoBackupRepository['id'] | '*')[] } = {}): Promise<AnyXoBackupArchive[]> {
    let backupRepositoryIds: XoBackupRepository['id'][]
    if (backupRepositories.includes('*')) {
      backupRepositoryIds = (await this.restApi.xoApp.getAllRemotes()).map(br => br.id)
    } else {
      backupRepositoryIds = backupRepositories as XoBackupRepository['id'][]
    }

    const backupArchivesByRemote = await this.restApi.xoApp.listVmBackupsNg(backupRepositoryIds)

    // const [vmBackupArchivesByRemote, metadataBackupArchivesByRemote] = await Promise.all([
    //   this.restApi.xoApp.listVmBackupsNg(backupRepositoryIds),
    //   this.restApi.xoApp.listMetadataBackups(backupRepositoryIds),
    // ])
    const vmBackupArchives = Object.values(backupArchivesByRemote)
      .map(backupsByVm => Object.values(backupsByVm))
      .flat(2)
    // const xoBackupArchives = Object.values(metadataBackupArchivesByRemote.xo).flat(2)
    // const poolBackupArchives = Object.values(metadataBackupArchivesByRemote.pool)
    //   .map(backupsByPool => Object.values(backupsByPool))
    //   .flat(2)

    return vmBackupArchives
  }

  async getCollectionObject(id: AnyXoBackupArchive['id']): Promise<AnyXoBackupArchive> {
    throw new Error('not implemented')
    // const backupArchives = await this.getAllCollectionObjects()
    // const backupArchive = backupArchives.find(archive => archive.id === id)
    // if (backupArchive === undefined) {
    //   throw noSuchObject(id, 'backup-archive')
    // }

    // return backupArchive
  }

  /**
   * @example id "722d17b9-699b-49d2-8193-be1ac573d3de"
   * @example fields "id,backupRepository, disks"
   * @example filter "disks:length:>0"
   * @example limit 42
   */
  @Get('')
  async getBackupArchives(
    @Request() req: ExRequest,
    @Query('backup-repository') backupRepositories?: string[],
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ) {
    const backupArchives = await this.getObjects({ backupRepositories, filter, limit })
    return this.sendObjects(Object.values(backupArchives), req)
  }
}
