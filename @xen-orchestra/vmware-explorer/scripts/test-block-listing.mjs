#!/usr/bin/env node

// Checks, for each disk of each VM, whether the host lists the blocks the disk uses: the change tracking
// asked with `changeId='*'`, as an import does for its first pass. The answer is compared with the capacity
// of the disk and with what its files really use on the datastore, by datastore type (VMFS, NFS, vSAN…).
//
// Read only: nothing is created, snapshotted or reconfigured on the host.
//
// Usage: node scripts/test-block-listing.mjs --config ../../../.env-esxi8.json [--vm <id>]… [--datastore <name>]… [--json]
//
// The config is `{ "address": "host[:port]", "user": "…", "password": "…" }`.

import { once } from 'node:events'
import { readFile } from 'node:fs/promises'
import { parseArgs } from 'node:util'

import Esxi from '../esxi.mjs'
import { parseDatastorePath } from '../_paths.mjs'
import { asArray } from '../soap/normalize.mjs'

const GiB = 2 ** 30

const { values: args } = parseArgs({
  options: {
    config: { type: 'string' },
    vm: { type: 'string', multiple: true, default: [] },
    datastore: { type: 'string', multiple: true, default: [] },
    json: { type: 'boolean', default: false },
  },
})
if (args.config === undefined) {
  console.error('usage: test-block-listing.mjs --config <file> [--vm <id>]… [--datastore <name>]… [--json]')
  process.exit(1)
}

const { address, user, password } = JSON.parse(await readFile(args.config, 'utf8'))

const isVirtualDisk = device => device?.attributes?.['xsi:type'] === 'VirtualDisk'
const disksOf = devices => asArray(devices?.VirtualDevice).filter(isVirtualDisk)
const toGiB = bytes => (bytes === undefined ? '' : (bytes / GiB).toFixed(2))
const toPercent = (part, whole) => (part === undefined || !(whole > 0) ? '' : `${Math.round((part * 100) / whole)}%`)

/**
 * What the files of a disk use on its datastore, from `layoutEx`: `size` is the size of the files, `uniqueSize`
 * the space they really take when the datastore reports it (e.g. not for a thin file on some NFS servers).
 */
function usageOf(layoutEx, fileName) {
  const base = fileName.replace(/\.vmdk$/, '')
  const extents = asArray(layoutEx?.file).filter(
    file => file.type === 'diskExtent' && file.name.startsWith(base) && file.name !== fileName
  )
  if (extents.length === 0) {
    return {}
  }
  const sum = key => extents.reduce((total, file) => total + Number(file[key] ?? 0), 0)
  return {
    size: sum('size'),
    uniqueSize: extents.some(file => file.uniqueSize !== undefined) ? sum('uniqueSize') : undefined,
  }
}

const esxi = new Esxi(address, user, password, false)
await once(esxi, 'ready')

// the reason of a refusal is only logged by `getDataMap`: the last warning of each call is kept for the report
const warnings = []
const originalWarn = console.warn
// the logger hands its data as an object, with the error of the host in it
const describe = datum => {
  const error = datum?.error
  if (error !== undefined) {
    // the fault key says why, e.g. `vim.hostd.vmsvc.cbt.noTrack` for a disk which is not tracked
    const faultKey = /<key>(vim\.[^<]+)<\/key>/.exec(error.body ?? '')?.[1]
    return [error.code, faultKey ?? error.message?.split(':')[1]?.trim()].filter(Boolean).join(' ')
  }
  return typeof datum === 'string' ? datum : ''
}
console.warn = (...data) => {
  warnings.push(data.map(describe).filter(Boolean).join(' '))
}

const results = []
try {
  const datastores = new Map()
  for (const { summary } of Object.values(await esxi.search('Datastore', ['summary']))) {
    datastores.set(summary.name, { type: summary.type, url: summary.url })
  }

  const vms = await esxi.search('VirtualMachine', [
    'config.name',
    'config.changeTrackingEnabled',
    'config.template',
    'runtime.powerState',
    'layoutEx',
  ])

  for (const [vmId, vm] of Object.entries(vms)) {
    if ((args.vm.length !== 0 && !args.vm.includes(vmId)) || String(vm['config.template']) === 'true') {
      continue
    }
    const vmName = vm['config.name']
    let changeTracking
    try {
      changeTracking = await esxi.getChangeTracking(vmId)
    } catch (error) {
      results.push({ vmId, vmName, error: `change tracking unreadable: ${error.code ?? ''} ${error.message}` })
      continue
    }

    // what an import reads: the live disks of a powered off VM, or the disks of its current snapshot
    const { currentSnapshotId, devices, powerState, snapshotDevices } = changeTracking
    const disks =
      currentSnapshotId === undefined
        ? disksOf(devices).map(disk => ({ disk, state: 'live' }))
        : disksOf(snapshotDevices.get(currentSnapshotId)).map(disk => ({ disk, state: 'snapshot' }))

    for (const { disk, state } of disks) {
      const fileName = disk.backing?.fileName
      const location = parseDatastorePath(fileName)
      if (location === undefined) {
        continue
      }
      if (args.datastore.length !== 0 && !args.datastore.includes(location.datastoreName)) {
        continue
      }
      const capacity = Number(disk.capacityInKB) * 1024
      const usage = usageOf(vm.layoutEx, fileName)
      const result = {
        vmId,
        vmName,
        powerState,
        cbtEnabled: String(vm['config.changeTrackingEnabled']) === 'true',
        state,
        datastore: location.datastoreName,
        datastoreType: datastores.get(location.datastoreName)?.type,
        disk: location.path,
        thin: String(disk.backing?.thinProvisioned) === 'true',
        changeId: disk.backing?.changeId,
        capacity,
        fileSize: usage.size,
        fileUniqueSize: usage.uniqueSize,
      }

      warnings.length = 0
      const start = Date.now()
      const map = await esxi.getDataMap(vmId, location.datastoreName, location.path, { changeTracking })
      result.seconds = (Date.now() - start) / 1e3
      if (map === undefined) {
        result.listed = undefined
        result.refusal = warnings
          .at(-1)
          ?.replace(/^.*error while getting the data map from the change tracking\s*/, '')
          .slice(0, 300)
      } else {
        result.listed = map.reduce((total, { length }) => total + length, 0)
        result.extents = map.length
      }
      results.push(result)
    }
  }
} finally {
  console.warn = originalWarn
  await esxi.close()
}

// a listing is useful when it is smaller than the disk: equal to the capacity, the host did not know
function verdictOf({ listed, capacity }) {
  if (listed === undefined) {
    return 'refused'
  }
  return listed >= capacity ? 'whole disk' : 'filtered'
}

if (args.json) {
  console.log(
    JSON.stringify(
      results.map(result => ({ ...result, verdict: verdictOf(result) })),
      null,
      2
    )
  )
  process.exit(0)
}

console.table(
  results.map(result =>
    result.error !== undefined
      ? { vm: `${result.vmId} ${result.vmName}`, verdict: result.error }
      : {
          vm: `${result.vmId} ${result.vmName}`,
          datastore: `${result.datastore} (${result.datastoreType})`,
          disk: result.disk,
          read: `${result.state}${result.powerState === 'poweredOff' ? '' : `, VM ${result.powerState}`}`,
          cbt: result.cbtEnabled ? (result.changeId === undefined ? 'on, no changeId' : 'on') : 'off',
          thin: result.thin,
          'capacity GiB': toGiB(result.capacity),
          'files GiB': toGiB(result.fileUniqueSize ?? result.fileSize),
          'listed GiB': toGiB(result.listed),
          'listed %': toPercent(result.listed, result.capacity),
          extents: result.extents ?? '',
          verdict: verdictOf(result),
        }
  )
)

// by datastore type: whether the host filters, and how much would be saved
const byType = new Map()
for (const result of results) {
  if (result.error !== undefined) {
    continue
  }
  const type = result.datastoreType ?? 'unknown'
  const entry = byType.get(type) ?? { disks: 0, filtered: 0, 'whole disk': 0, refused: 0, capacity: 0, listed: 0 }
  entry.disks++
  entry[verdictOf(result)]++
  entry.capacity += result.capacity
  entry.listed += result.listed ?? result.capacity
  byType.set(type, entry)
}
console.table(
  Object.fromEntries(
    [...byType].map(([type, { capacity, listed, ...counts }]) => [
      type,
      {
        ...counts,
        'capacity GiB': toGiB(capacity),
        'to read GiB': toGiB(listed),
        'to read %': toPercent(listed, capacity),
      },
    ])
  )
)

const refusals = results.filter(result => result.refusal !== undefined)
if (refusals.length !== 0) {
  console.log('\nrefusals:')
  for (const { vmId, disk, refusal } of refusals) {
    console.log(`- ${vmId} ${disk}: ${refusal}`)
  }
}
