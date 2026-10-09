/* eslint-disable no-console */
//
// Cost of filtering XO objects per user, measured on a synthetic object graph.
//
//   node benchmarks/object-visibility.mjs [objectCount...]
//
// Defaults to 10000, 30000 and 100000 objects. No XOA, no server, no Redis:
// it exercises the filtering code alone so the result can be reproduced and
// the assumptions argued with.
//
// The number that matters is the ratio against `JSON.stringify`, which the
// server already performs once per connection, change or no change. On its
// own "the filter took 40 ms" says nothing; "it adds 12% to work we already
// do" is actionable.

import { cpus } from 'node:os'
import { readFileSync } from 'node:fs'

import { createIsObjectVisible } from '../src/_objectVisibility.mjs'
import { computeObjectNotifications } from '../src/_objectNotifications.mjs'

// ===================================================================
// Shape of a real installation
//
// Measured on a lab holding 597 VMs: 28884 objects in total. Keeping the mix
// realistic matters — `message` is 69% of the collection and resolves in a
// single hop, so a graph made mostly of VMs would overstate the cost.
const REFERENCE = {
  total: 28884,
  counts: {
    pool: 2,
    host: 7,
    network: 39,
    SR: 40,
    'VM-template': 134,
    VM: 597,
    'VM-snapshot': 609,
    'VM-controller': 8,
    VDI: 1549,
    'VDI-snapshot': 901,
    'VDI-unmanaged': 727,
    VBD: 2606,
    VIF: 1428,
    message: 19997,
    PIF: 67,
    PBD: 53,
    PCI: 64,
    PGPU: 7,
    SM: 37,
    bond: 4,
    gpuGroup: 2,
    task: 6,
  },
}

// share of objects carrying tags, for the configured-tags benchmark
const TAGGED_RATIO = 0.05

const pick = (array, i) => array[i % array.length]

function generateObjects(targetCount) {
  const scale = targetCount / REFERENCE.total
  const n = type => Math.max(1, Math.round(REFERENCE.counts[type] * scale))

  const objects = { __proto__: null }
  const ids = {}
  const add = (type, count, build) => {
    const list = (ids[type] = [])
    for (let i = 0; i < count; i++) {
      const id = `${type}-${i}`
      const object = { id, type, ...build(i) }
      objects[id] = object
      list.push(id)
    }
  }

  add('pool', n('pool'), () => ({}))
  for (const id of ids.pool) {
    objects[id].$pool = id
  }

  const inPool = i => ({ $pool: pick(ids.pool, i) })

  add('host', n('host'), inPool)

  add('network', n('network'), inPool)
  add('VM-template', n('VM-template'), inPool)
  add('SR', n('SR'), i => ({ ...inPool(i), $container: pick(ids.pool, i) }))
  add('VM', n('VM'), i => ({ ...inPool(i), $container: pick(ids.host, i), $VBDs: [] }))
  add('VM-controller', n('VM-controller'), i => ({ ...inPool(i), $container: pick(ids.host, i) }))
  add('VM-snapshot', n('VM-snapshot'), i => ({ ...inPool(i), $snapshot_of: pick(ids.VM, i) }))

  add('VDI', n('VDI'), i => ({ ...inPool(i), $SR: pick(ids.SR, i), $VBDs: [] }))
  add('VDI-unmanaged', n('VDI-unmanaged'), i => ({ ...inPool(i), $SR: pick(ids.SR, i), $VBDs: [] }))
  add('VDI-snapshot', n('VDI-snapshot'), i => ({ ...inPool(i), $snapshot_of: pick(ids.VDI, i) }))

  // a VBD ties a disk to a VM; both ends link back to it, as XO does
  add('VBD', n('VBD'), i => ({ ...inPool(i), VDI: pick(ids.VDI, i), VM: pick(ids.VM, i) }))
  for (const vbdId of ids.VBD) {
    const vbd = objects[vbdId]
    objects[vbd.VDI].$VBDs.push(vbdId)
    objects[vbd.VM].$VBDs.push(vbdId)
  }

  add('VIF', n('VIF'), i => ({ ...inPool(i), $network: pick(ids.network, i), $VM: pick(ids.VM, i) }))
  add('message', n('message'), i => ({ ...inPool(i), $object: pick(ids.VM, i) }))
  add('PIF', n('PIF'), i => ({ ...inPool(i), $host: pick(ids.host, i) }))
  add('PBD', n('PBD'), i => ({ ...inPool(i), host: pick(ids.host, i), SR: pick(ids.SR, i) }))
  add('PCI', n('PCI'), i => ({ ...inPool(i), $host: pick(ids.host, i) }))
  add('PGPU', n('PGPU'), i => ({ ...inPool(i), $host: pick(ids.host, i) }))
  add('SM', n('SM'), inPool)
  add('bond', n('bond'), inPool)
  add('gpuGroup', n('gpuGroup'), inPool)
  add('task', n('task'), i => ({ ...inPool(i), $host: pick(ids.host, i) }))

  // tags, for the configured-tags poll
  const allIds = Object.keys(objects)
  for (let i = 0; i < allIds.length; i += Math.round(1 / TAGGED_RATIO)) {
    objects[allIds[i]].tags = [`tag-${i % 20}`]
  }

  return { objects, ids }
}

// ===================================================================

const getObject = objects => id => objects[id]

const grant = (...objectIds) => {
  const permissions = { __proto__: null }
  for (const id of objectIds) {
    permissions[id] = { view: 1 }
  }
  return permissions
}

function time(fn, iterations) {
  fn() // warm up
  const samples = []
  for (let i = 0; i < iterations; i++) {
    const start = performance.now()
    fn()
    samples.push(performance.now() - start)
  }
  samples.sort((a, b) => a - b)
  return samples[Math.floor(samples.length / 2)]
}

const ms = value => `${value.toFixed(1)} ms`

// Absolute timings only describe the machine they were taken on. The ratio
// against work the server already performs is what carries across hardware,
// so every line reports it.
const row = (label, value, baseline, note = '') =>
  console.log(
    `  ${label.padEnd(38)} ${ms(value).padStart(10)}   ${`x${(value / baseline).toFixed(2)}`.padStart(7)} ${note}`
  )

// one full pass, as `xo.getAllObjects` and the resync both perform
const fullPass = (objects, permissionsByObject) => () => {
  const isObjectVisible = createIsObjectVisible({ getObject: getObject(objects), permissionsByObject })
  const result = { __proto__: null }
  for (const id in objects) {
    if (isObjectVisible(id)) {
      result[id] = objects[id]
    }
  }
  return result
}

// the loop added to `tag.getAllConfigured`, which xo-web polls every 5s
const tagPass = (objects, permissionsByObject) => () => {
  const isObjectVisible = createIsObjectVisible({ getObject: getObject(objects), permissionsByObject })
  const visibleTags = new Set()
  for (const id in objects) {
    const { tags } = objects[id]
    if (tags !== undefined && tags.length !== 0 && isObjectVisible(id)) {
      for (const tag of tags) {
        visibleTags.add(tag)
      }
    }
  }
  return visibleTags
}

// ===================================================================

function benchmark(targetCount, iterations) {
  const { objects, ids } = generateObjects(targetCount)
  const total = Object.keys(objects).length

  // Measured: ~85 objects change per minute on an idle installation
  const batch = { __proto__: null }
  for (let i = 0; i < 85; i++) {
    const id = ids.task[i % ids.task.length] ?? ids.VM[i % ids.VM.length]
    batch[id] = objects[id]
  }

  const noAcl = grant()
  const oneVm = grant(ids.VM[0])
  const onePool = grant(ids.pool[0])

  console.log(`\n${'='.repeat(74)}`)
  console.log(`${total} objects (${Object.keys(REFERENCE.counts).length} types, lab proportions)`)
  console.log('='.repeat(74))

  // what the server already pays, per connection, change or no change
  const serialize = time(() => JSON.stringify(objects), iterations)

  const passes = [
    ['no ACL (sees nothing)', noAcl],
    ['one VM granted', oneVm],
    ['one pool granted', onePool],
  ]

  console.log('\nFull pass — paid on sign-in, and on a resync')
  row('JSON.stringify (already paid today)', serialize, serialize, '<- baseline')
  for (const [label, permissions] of passes) {
    row(label, time(fullPass(objects, permissions), iterations), serialize)
  }

  console.log('\nSteady state — 85 changed objects, the measured rate per minute')
  for (const [label, permissions] of passes.slice(0, 2)) {
    const t = time(() => {
      const isObjectVisible = createIsObjectVisible({ getObject: getObject(objects), permissionsByObject: permissions })
      return computeObjectNotifications({ entered: batch, exited: {}, isObjectVisible })
    }, iterations)
    row(label, t, serialize, 'per batch, per user')
  }

  console.log('\nConfigured tags — xo-web polls this every 5s, per non-admin')
  for (const [label, permissions] of passes.slice(0, 2)) {
    const t = time(tagPass(objects, permissions), iterations)
    row(label, t, serialize, 'per poll, per user (every 5s)')
  }

  console.log('\nConcurrent non-admins — the full pass is paid once per distinct user')
  const perUser = time(fullPass(objects, noAcl), iterations)
  for (const users of [1, 10, 50]) {
    console.log(
      `  ${`${users} user${users > 1 ? 's' : ''} signing in at once`.padEnd(38)} ${ms(perUser * users).padStart(10)}`
    )
  }
}

// ===================================================================

const scales = process.argv
  .slice(2)
  .filter(a => !a.startsWith('-'))
  .map(Number)
const iterations = 7

const readSys = path => {
  try {
    return readFileSync(path, 'utf8').trim()
  } catch {
    return undefined
  }
}

console.log('RBAC filtering cost — synthetic graph, lab proportions')
console.log(`median of ${iterations} runs, node ${process.version}`)
console.log(`cpu: ${cpus()[0]?.model ?? 'unknown'} (${cpus().length} logical)`)

const governor = readSys('/sys/devices/system/cpu/cpu0/cpufreq/scaling_governor')
if (governor !== undefined && governor !== 'performance') {
  console.log(`governor: ${governor} — timings are depressed and noisier; pin to 'performance' for stable absolutes`)
}

console.log(
  '\nAbsolute timings describe this machine only. The x column is the ratio\n' +
    'against a JSON.stringify of the same objects, which the server already\n' +
    'performs once per connection — that ratio is what carries to other hardware.'
)

for (const scale of scales.length !== 0 ? scales : [10000, 30000, 100000]) {
  benchmark(scale, iterations)
}

console.log('\nAdmins are never filtered: they return before any of this runs.\n')
/* eslint-enable no-console */
