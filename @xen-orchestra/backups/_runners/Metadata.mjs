import { asyncMap } from '@xen-orchestra/async-map'
import { Task } from '@vates/task'
import Disposable from 'promise-toolbox/Disposable'
import ignoreErrors from 'promise-toolbox/ignoreErrors'

import { extractIdsFromSimplePattern } from '../extractIdsFromSimplePattern.mjs'
import { PoolMetadataBackup } from './_PoolMetadataBackup.mjs'
import { XoMetadataBackup } from './_XoMetadataBackup.mjs'
import { DEFAULT_SETTINGS, Abstract } from './_Abstract.mjs'
import { getAdaptersByRemote } from './_getAdaptersByRemote.mjs'

const noop = Function.prototype

const DEFAULT_METADATA_SETTINGS = {
  retentionPoolMetadata: 0,
  retentionXoMetadata: 0,
}

export const Metadata = class MetadataBackupRunner extends Abstract {
  _computeBaseSettings(config, job) {
    const baseSettings = { ...DEFAULT_SETTINGS }
    Object.assign(baseSettings, DEFAULT_METADATA_SETTINGS, config.defaultSettings, config.metadata?.defaultSettings)
    Object.assign(baseSettings, job.settings[''])
    return baseSettings
  }

  async run() {
    const schedule = this._schedule
    const job = this._job
    const remoteIds = extractIdsFromSimplePattern(job.remotes)
    if (remoteIds.length === 0) {
      throw new Error('metadata backup job cannot run without remotes')
    }

    const config = this._config
    const poolIds = extractIdsFromSimplePattern(job.pools)
    const isEmptyPools = poolIds.length === 0
    const isXoMetadata = job.xoMetadata !== undefined
    if (!isXoMetadata && isEmptyPools) {
      throw new Error('no metadata mode found')
    }

    const settings = this._settings

    const { retentionPoolMetadata, retentionXoMetadata } = settings

    if (
      (retentionPoolMetadata === 0 && retentionXoMetadata === 0) ||
      (!isXoMetadata && retentionPoolMetadata === 0) ||
      (isEmptyPools && retentionXoMetadata === 0)
    ) {
      throw new Error('no retentions corresponding to the metadata modes found')
    }

    await Disposable.use(
      Disposable.all(
        poolIds.map(id =>
          this._getRecord('pool', id).catch(error => {
            // See https://github.com/vatesfr/xen-orchestra/commit/6aa6cfba8ec939c0288f0fa740f6dfad98c43cbb
            Task.run(
              {
                properties: {
                  id,
                  name: 'get pool record',
                  type: 'pool',
                },
              },
              () => Promise.reject(error)
            ).catch(noop)
          })
        )
      ),
      Disposable.all(remoteIds.map(id => this._getAdapter(id))),
      async (pools, remoteAdapters) => {
        // remove adapters that failed (already handled)
        remoteAdapters = remoteAdapters.filter(_ => _ !== undefined)
        if (remoteAdapters.length === 0) {
          return
        }
        remoteAdapters = getAdaptersByRemote(remoteAdapters)

        // remove pools that failed (already handled)
        pools = pools.filter(_ => _ !== undefined)

        const promises = []
        if (pools.length !== 0 && settings.retentionPoolMetadata !== 0) {
          promises.push(
            asyncMap(pools, async pool =>
              Task.run(
                {
                  properties: {
                    id: pool.$id,
                    name: `Starting metadata backup for the pool (${pool.$id}). (${job.id})`,
                    pool,
                    poolMaster: await ignoreErrors.call(pool.$xapi.getRecord('host', pool.master)),
                    type: 'pool',
                  },
                },
                () =>
                  new PoolMetadataBackup({
                    config,
                    job,
                    pool,
                    remoteAdapters,
                    schedule,
                    settings,
                  }).run()
              ).catch(noop)
            )
          )
        }

        if (job.xoMetadata !== undefined && settings.retentionXoMetadata !== 0) {
          promises.push(
            Task.run(
              {
                properties: {
                  name: `Starting XO metadata backup. (${job.id})`,
                  type: 'xo',
                },
              },
              () =>
                new XoMetadataBackup({
                  config,
                  job,
                  remoteAdapters,
                  schedule,
                  settings,
                }).run()
            ).catch(noop)
          )
        }
        await Promise.all(promises)
      }
    )
  }
}
