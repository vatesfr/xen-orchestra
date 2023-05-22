'use strict'

const { asyncMap } = require('@xen-orchestra/async-map')
const Disposable = require('promise-toolbox/Disposable')
const ignoreErrors = require('promise-toolbox/ignoreErrors')

const { extractIdsFromSimplePattern } = require('../extractIdsFromSimplePattern.js')
const { PoolMetadataBackup } = require('./_PoolMetadataBackup.js')
const { XoMetadataBackup } = require('./_XoMetadataBackup.js')
const { DEFAULT_SETTINGS, AbstractRunner } = require('./_Abstract.js')
const { runTask } = require('./_runTask.js')
const { getAdaptersByRemote } = require('./_getAdaptersByRemote.js')

const DEFAULT_METADATA_SETTINGS = {
  retentionPoolMetadata: 0,
  retentionXoMetadata: 0,
}

exports.Metadata = class MetadataBackupRunner extends AbstractRunner {
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
            runTask(
              {
                name: 'get pool record',
                data: { type: 'pool', id },
              },
              () => Promise.reject(error)
            )
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
              runTask(
                {
                  name: `Starting metadata backup for the pool (${pool.$id}). (${job.id})`,
                  data: {
                    id: pool.$id,
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
              )
            )
          )
        }

        if (job.xoMetadata !== undefined && settings.retentionXoMetadata !== 0) {
          promises.push(
            runTask(
              {
                name: `Starting XO metadata backup. (${job.id})`,
                data: {
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
            )
          )
        }
        await Promise.all(promises)
      }
    )
  }
}
