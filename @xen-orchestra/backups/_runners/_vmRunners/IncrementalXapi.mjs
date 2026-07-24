import { createLogger } from '@xen-orchestra/log'
import { Task } from '@vates/task'
import keyBy from 'lodash/keyBy.js'

import { AbstractXapi } from './_AbstractXapi.mjs'
import { forkDeltaExport } from './_forkDeltaExport.mjs'
import { exportIncrementalVm } from '../../_incrementalVm.mjs'
import { IncrementalRemoteWriter } from '../_writers/IncrementalRemoteWriter.mjs'
import { IncrementalXapiWriter } from '../_writers/IncrementalXapiWriter.mjs'
import {
  CONTENT_KEY,
  DATETIME,
  DELTA_CHAIN_LENGTH,
  EXPORTED_SUCCESSFULLY,
  setVmDeltaChainLength,
  markExportSuccessfull,
} from '../../_otherConfig.mjs'
import { ThrottledDisk, SynchronizedDisk } from '@xen-orchestra/disk-transform'
import { AggregatedIncrementalRemoteWriter } from '../_writers/AggregatedIncrementalRemoteWriter.mjs'
import { AggregatedIncrementalXapiWriter } from '../_writers/AggregatedIncrementalXapiWriter.mjs'
import { TaskProgressHandler } from './_TaskProgressHandler.mjs'

const { debug } = createLogger('xo:backups:IncrementalXapiVmBackup')

export const IncrementalXapi = class IncrementalXapiVmBackupRunner extends AbstractXapi {
  _getWriters() {
    return [
      IncrementalRemoteWriter,
      IncrementalXapiWriter,
      AggregatedIncrementalRemoteWriter,
      AggregatedIncrementalXapiWriter,
    ]
  }

  async _mustDoSnapshot() {
    return true
  }

  async _copy() {
    const baseVdis = this._baseVdis
    const vm = this._vm
    const exportedVm = this._exportedVm

    const isFull = Object.values(baseVdis).length === 0 || Object.values(baseVdis).some(_ => !_)
    await this._callWriters(writer => writer.prepare({ isFull }), 'writer.prepare()')

    const deltaExport = await exportIncrementalVm(exportedVm, baseVdis, {
      nbdConcurrency: this._settings.nbdConcurrency,
      preferNbd: this._settings.preferNbd,
    })

    const isVhdDifferencing = {}
    let useNbd = false
    for (const key in deltaExport.disks) {
      let disk = deltaExport.disks[key]
      disk.addProgressHandler(new TaskProgressHandler())
      isVhdDifferencing[key] = disk.isDifferencing()
      if (!isFull && !isVhdDifferencing[key] && key !== exportedVm.$suspend_VDI?.$ref) {
        Task.warning('Backup fell back to a full')
      }
      useNbd = useNbd || disk.useNbd()
      disk = new ThrottledDisk(disk, this._throttleGenerator)
      deltaExport.disks[key] = new SynchronizedDisk(disk)
    }
    if (useNbd) {
      Task.info('Transfer data using NBD')
    }

    // @todo : reimplement throttle

    const timestamp = Date.now()
    await this._callWriters(
      writer =>
        writer.transfer({
          deltaExport: forkDeltaExport(deltaExport, writer.constructor.name),
          // freshly exported from XAPI by fixed code → disk data is known-good
          includeNonNbdQcow2Fix: true,
          isVhdDifferencing,
          timestamp,
          vm,
          vmSnapshot: exportedVm,
        }),
      'writer.transfer()'
    )

    if (isFull) {
      await setVmDeltaChainLength(this._xapi, exportedVm.$ref, 0)
    } else {
      await setVmDeltaChainLength(this._xapi, exportedVm.$ref, (this._deltaChainLength ?? 0) + 1)
    }

    // not the case if offlineBackup
    if (exportedVm.is_a_snapshot) {
      await markExportSuccessfull(this._xapi, exportedVm.$ref)
    }

    await this._callWriters(writer => writer.cleanup(), 'writer.cleanup()')
  }

  /**
   * Groups snapshot VDIs by their DATETIME other_config value and sorts them most-recent-first.
   *
   * @param {import('@vates/types').XenApiVdi[]} snapshotVdis
   * @returns {{ datetime: string, vdis: import('@vates/types').XenApiVdi[] }[]}
   */
  _groupSnapshotVdisByDatetime(snapshotVdis) {
    const byDatetime = new Map()
    for (const vdi of snapshotVdis) {
      const datetime = vdi.other_config[DATETIME]
      if (!byDatetime.has(datetime)) {
        byDatetime.set(datetime, [])
      }
      byDatetime.get(datetime).push(vdi)
    }
    // sort them by decreasing datetime
    return [...byDatetime.entries()]
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([datetime, vdis]) => ({ datetime, vdis }))
  }

  /**
   * For each snapshot VDI in `snapshotVdis`, maps it to its live source VDI,
   * attaches its CONTENT_KEY when present, calls checkBaseVdis on all writers,
   * and returns both the full mapping and the subset confirmed present by writers.
   *
   * @param {import('@vates/types').XenApiVdi[]} snapshotVdis - Snapshot VDI records to use as base candidates
   * @param {Record<string, object>} srcVdisByRef - Live VM VDI records keyed by $ref
   * @param {{ useContentKey?: boolean }} [options]
   * @returns {Promise<{ presentBaseVdis: Map<string, string>, baseUuidToSrcVdiUuid: Map<string, string>}>}
   */
  async _checkBaseVdis(snapshotVdis, srcVdisByRef, { useContentKey = false } = {}) {
    const baseUuidToSrcVdiUuid = new Map()
    const baseUuidToContentKey = new Map()
    for (const snapshotVdi of snapshotVdis) {
      const baseUuid = snapshotVdi.uuid
      const srcVdi = srcVdisByRef[snapshotVdi.snapshot_of]
      if (srcVdi !== undefined) {
        baseUuidToSrcVdiUuid.set(baseUuid, srcVdi.uuid)
        if (useContentKey) {
          const contentKey = snapshotVdi.other_config[CONTENT_KEY]
          if (contentKey !== undefined) {
            baseUuidToContentKey.set(baseUuid, contentKey)
          }
        }
      } else {
        debug('ignore snapshot VDI because no longer present on VM', { vdi: baseUuid })
      }
    }

    const presentBaseVdis = new Map(baseUuidToSrcVdiUuid)
    await this._callWriters(
      writer => presentBaseVdis.size !== 0 && writer.checkBaseVdis(presentBaseVdis, baseUuidToContentKey),
      'writer.checkBaseVdis()',
      false
    )
    return { presentBaseVdis, baseUuidToSrcVdiUuid }
  }

  async _selectBaseVm() {
    const xapi = this._xapi

    const exportedVdis = this._jobSnapshotVdis.filter(
      _ => EXPORTED_SUCCESSFULLY in _.other_config && DATETIME in _.other_config
    )
    const grouped = this._groupSnapshotVdisByDatetime(exportedVdis)

    this._baseVdis = {}
    if (grouped.length === 0) {
      debug('no base VDIs found', {
        jobLength: this._jobSnapshotVdis.length,
        exportedLength: exportedVdis.length,
      })
    }
    const srcVdis = keyBy(await xapi.getRecords('VDI', await this._vm.$getDisks()), '$ref')
    let lastExportedVdis = []
    let presentBaseVdis = new Map()
    let baseUuidToSrcVdiUuid = new Map()
    let deltaChainLength

    if (grouped.length > 0) {
      lastExportedVdis = grouped[0].vdis
      // only compute it on the _jobSnapshotVdis , not on the reused snapshot from CONTENT_KEYS
      deltaChainLength = Math.max(
        ...lastExportedVdis.map(({ other_config }) => Number(other_config[DELTA_CHAIN_LENGTH] ?? 0))
      )
      ;({ presentBaseVdis, baseUuidToSrcVdiUuid } = await this._checkBaseVdis(lastExportedVdis, srcVdis))
    }

    // if we don't find any candidates
    // if there is only one writer of type IncrementalXapiWriter
    // allow the reuse of any matching snapshot of this VM even from another job
    if (
      presentBaseVdis.size === 0 &&
      this._writers.size === 1 &&
      [...this._writers][0] instanceof IncrementalXapiWriter
    ) {
      debug('fallback to content key')
      const candidates = {}
      for (const srcVdi of Object.values(srcVdis)) {
        const snapshots = srcVdi.$snapshots
        debug(`${srcVdi.uuid} got ${snapshots.length} snapshots`)
        for (const snapshot of snapshots) {
          if (DATETIME in snapshot.other_config) {
            candidates[snapshot.uuid] = snapshot
          }
        }
      }

      debug('got candidates ', Object.keys(candidates).length)
      this._filterValidSnapshotVdis(candidates)
      debug('got filtered  ', Object.keys(candidates).length)
      for (const group of this._groupSnapshotVdisByDatetime(Object.values(candidates))) {
        debug('check by datetime   ', [...group.vdis].length)
        debug(group.vdis)
        const result = await this._checkBaseVdis(group.vdis, srcVdis, { useContentKey: true })
        debug('result ', result)
        if (result.presentBaseVdis.size > 0) {
          lastExportedVdis = group.vdis

          presentBaseVdis = result.presentBaseVdis
          baseUuidToSrcVdiUuid = result.baseUuidToSrcVdiUuid

          break
        }
        debug('try next group if any')
      }
    } else {
      debug(' no fallback ')
    }

    if (presentBaseVdis.size === 0) {
      debug('no base VM found')
      return
    }

    // we do tafter checkbasevdis because we want the writer to know the target VM
    // especially on replication when we alwayr update the same VM
    const fullInterval = this._settings.fullInterval
    if (fullInterval !== 0 && fullInterval <= deltaChainLength + 1) {
      debug('not using base VM because fullInterval reached', {
        fullInterval,
        deltaChainLength,
        eq: fullInterval < deltaChainLength + 1,
        dc1: deltaChainLength + 1,
      })
      return
    }

    baseUuidToSrcVdiUuid.forEach((srcVdiUuid, baseUuid) => {
      if (presentBaseVdis.has(baseUuid)) {
        debug('found base VDI', {
          base: baseUuid,
          vdi: srcVdiUuid,
        })
        this._baseVdis[srcVdiUuid] = lastExportedVdis.find(vdi => vdi.uuid === baseUuid)
      } else {
        debug('missing base VDI', {
          base: baseUuid,
          vdi: srcVdiUuid,
        })
        // this will force a full for this vdi
        this._baseVdis[srcVdiUuid] = undefined
      }
    })
    this._deltaChainLength = deltaChainLength
  }
}
