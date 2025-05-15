import { createLogger } from '@xen-orchestra/log'
import { parse } from 'xo-remote-parser'

import { getFromAsyncCache } from '../helpers/cache.helper.mjs'
import { RestApi } from '../rest-api/rest-api.mjs'
import { DashboardBackupRepositoriesSizeInfo, XoaDashboard } from './xoa.type.mjs'
import { MaybePromise } from '../helpers/helper.type.mjs'
import { XoHost, XoPool, XoSr } from '@vates/types'

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
        filter: sr => sr.content_type !== 'iso' && sr.size > 0,
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

  async getDashboard() {
    const nPools = this.#getNumberOfPools()
    const nHosts = this.#getNumberOfHosts()
    const resourcesOverview = this.#getResourcesOverview()

    const backupRepositories = await this.#getBackupRepositoriesSizeInfo().catch(err => {
      log.error('#getBackupRepositoriesSizeInfo failed', err)
    })

    return {
      nPools,
      nHosts,
      backupRepositories,
      resourcesOverview,
    }
  }
}
