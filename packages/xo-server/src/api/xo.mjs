import * as CM from 'complex-matcher'
import { asyncEach } from '@vates/async-each'
import { fromCallback } from 'promise-toolbox'
import { getStreamAsBuffer } from 'get-stream'
import { parseDateTime } from '@xen-orchestra/xapi'
import { pipeline } from 'readable-stream'
import { safeDateFormat } from '../utils.mjs'
import createNdJsonStream from '../_createNdJsonStream.mjs'
import { getCurrentVmUuid } from '../_XenStore.mjs'

// ===================================================================

export function clean() {
  return this.hooks.clean()
}

clean.permission = 'admin'

// -------------------------------------------------------------------

export async function exportConfig({ compress, entries, passphrase }) {
  const date = safeDateFormat(new Date())
  let suffix = `/XO-config_${date}.json`
  if (compress) {
    suffix += '.gz'
  }
  if (passphrase !== undefined) {
    suffix += '.enc'
  }

  return {
    $getFrom: await this.registerHttpRequest(
      (req, res) => {
        res.set({
          'content-disposition': 'attachment',
        })

        return this.exportConfig({ compress, entries, passphrase })
      },
      undefined,
      { suffix }
    ),
  }
}

exportConfig.permission = 'admin'

exportConfig.params = {
  compress: { type: 'boolean', default: true },
  entries: { type: 'array', items: { type: 'string' }, optional: true },
  passphrase: { type: 'string', optional: true },
}

// -------------------------------------------------------------------

function handleGetAllObjects(req, res, { filter, limit }) {
  const objects = this.getObjects({ filter, limit })
  res.set('Content-Type', 'application/json')
  return fromCallback(pipeline, createNdJsonStream(objects), res)
}

export function getAllObjects({ filter, limit, ndjson = false }) {
  if (typeof filter === 'string') {
    filter = CM.parse(filter).createPredicate()
  }

  return ndjson
    ? this.registerHttpRequest(handleGetAllObjects, {
        filter,
        limit,
      }).then($getFrom => ({ $getFrom }))
    : this.getObjects({ filter, limit })
}

getAllObjects.description = 'Returns all XO objects'

getAllObjects.params = {
  filter: { type: ['object', 'string'], optional: true },
  limit: { type: 'number', optional: true },
  ndjson: { type: 'boolean', optional: true },
}

// -------------------------------------------------------------------

export async function importConfig({ passphrase }) {
  return {
    $sendTo: await this.registerHttpRequest(async (req, res) => {
      await this.importConfig(await getStreamAsBuffer(req), { passphrase })

      res.end('config successfully imported')
    }),
  }
}

importConfig.permission = 'admin'

importConfig.params = {
  passphrase: { type: 'string', optional: true },
}

export async function snapshotBeforeUpgrade() {
  const SNAPSHOT_LABEL = 'Snapshot before update, delete after successful upgrade.'

  // Maximum number of upgrade snapshots to keep, including the one about to be
  // created. Older snapshots beyond this limit are rotated out.
  //
  // Defaults to 1 (keep only the latest) when the config entry is missing.
  const maxSnapshots = Math.max(1, this.config.getOptional('xoa.numberOfUpgradeSnapshots') ?? 1)

  const vmUuid = await getCurrentVmUuid()
  let vm, xapi
  try {
    vm = this.getXapiObject(vmUuid, 'VM')
    xapi = vm.$xapi
  } catch (err) {
    throw new Error(`This VM is not handled by this XOA, maybe it's not connected to the pool running it `, {
      cause: err,
    })
  }

  // delete the oldest upgrade snapshots so that at most `maxSnapshots` remain
  // once the new one is created
  const upgradeSnapshots = vm.$snapshots
    .filter(({ name_label }) => name_label === SNAPSHOT_LABEL)
    .sort((a, b) => parseDateTime(a.snapshot_time) - parseDateTime(b.snapshot_time))
  const snapshotsToDelete = upgradeSnapshots.slice(0, Math.max(0, upgradeSnapshots.length - (maxSnapshots - 1)))
  await asyncEach(snapshotsToDelete, snapshot => snapshot.$destroy(), { concurrency: 2 })

  await xapi.VM_snapshot(vm.$ref, { name_label: SNAPSHOT_LABEL })
}

snapshotBeforeUpgrade.permission = 'admin'

snapshotBeforeUpgrade.params = {}
