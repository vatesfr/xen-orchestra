import assert from 'node:assert/strict'
import { once } from 'node:events'
import { Readable } from 'node:stream'

import { createLogger } from '@xen-orchestra/log'
import { readChunk, readChunkStrict } from '@vates/read-chunk'
import Esxi from '@xen-orchestra/vmware-explorer/esxi.mjs'

import { formatBytes } from './exportUtils.js'
import { waitUntil } from './index.js'

const log = createLogger('xo:qa-test:esxi-migration')

// =============================================================================
// CONFIGURATION
// =============================================================================

/**
 * Environment variables without which the ESXi migration tests cannot run at all.
 * @constant {ReadonlyArray<string>}
 */
export const REQUIRED_ESXI_ENV = ['ESXI_HOST', 'ESXI_USER', 'ESXI_PASSWORD', 'ESXI_VM_ID']

/**
 * Tells whether the ESXi migration tests can run.
 *
 * Returned in the shape node:test expects for its `skip` option, so the suite is skipped
 * with an actionable message rather than failing on an unconfigured environment.
 *
 * @returns {string|false} Skip reason, or false when everything needed is set
 */
export function getEsxiSkipReason() {
  const missing = REQUIRED_ESXI_ENV.filter(name => (process.env[name] ?? '') === '')
  return missing.length === 0 ? false : `ESXi migration tests need ${missing.join(', ')} to be set in .env`
}

/**
 * Reads the ESXi source configuration from the environment.
 *
 * Only call this once `getEsxiSkipReason()` returned false.
 *
 * @returns {{ host: string, user: string, password: string, vmId: string, sslVerify: boolean, timeout: number }}
 */
export function getEsxiConfig() {
  return {
    host: process.env.ESXI_HOST,
    user: process.env.ESXI_USER,
    password: process.env.ESXI_PASSWORD,
    vmId: process.env.ESXI_VM_ID,
    // lab ESXi hosts serve a self-signed certificate, so this defaults to off
    sslVerify: process.env.ESXI_SSL_VERIFY === 'true',
    timeout: millisecondsFromEnv('ESXI_TEST_TIMEOUT_MS', 4 * 3600_000),
    // how long the guest is given to boot and flush after the reset that churns its disk
    resetSettleMs: millisecondsFromEnv('ESXI_RESET_SETTLE_MS', 90_000),
  }
}

/**
 * Reads an optional environment variable, treating a blank value as unset.
 *
 * A key present but left empty in a .env file reads as an empty string, not undefined, so
 * `??` does not fall back to the default. That matters most for the numeric options:
 * `Number('')` is 0, which silently turns a timeout into "abort immediately".
 *
 * @param {string} name - Environment variable name
 * @returns {string|undefined} The value, or undefined when unset or empty
 */
export function optionalEnv(name) {
  const value = process.env[name]
  return value === undefined || value === '' ? undefined : value
}

/**
 * Reads an optional duration from the environment, in milliseconds.
 *
 * @param {string} name - Environment variable name
 * @param {number} fallback - Value to use when unset or empty
 * @returns {number} A positive, finite number of milliseconds
 * @throws {Error} If the variable is set to something that is not a positive number
 */
function millisecondsFromEnv(name, fallback) {
  const raw = optionalEnv(name)
  if (raw === undefined) {
    return fallback
  }

  const value = Number(raw)
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${name} must be a positive number of milliseconds, got ${JSON.stringify(raw)}`)
  }
  return value
}

/**
 * Waits for a VM's blocked operations to reach an expected state.
 *
 * XO's object cache is fed by XAPI events, so a field written during an API call is not
 * necessarily visible on the very next read — polling here rather than asserting once avoids
 * failing on that lag, while still failing if the value never changes.
 *
 * @param {import('../client/dispatchClient.js').DispatchClient} dispatchClient
 * @param {string} vmUuid - UUID of the VM
 * @param {{ blocked: boolean }} expected - Whether `start`/`start_on` must be blocked
 * @param {number} [timeout=30000] - How long to wait, in milliseconds
 * @returns {Promise<Object>} The VM record once it matches
 * @throws {Error} If the expected state is not reached in time
 */
export async function waitForBlockedOperations(dispatchClient, vmUuid, { blocked }, timeout = 30_000) {
  let lastSeen
  try {
    return await waitUntil(
      async () => {
        const vm = await dispatchClient.vm.details(vmUuid)
        lastSeen = vm.blockedOperations
        const isBlocked = lastSeen?.start !== undefined && lastSeen?.start_on !== undefined
        const isUnblocked = lastSeen?.start === undefined && lastSeen?.start_on === undefined
        return (blocked ? isBlocked : isUnblocked) ? vm : false
      },
      1000,
      timeout
    )
  } catch (cause) {
    const error = new Error(
      `VM ${vmUuid} should have had start and start_on ${blocked ? 'blocked' : 'unblocked'} within ${timeout} ms, ` +
        `last seen blockedOperations: ${JSON.stringify(lastSeen)}`
    )
    error.cause = cause
    throw error
  }
}

// =============================================================================
// ESXI SOURCE INSPECTION
// =============================================================================

/**
 * Opens a connection to the source ESXi host.
 *
 * Used to assert the state of the *source* VM, which XO's API does not expose in full
 * (`esxi.listVms` reports the power state but not the snapshots).
 *
 * @param {{ host: string, user: string, password: string, sslVerify: boolean }} config
 * @returns {Promise<Esxi>} A connected client
 */
export async function connectToEsxi({ host, user, password, sslVerify }) {
  const esxi = new Esxi(host, user, password, sslVerify)
  try {
    await once(esxi, 'ready')
  } catch (cause) {
    const error = new Error(
      `could not connect to ESXi ${host} as ${user}: ${cause.message}. Check ESXI_HOST, ESXI_USER and ` +
        `ESXI_PASSWORD — in .env a value containing # or a trailing space must be wrapped in double quotes`
    )
    error.cause = cause
    throw error
  }
  log.debug('Connected to ESXi', { host })
  return esxi
}

/**
 * Asserts the source VM is in the state the migration scenario starts from: running, and
 * without any snapshot so that XO has to take its own.
 *
 * @param {Esxi} esxi - Connected ESXi client
 * @param {string} vmId - ESXi VM id (the numeric MoRef, e.g. '34')
 * @returns {Promise<Object>} The source VM metadata
 * @throws {assert.AssertionError} If the VM is halted or already has a snapshot
 */
export async function assertSourceIsRunningWithoutSnapshot(esxi, vmId) {
  const metadata = await esxi.getTransferableVmMetadata(vmId)
  logSourceState(metadata, 'before the first migration')

  assert.notEqual(
    metadata.powerState,
    'poweredOff',
    `source VM ${vmId} (${metadata.name_label}) must be running: the scenario migrates a live VM`
  )
  assert.equal(
    metadata.snapshots?.current,
    undefined,
    `source VM ${vmId} (${metadata.name_label}) must have no snapshot so that XO takes its own — ` +
      `remove its snapshots on the ESXi side before running this test`
  )

  return metadata
}

/**
 * Reboots the guest of the source VM so it writes to its active disk, and waits for those
 * writes to land.
 *
 * A hard reset is used rather than a powerOff/powerOn pair on purpose: the latter closes the
 * vmdk files, which makes VMware rewrite the delta's CID. That would hide the very situation
 * this suite exists to cover — a delta still carrying its parent's CID.
 *
 * How much a boot writes is guest dependent, hence the settle delay rather than a byte
 * target; nothing here asserts a minimum, the caller reports what was actually transferred.
 *
 * @param {Esxi} esxi - Connected ESXi client
 * @param {string} vmId - ESXi VM id, must be powered on
 * @param {{ settleMs: number }} options - How long to let the guest boot and flush
 */
export async function churnSourceByReset(esxi, vmId, { settleMs }) {
  log.debug('Resetting the source VM to make its guest write', { vmId, settleMs })
  await esxi.reset(vmId)
  await new Promise(resolve => setTimeout(resolve, settleMs))
  log.debug('Source VM had time to boot and flush', { vmId })
}

/**
 * Waits until the source VM has a current snapshot.
 *
 * Used to know when XO has taken its snapshot during a migration: from that point on
 * everything the guest writes lands in the active disk, which is what the delta pass moves.
 *
 * @param {Esxi} esxi - Connected ESXi client
 * @param {string} vmId - ESXi VM id
 * @param {number} [timeout=120000] - How long to wait, in milliseconds
 * @returns {Promise<string>} uid of the current snapshot
 */
export async function waitForSourceSnapshot(esxi, vmId, timeout = 120_000) {
  const uid = await waitUntil(
    async () => {
      const { snapshots } = await esxi.getTransferableVmMetadata(vmId)
      return snapshots?.current ?? false
    },
    2000,
    timeout
  )
  log.debug('Source VM has been snapshotted by XO', { vmId, snapshotUid: uid })
  return uid
}

/**
 * Brings the source VM back to the state the scenarios start from: running, without any
 * snapshot.
 *
 * The snapshots are removed while the VM is halted so the consolidation does not compete with
 * a live guest. Note `#waitForTaskEnd` gives a task 60 s, so a very large delta to consolidate
 * would time out.
 *
 * @param {Esxi} esxi - Connected ESXi client
 * @param {string} vmId - ESXi VM id
 * @returns {Promise<void>}
 */
export async function resetSourceState(esxi, vmId) {
  const { powerState, snapshots } = await esxi.getTransferableVmMetadata(vmId)

  if (snapshots?.current !== undefined) {
    log.debug('Removing the snapshots left on the source VM', { vmId, current: snapshots.current })
    await esxi.removeAllSnapshots(vmId)
  }

  if (powerState === 'poweredOff') {
    log.debug('Starting the source VM back up', { vmId })
    await esxi.powerOn(vmId)
    await waitUntil(async () => (await esxi.getTransferableVmMetadata(vmId)).powerState !== 'poweredOff', 2000, 120_000)
  }

  log.debug('Source VM is back to its initial state', { vmId })
}

/**
 * Records the state of the source VM: power state, snapshots, and the identity of every disk
 * of every chain.
 *
 * `uid` is the vmdk CID and `parentId` its parentCID. VMware creates a snapshot delta with
 * `CID = parentCID` and only rewrites it once the disk is closed, so seeing a delta whose
 * `uid` equals its `parentId` — and equals its parent's `uid` — is expected right after XO
 * snapshots the source. It is also the state that used to make the delta look already
 * imported, so it is worth having in the log whenever a comparison fails later on.
 *
 * @param {Object} metadata - Result of `getTransferableVmMetadata`
 * @param {string} label - When this snapshot of the state was taken
 */
export function logSourceState(metadata, label) {
  const describeDisk = (disk, snapshotUid) => ({
    snapshotUid,
    node: disk.node,
    diskPath: disk.diskPath,
    uid: disk.uid,
    parentId: disk.parentId,
    isFull: disk.isFull,
    vmdkFormat: disk.vmdkFormat,
    capacity: disk.capacity !== undefined ? formatBytes(disk.capacity) : undefined,
  })

  const snapshots = metadata.snapshots?.snapshots ?? []

  // the disks are listed flat rather than nested under their snapshot: logSetup.js inspects
  // at depth 3, and nesting them would print the interesting part as `[Object]`
  log.debug(`Source VM state ${label}`, {
    name: metadata.name_label,
    powerState: metadata.powerState,
    currentSnapshot: metadata.snapshots?.current,
    snapshots: snapshots.map(({ uid, parent, displayName, numDisks }) => ({
      uid,
      parent,
      displayName,
      numDisks,
    })),
    snapshotDisks: snapshots.flatMap(snapshot => (snapshot.disks ?? []).map(disk => describeDisk(disk, snapshot.uid))),
    activeDisks: metadata.disks.map(disk => describeDisk(disk, undefined)),
  })
}

/**
 * Fetches and logs the current state of the source VM.
 *
 * @param {Esxi} esxi - Connected ESXi client
 * @param {string} vmId - ESXi VM id
 * @param {string} label - When this snapshot of the state was taken
 * @returns {Promise<Object>} The source VM metadata
 */
export async function getAndLogSourceState(esxi, vmId, label) {
  const metadata = await esxi.getTransferableVmMetadata(vmId)
  logSourceState(metadata, label)
  return metadata
}

// =============================================================================
// TRANSFER ACCOUNTING
// =============================================================================

/**
 * Parses the transfer report XO appends to a VDI's description on every import pass.
 *
 * importDiskChain() writes one line per transfer, ending with the disk of the chain it
 * started from — `base` for a full import, `snapshot` for a delta on top of a previous
 * one. That makes it the only *persisted* record of what each migration actually moved.
 *
 * @param {string} [nameDescription] - `name_description` of the VDI
 * @returns {Array<{ megabytes: number, seconds: number, from: 'base' | 'snapshot' }>} One entry per transfer, oldest first
 */
export function parseTransferReports(nameDescription = '') {
  const reports = []
  const regex = /([\d.]+) MB in (\d+) s \([^)]*\) from\s+(base|snapshot)/g

  let match
  while ((match = regex.exec(nameDescription)) !== null) {
    reports.push({ megabytes: Number(match[1]), seconds: Number(match[2]), from: match[3] })
  }
  return reports
}

/**
 * Asserts a VDI was imported by exactly the expected sequence of transfers.
 *
 * @param {{ uuid: string, name_description: string }} vdi - VDI record
 * @param {ReadonlyArray<'base' | 'snapshot'>} expected - Expected origins, oldest transfer first
 * @throws {assert.AssertionError} If the sequence does not match
 */
export function assertTransferSequence(vdi, expected) {
  const reports = parseTransferReports(vdi.name_description)

  log.debug('Transfers reported by the VDI', {
    vdi: vdi.uuid,
    expected: [...expected],
    reports,
    nameDescription: vdi.name_description,
  })

  assert.deepEqual(
    reports.map(({ from }) => from),
    [...expected],
    `VDI ${vdi.uuid} should have been imported by ${expected.length} transfer(s) (${expected.join(' then ')}), ` +
      `its description reads: ${JSON.stringify(vdi.name_description)}`
  )
  return reports
}

// =============================================================================
// DISK INTROSPECTION
// =============================================================================

/**
 * Lists the disks of a VM, ordered by their position on the bus.
 *
 * The VDI name is not usable to pair the disks of two separately migrated VMs — it is
 * derived from the vmdk extent that was read, which differs between a base import and a
 * whole-chain import — so the bus position is what makes the pairing meaningful.
 *
 * @param {import('../client/dispatchClient.js').DispatchClient} dispatchClient
 * @param {string} vmUuid - UUID of the VM
 * @returns {Promise<Array<{ uuid: string, name_label: string, name_description: string, size: number, other_config: Record<string, string>, position: number, device: string }>>}
 */
export async function getOrderedDisks(dispatchClient, vmUuid) {
  const { restApiClient } = dispatchClient
  const vm = await dispatchClient.vm.details(vmUuid)

  const vbds = await Promise.all(
    (vm.$VBDs ?? []).map(vbdId => restApiClient.get(`/rest/v0/vbds/${vbdId}?fields=device,position,is_cd_drive,VDI`))
  )

  const disks = []
  for (const vbd of vbds) {
    if (vbd.is_cd_drive || vbd.VDI === undefined || vbd.VDI === null) {
      continue
    }
    const vdi = await restApiClient.get(
      `/rest/v0/vdis/${vbd.VDI}?fields=uuid,name_label,name_description,size,other_config`
    )
    disks.push({ ...vdi, position: Number(vbd.position), device: vbd.device })
  }

  disks.sort((a, b) => a.position - b.position)

  log.debug('Disks of the migrated VM', {
    vm: vmUuid,
    disks: disks.map(disk => ({
      device: disk.device,
      position: disk.position,
      vdi: disk.uuid,
      nameLabel: disk.name_label,
      size: formatBytes(disk.size),
      // which source disk XO considers this VDI to hold — the reference the next pass
      // resumes from
      esxiDiskPath: disk.other_config?.esxi_diskPath,
      esxiUuid: disk.other_config?.esxi_uuid,
    })),
  })

  return disks
}

// =============================================================================
// RAW EXPORT COMPARISON
// =============================================================================

/**
 * Opens the raw (flat) export of a VDI as a Node stream.
 *
 * @param {import('../client/restApiClient.js').RestApiClient} restApiClient
 * @param {string} vdiUuid - UUID of the VDI to export
 * @param {{ timeout: number }} options
 * @returns {Promise<Readable>} The response body
 * @throws {Error} If the export request is rejected
 */
async function openRawExport(restApiClient, vdiUuid, { timeout }) {
  const response = await fetch(`${restApiClient.baseUrl}/rest/v0/vdis/${vdiUuid}.raw`, {
    method: 'GET',
    headers: restApiClient.headers,
    signal: AbortSignal.timeout(timeout),
  })

  if (!response.ok) {
    const error = new Error(`raw export of VDI ${vdiUuid} failed: HTTP ${response.status} - ${response.statusText}`)
    error.code = 'RAW_EXPORT_HTTP_ERROR'
    error.cause = new Error(await response.text())
    throw error
  }

  return Readable.fromWeb(response.body)
}

/**
 * Offset of the first byte that differs between two buffers.
 * @private
 */
function firstDifferingByte(a, b) {
  const length = Math.min(a.length, b.length)
  for (let i = 0; i < length; i++) {
    if (a[i] !== b[i]) {
      return i
    }
  }
  return length
}

/**
 * Asserts that two VDIs export byte for byte identical raw content.
 *
 * Both exports are streamed and compared chunk by chunk — nothing is written to disk, so
 * this works on disks far larger than the runner's storage. The two reads are issued
 * concurrently so neither HTTP response sits idle while the other is being consumed.
 *
 * @param {import('../client/restApiClient.js').RestApiClient} restApiClient
 * @param {Object} options
 * @param {string} options.referenceVdi - UUID of the VDI taken as reference
 * @param {string} options.candidateVdi - UUID of the VDI to check against it
 * @param {number} options.size - Virtual size of both VDIs, in bytes
 * @param {number} [options.chunkSize=4194304] - Comparison granularity
 * @param {number} [options.timeout] - Per-request timeout in milliseconds
 * @throws {assert.AssertionError} If the contents differ, with the offset of the first difference
 */
export async function assertRawExportsAreIdentical(
  restApiClient,
  { referenceVdi, candidateVdi, size, chunkSize = 4 * 1024 * 1024, timeout = 4 * 3600_000 }
) {
  log.debug('Comparing raw exports', {
    referenceVdi,
    candidateVdi,
    size: formatBytes(size),
    chunkSize: formatBytes(chunkSize),
    timeoutMinutes: Math.round(timeout / 60_000),
  })

  const [reference, candidate] = await Promise.all([
    openRawExport(restApiClient, referenceVdi, { timeout }),
    openRawExport(restApiClient, candidateVdi, { timeout }),
  ])

  const startTime = Date.now()
  try {
    let offset = 0
    let nextProgressLog = 1024 * 1024 * 1024

    while (offset < size) {
      const length = Math.min(chunkSize, size - offset)

      // readChunkStrict so that a stream ending early fails here, instead of being read as
      // a difference in content
      const [referenceChunk, candidateChunk] = await Promise.all([
        readChunkStrict(reference, length),
        readChunkStrict(candidate, length),
      ])

      if (!referenceChunk.equals(candidateChunk)) {
        assert.fail(
          `raw exports differ at byte ${offset + firstDifferingByte(referenceChunk, candidateChunk)} of ${size}: ` +
            `reference VDI ${referenceVdi}, candidate VDI ${candidateVdi}`
        )
      }

      offset += length
      if (offset >= nextProgressLog) {
        const elapsedSeconds = (Date.now() - startTime) / 1000
        log.debug('Raw exports identical so far', {
          compared: formatBytes(offset),
          total: formatBytes(size),
          percent: Math.round((offset / size) * 100),
          throughput: `${formatBytes(offset / elapsedSeconds)}/s`,
          elapsedSeconds: Math.round(elapsedSeconds),
        })
        nextProgressLog += 1024 * 1024 * 1024
      }
    }

    const [referenceTail, candidateTail] = await Promise.all([readChunk(reference), readChunk(candidate)])
    assert.equal(referenceTail, null, `reference VDI ${referenceVdi} exported more than its ${size} bytes`)
    assert.equal(candidateTail, null, `candidate VDI ${candidateVdi} exported more than its ${size} bytes`)

    log.debug('Raw exports are identical', {
      size: formatBytes(size),
      durationSeconds: Math.round((Date.now() - startTime) / 1000),
    })
  } finally {
    reference.destroy()
    candidate.destroy()
  }
}
