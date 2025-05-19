import { asyncEach } from '@vates/async-each'
import { createLogger } from '@xen-orchestra/log'
import { parse } from 'xo-remote-parser'

import { getFromAsyncCache } from '../helpers/cache.helper.mjs'
import { RestApi } from '../rest-api/rest-api.mjs'
import { DashboardBackupRepositoriesSizeInfo, XoaDashboard } from './xoa.type.mjs'
import { MaybePromise } from '../helpers/helper.type.mjs'
import { AnyXoVdi, AnyXoVm, XoHost, XoPool, XoSr, XoVbd } from '@vates/types'
import semver from 'semver'
import { isReplicaVm, isSrWritable } from '../helpers/utils.helper.mjs'
import { noSuchObject } from 'xo-common/api-errors.js'

const log = createLogger('xo:rest-api:xoa-service')

export class XoaService {
  #restApi: RestApi
  #dashboardAsyncCache = new Map<
    string,
    {
      current: MaybePromise<DashboardBackupRepositoriesSizeInfo>
      expires?: number
      previous?: MaybePromise<DashboardBackupRepositoriesSizeInfo>
    }
  >()
  #dashboardCacheOpts: { timeout?: number; expiresIn?: number }

  constructor(restApi: RestApi) {
    this.#restApi = restApi
    this.#dashboardCacheOpts = {
      timeout: this.#restApi.xoApp.config.getOptionalDuration('rest-api.dashboardCacheTimeout'),
      expiresIn: this.#restApi.xoApp.config.getOptionalDuration('rest-api.dashboardCacheExpiresIn'),
    }
  }

  async #getBackupRepositoriesSizeInfo(): Promise<
    (DashboardBackupRepositoriesSizeInfo & { isExpired?: true }) | undefined
  > {
    const brResult = await getFromAsyncCache<DashboardBackupRepositoriesSizeInfo>(
      this.#dashboardAsyncCache,
      'backupRepositories',
      async () => {
        const xoApp = this.#restApi.xoApp

        const s3Brsize: DashboardBackupRepositoriesSizeInfo['s3']['size'] = { backups: 0 }
        const otherBrSize: DashboardBackupRepositoriesSizeInfo['other']['size'] = {
          available: 0,
          backups: 0,
          other: 0,
          total: 0,
          used: 0,
        }

        const backupRepositories = await xoApp.getAllRemotes()
        const backupRepositoriesInfo = await xoApp.getAllRemotesInfo()
        for (const backupRepository of backupRepositories) {
          const { type } = parse(backupRepository.url)
          const backupRepositoryInfo = backupRepositoriesInfo[backupRepository.id]

          if (!backupRepository.enabled || backupRepositoryInfo === undefined) {
            continue
          }

          const totalBackupSize = await xoApp.getTotalBackupSizeOnRemote(backupRepository.id)

          const { available, size, used } = backupRepositoryInfo

          const isS3 = type === 's3'
          const target = isS3 ? s3Brsize : otherBrSize

          target.backups += totalBackupSize.onDisk
          if (!isS3) {
            const _target = target as DashboardBackupRepositoriesSizeInfo['other']['size']
            _target.available += available
            _target.other += used - totalBackupSize.onDisk
            _target.total += size
            _target.used += used
          }
        }

        return { s3: { size: s3Brsize }, other: { size: otherBrSize } }
      },
      this.#dashboardCacheOpts
    )

    if (brResult?.value !== undefined) {
      return { ...brResult.value, isExpired: brResult.isExpired }
    }
  }

  #getNumberOfPools() {
    const pools = this.#restApi.getObjectsByType<XoPool>('pool')
    return Object.keys(pools).length
  }

  #getNumberOfHosts() {
    const hosts = this.#restApi.getObjectsByType<XoHost>('host')
    return Object.keys(hosts).length
  }

  #getResourcesOverview(): XoaDashboard['resourcesOverview'] {
    const pools = Object.values(this.#restApi.getObjectsByType<XoPool>('pool'))
    const hosts = Object.values(this.#restApi.getObjectsByType<XoHost>('host'))
    const writableSrs = Object.values(
      this.#restApi.getObjectsByType<XoSr>('SR', {
        filter: isSrWritable,
      })
    )

    const maxLenght = Math.max(hosts.length, writableSrs.length)

    const resourcesOverview = { nCpus: 0, memorySize: 0, srSize: 0 }
    for (let index = 0; index < maxLenght; index++) {
      const pool = pools[index]
      const host = hosts[index]
      const sr = writableSrs[index]

      if (pool !== undefined) {
        resourcesOverview.nCpus += pool.cpus.cores ?? 0
      }
      if (host !== undefined) {
        resourcesOverview.memorySize += host.memory.size
      }
      if (sr !== undefined) {
        resourcesOverview.srSize += sr.size
      }
    }

    return resourcesOverview
  }

  async #getPoolsStatus(): Promise<XoaDashboard['poolsStatus']> {
    const servers = await this.#restApi.xoApp.getAllXenServers()
    const pools = this.#restApi.getObjectsByType<XoPool>('pool')

    let nConnectedServers = 0
    let nUnreachableServers = 0
    let nUnknownServers = 0
    servers.forEach(server => {
      // it may happen that some servers are marked as "connected", but no pool matches "server.pool"
      // so they are counted as `nUnknownServers`
      if (server.status === 'connected' && server.poolId !== undefined && pools[server.poolId] !== undefined) {
        nConnectedServers++
        return
      }

      if (
        server.status === 'disconnected' &&
        server.error !== undefined &&
        server.error.connectedServerId === undefined
      ) {
        nUnreachableServers++
        return
      }

      if (server.status === 'disconnected') {
        return
      }

      nUnknownServers++
    })

    return {
      connected: nConnectedServers,
      unreachable: nUnreachableServers,
      unknown: nUnknownServers,
    }
  }

  async #getNumberOfEolHosts(): Promise<XoaDashboard['nHostsEol']> {
    const getHVSupportedVersions = this.#restApi.xoApp.getHVSupportedVersions

    if (getHVSupportedVersions === undefined) {
      return
    }

    const hvSupportedVersions = await getHVSupportedVersions()

    const hosts = this.#restApi.getObjectsByType<XoHost>('host')
    let nHostsEol = 0

    for (const hostId in hosts) {
      const host = hosts[hostId as XoHost['id']]
      if (!semver.satisfies(host.version, hvSupportedVersions[host.productBrand])) {
        nHostsEol++
      }
    }

    return nHostsEol
  }

  async #getMissingPatchesInfo(): Promise<XoaDashboard['missingPatches']> {
    if (!(await this.#restApi.xoApp.hasFeatureAuthorization('LIST_MISSING_PATCHES'))) {
      return {
        hasAuthorization: false,
      }
    }

    const hosts = Object.values(this.#restApi.getObjectsByType<XoHost>('host'))
    const poolsWithMissingPatches = new Set()
    let nHostsWithMissingPatches = 0
    let nHostsFailed = 0

    await asyncEach(hosts, async (host: XoHost) => {
      const xapi = this.#restApi.xoApp.getXapi(host)

      try {
        const patches = await xapi.listMissingPatches(host.id)

        if (patches.length > 0) {
          nHostsWithMissingPatches++
          poolsWithMissingPatches.add(host.$pool)
        }
      } catch (err) {
        log.error('listMissingPatches failed', err)
        nHostsFailed++
      }
    })

    return {
      hasAuthorization: true,
      nHostsFailed,
      nHostsWithMissingPatches,
      nPoolsWithMissingPatches: poolsWithMissingPatches.size,
    }
  }

  #isReplicaVmInVdb(vbds: XoVbd['id'][]): boolean {
    for (const vbd of vbds) {
      try {
        const vdbObject = this.#restApi.getObject<XoVbd>(vbd)
        const { VM } = vdbObject
        const vmObject = this.#restApi.getObject<AnyXoVm>(VM)
        return isReplicaVm(vmObject)
      } catch (err) {
        if (!noSuchObject.is(err)) {
          throw err
        }
      }
    }
    return false
  }

  #calculateReplicatedSize(vdiId: AnyXoVdi['id'], cache: Set<AnyXoVdi['id']>): number {
    if (cache.has(vdiId)) {
      return 0
    }

    let vdiObject: AnyXoVdi
    try {
      vdiObject = this.#restApi.getObject<AnyXoVdi>(vdiId)
      cache.add(vdiId)
    } catch (err) {
      if (!noSuchObject.is(err)) {
        throw err
      }
      return 0
    }

    const { parent, usage, $VBDs } = vdiObject
    const replicaUsage = this.#isReplicaVmInVdb($VBDs) && usage ? usage : 0
    const parentUsage = parent ? this.#calculateReplicatedSize(parent, cache) : 0

    return replicaUsage + parentUsage
  }

  #getStorageRepositoriesSizeInfo() {
    const writableSrs = this.#restApi.getObjectsByType<XoSr>('SR', {
      filter: isSrWritable,
    })

    let replicated = 0
    let total = 0
    let used = 0

    for (const srId in writableSrs) {
      const sr = writableSrs[srId as XoSr['id']]

      const cache = new Set<AnyXoVdi['id']>()
      const { VDIs } = sr

      replicated += VDIs.reduce((total, vdi) => total + this.#calculateReplicatedSize(vdi, cache), 0)
      total += sr.size
      used += sr.physical_usage
    }

    return {
      size: { available: total - used, other: used - replicated, replicated, total, used },
    }
  }

  async getDashboard() {
    const nPools = this.#getNumberOfPools()
    const nHosts = this.#getNumberOfHosts()
    const resourcesOverview = this.#getResourcesOverview()
    const storageRepositoriesSize = this.#getStorageRepositoriesSizeInfo()

    const poolsStatus = await this.#getPoolsStatus()
    const missingPatches = await this.#getMissingPatchesInfo()
    const backupRepositories = await this.#getBackupRepositoriesSizeInfo().catch(err => {
      log.error('#getBackupRepositoriesSizeInfo failed', err)
    })
    const nHostsEol = await this.#getNumberOfEolHosts().catch(err => {
      log.err('#getNumberOfEolHosts failed', err)
    })

    return {
      nPools,
      nHosts,
      backupRepositories,
      resourcesOverview,
      poolsStatus,
      nHostsEol,
      missingPatches,
      storageRepositoriesSize,
    }
  }
}
