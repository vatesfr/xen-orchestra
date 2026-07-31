import { Example, Extension, Get, Middlewares, Path, Query, Request, Response, Route, Security, Tags } from 'tsoa'
import { inject } from 'inversify'
import { provide } from 'inversify-binding-decorators'
import { Readable } from 'node:stream'
import {} from 'xo-common/api-errors.js'
import { type AnyPrivilege, hasPrivilegeOn } from '@xen-orchestra/acl'
import type { Request as ExRequest, Response as ExResponse } from 'express'
import type { XoBackupRepository, XoUser, XoVm, XoVmBackupArchive } from '@vates/types'

import {
  badRequestResp,
  forbiddenOperationResp,
  notFoundResp,
  unauthorizedResp,
  Unbrand,
  invalidParameters,
} from '../open-api/common/response.common.mjs'
import { XoController } from '../abstract-classes/xo-controller.mjs'
import { RestApi } from '../rest-api/rest-api.mjs'
import {
  backupArchive,
  backupArchiveIds,
  partialBackupArchives,
} from '../open-api/oa-examples/backup-archive.oa-example.mjs'
import { SendObjects, WithHref } from '../helpers/helper.type.mjs'
import { BackupArchiveService } from './backup-archive.service.mjs'
import { acl, autoBindService } from '../middlewares/acl.middleware.mjs'
import { makeNdJsonStream } from '../helpers/stream.helper.mjs'
import { makeObjectMapper } from '../helpers/object-wrapper.helper.mjs'
import { NDJSON_CONTENT_TYPE, safeParseComplexMatcher } from '../helpers/utils.helper.mjs'

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

  async #resolveBackupRepositoryIds(
    backupRepositories: (XoBackupRepository['id'] | '*')[]
  ): Promise<XoBackupRepository['id'][]> {
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

    return backupRepositoryIds
  }

  async getAllCollectionObjects({
    backupRepositories = [],
  }: { backupRepositories?: (XoBackupRepository['id'] | '*')[] } = {}): Promise<XoVmBackupArchive[]> {
    const backupRepositoryIds = await this.#resolveBackupRepositoryIds(backupRepositories)

    const backupArchivesByRemote = await this.restApi.xoApp.listVmBackupsNg(backupRepositoryIds)
    const vmBackupArchives = Object.values(backupArchivesByRemote)
      .filter(backupsByVm => backupsByVm !== undefined)
      .map(backupsByVm => Object.values(backupsByVm))
      .flat(2)

    return vmBackupArchives
  }

  // same as `getAllCollectionObjects` but yields each backup archive as soon as
  // its backup repository listing is available
  // the ids are resolved before the generator since resolution can fail
  // with `noSuchObject`, and a generator body would only run once the response
  // is already being streamed, turning that error into a truncated stream
  async #streamAllCollectionObjects(
    backupRepositories: (XoBackupRepository['id'] | '*')[]
  ): Promise<AsyncGenerator<XoVmBackupArchive>> {
    const backupRepositoryIds = await this.#resolveBackupRepositoryIds(backupRepositories)
    const xoApp = this.restApi.xoApp

    return (async function* () {
      for await (const [, backupsByVm] of xoApp.listVmBackupsNgIterator(backupRepositoryIds)) {
        if (backupsByVm === undefined) {
          continue
        }

        for (const vmBackupArchives of Object.values(backupsByVm)) {
          yield* vmBackupArchives
        }
      }
    })()
  }

  // streaming counterpart of `BaseController#sendObjects`: applies the same
  // privilege check, filter, limit and object mapping, but lazily
  async *#mapFilterLimit(
    archives: AsyncGenerator<XoVmBackupArchive>,
    req: ExRequest,
    {
      filter,
      limit = Infinity,
      user,
      userPrivileges,
    }: { filter?: string; limit?: number; user: XoUser; userPrivileges: AnyPrivilege[] }
  ): AsyncGenerator<string | WithHref<Partial<XoVmBackupArchive>> | WithHref<XoVmBackupArchive>> {
    const mapper = makeObjectMapper<XoVmBackupArchive>(req)
    const predicate = filter === undefined ? undefined : safeParseComplexMatcher(filter).createPredicate()

    for await (const archive of archives) {
      if (limit === 0) {
        return
      }

      if (
        !hasPrivilegeOn({ user, userPrivileges, objects: archive, action: 'read', resource: 'backup-archive' }) ||
        (predicate !== undefined && !predicate(archive))
      ) {
        continue
      }

      yield mapper(archive)
      limit--
    }
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
  @Response(invalidParameters.status, invalidParameters.description)
  async getBackupArchives(
    @Request() req: ExRequest,
    @Query('backup-repository') backupRepositories?: string[],
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() markdown?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): SendObjects<Partial<Unbrand<XoVmBackupArchive>>> {
    if (ndjson && markdown) {
      throw invalidParameters
    }
    if (ndjson) {
      // resolve everything that may fail before sending the response headers,
      // otherwise the error would only appear as a broken stream
      const archives = await this.#streamAllCollectionObjects(
        (backupRepositories ?? []) as (XoBackupRepository['id'] | '*')[]
      )
      const user = this.restApi.getCurrentUser()
      const userPrivileges = (
        user.permission !== 'admin' ? await this.restApi.xoApp.getAclV2UserPrivileges(user.id) : []
      ) as AnyPrivilege[]

      const res = req.res as ExResponse
      res.setHeader('Content-Type', NDJSON_CONTENT_TYPE)

      return Readable.from(
        makeNdJsonStream(
          this.#mapFilterLimit(archives, req, {
            filter,
            limit,
            user,
            userPrivileges,
          })
        )
      )
    }

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
}
