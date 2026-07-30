/**
 * Bit-to-bit comparison of VM disks.
 *
 * Used to validate that what a backup restores is byte for byte what was captured, which a
 * health check cannot prove: a health check only boots the restored VM, so it exercises the
 * blocks on the boot path and nothing else. A block list that drops, duplicates or misplaces
 * data outside that path passes a health check and fails here.
 *
 * Both sides are streamed as raw exports and compared chunk by chunk — nothing is written to
 * disk, so this works on disks far larger than the runner's storage.
 */

import assert from 'node:assert/strict'
import { Readable } from 'node:stream'

import { createLogger } from '@xen-orchestra/log'
import { readChunk, readChunkStrict } from '@vates/read-chunk'

import { formatBytes } from './exportUtils.js'

const log = createLogger('xo:qa-test:disk-comparison')

const DEFAULT_CHUNK_SIZE = 4 * 1024 * 1024
const DEFAULT_TIMEOUT = 4 * 3600_000
const PROGRESS_LOG_INTERVAL = 1024 * 1024 * 1024

/**
 * XAPI invariant: the VBDs of a VM point at VDIs, those of a VM-snapshot at VDI-snapshots.
 * These are two distinct REST collections, each with its own `.raw` export route, so the kind
 * of the parent object decides where its disks must be read from.
 */
const VDI_COLLECTION_BY_PARENT = {
  vms: 'vdis',
  'vm-snapshots': 'vdi-snapshots',
}

const EXPECTED_VDI_TYPE = {
  vdis: 'VDI',
  'vdi-snapshots': 'VDI-snapshot',
}

/**
 * @typedef {Object} ComparableDisk
 * @property {string} uuid - UUID of the VDI or VDI-snapshot
 * @property {string} collection - REST collection to export it from (`vdis` / `vdi-snapshots`)
 * @property {string} name_label
 * @property {number} size - Virtual size in bytes
 * @property {number} position - Position on the VBD bus
 * @property {string} device - Device name (`xvda`, …)
 */

/**
 * Lists the user disks of a VM or of a VM-snapshot, ordered by their position on the bus.
 *
 * Bus position is what makes two disk sets comparable: the VDI name of a restored VM is
 * rewritten by the restore, so only the position pairs a restored disk with the snapshot disk
 * it came from.
 *
 * The VBDs are walked sequentially — the loop is bounded by the number of disks of a single VM,
 * so there is nothing to fan out here.
 *
 * @param {import('../client/dispatchClient.js').DispatchClient} dispatchClient
 * @param {string} uuid - UUID of the VM or VM-snapshot
 * @param {Object} options
 * @param {'vms'|'vm-snapshots'} options.collection - Which kind of object `uuid` refers to
 * @returns {Promise<ComparableDisk[]>} Disks ordered by bus position
 * @throws {Error} If `collection` is unsupported or a disk is not of the expected type
 */
export async function getOrderedDisks(dispatchClient, uuid, { collection }) {
  const vdiCollection = VDI_COLLECTION_BY_PARENT[collection]
  if (vdiCollection === undefined) {
    throw new Error(
      `unsupported collection "${collection}", expected one of ${Object.keys(VDI_COLLECTION_BY_PARENT).join(', ')}`
    )
  }

  const { restApiClient } = dispatchClient
  const parent = await restApiClient.get(`/rest/v0/${collection}/${uuid}?fields=uuid,name_label,$VBDs`)

  const disks = []
  for (const vbdId of parent.$VBDs ?? []) {
    const vbd = await restApiClient.get(`/rest/v0/vbds/${vbdId}?fields=device,position,is_cd_drive,VDI`)
    if (vbd.is_cd_drive || vbd.VDI === undefined || vbd.VDI === null) {
      continue
    }

    const vdi = await restApiClient.get(
      `/rest/v0/${vdiCollection}/${vbd.VDI}?fields=uuid,name_label,size,VDI_type,type`
    )

    // Skip suspend/metadata VDIs: they are not part of the guest's data and are not restored
    // as disks, so comparing them would be meaningless.
    if (vdi.VDI_type !== 'user') {
      continue
    }

    const expectedType = EXPECTED_VDI_TYPE[vdiCollection]
    if (vdi.type !== expectedType) {
      throw new Error(
        `${collection}/${uuid} disk ${vbd.device} resolved to a "${vdi.type}", expected a "${expectedType}" — ` +
          `it cannot be exported from the ${vdiCollection} collection`
      )
    }

    disks.push({
      uuid: vdi.uuid,
      collection: vdiCollection,
      name_label: vdi.name_label,
      size: vdi.size,
      position: Number(vbd.position),
      device: vbd.device,
    })
  }

  disks.sort((a, b) => a.position - b.position)

  log.debug('Disks to compare', {
    parent: `${collection}/${uuid}`,
    name: parent.name_label,
    disks: disks.map(disk => ({ device: disk.device, vdi: disk.uuid, size: formatBytes(disk.size) })),
  })

  return disks
}

/**
 * Returns the most recent snapshot of a VM, or `undefined` if it has none.
 *
 * A `delta` backup job always keeps its latest snapshot to compute the next delta from
 * (see `_removeUnusedSnapshots` in @xen-orchestra/backups), so after a run this snapshot is
 * exactly the VM state that run captured — which makes it the reference to compare a restore
 * against.
 *
 * @param {import('../client/dispatchClient.js').DispatchClient} dispatchClient
 * @param {string} vmUuid
 * @returns {Promise<{uuid: string, name_label: string, snapshot_time: number}|undefined>}
 */
export async function getLastVmSnapshot(dispatchClient, vmUuid) {
  const { restApiClient } = dispatchClient
  const vm = await restApiClient.get(`/rest/v0/vms/${vmUuid}?fields=uuid,name_label,snapshots`)

  const snapshotIds = vm.snapshots ?? []
  if (snapshotIds.length === 0) {
    return undefined
  }

  const snapshots = []
  for (const snapshotId of snapshotIds) {
    snapshots.push(await restApiClient.get(`/rest/v0/vm-snapshots/${snapshotId}?fields=uuid,name_label,snapshot_time`))
  }

  snapshots.sort((a, b) => a.snapshot_time - b.snapshot_time)
  const last = snapshots.at(-1)

  log.debug('Last snapshot of the VM', {
    vm: vmUuid,
    snapshot: last.uuid,
    name: last.name_label,
    total: snapshots.length,
  })

  return last
}

/**
 * Opens the raw (flat) export of a VDI or VDI-snapshot as a Node stream.
 *
 * @param {import('../client/restApiClient.js').RestApiClient} restApiClient
 * @param {Object} disk
 * @param {string} disk.uuid
 * @param {string} disk.collection - `vdis` or `vdi-snapshots`
 * @param {number} timeout - Request timeout in milliseconds
 * @returns {Promise<Readable>} The response body
 * @throws {Error} If the export request is rejected
 * @private
 */
async function openRawExport(restApiClient, { uuid, collection }, timeout) {
  const response = await fetch(`${restApiClient.baseUrl}/rest/v0/${collection}/${uuid}.raw`, {
    method: 'GET',
    headers: restApiClient.headers,
    signal: AbortSignal.timeout(timeout),
  })

  if (!response.ok) {
    const error = new Error(
      `raw export of ${collection}/${uuid} failed: HTTP ${response.status} - ${response.statusText}`
    )
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
 * Asserts that two disks export byte for byte identical raw content.
 *
 * The two reads are issued concurrently so neither HTTP response sits idle while the other is
 * being consumed.
 *
 * @param {import('../client/restApiClient.js').RestApiClient} restApiClient
 * @param {Object} options
 * @param {ComparableDisk & {label?: string}} options.reference - Disk taken as reference
 * @param {ComparableDisk & {label?: string}} options.candidate - Disk to check against it
 * @param {number} options.size - Virtual size of both disks, in bytes
 * @param {number} [options.chunkSize=4194304] - Comparison granularity
 * @param {number} [options.timeout] - Per-request timeout in milliseconds
 * @throws {assert.AssertionError} If the contents differ, with the offset of the first difference
 */
export async function assertRawExportsAreIdentical(
  restApiClient,
  { reference, candidate, size, chunkSize = DEFAULT_CHUNK_SIZE, timeout = DEFAULT_TIMEOUT }
) {
  const referenceLabel = reference.label ?? `${reference.collection}/${reference.uuid}`
  const candidateLabel = candidate.label ?? `${candidate.collection}/${candidate.uuid}`

  log.debug('Comparing raw exports', {
    reference: referenceLabel,
    candidate: candidateLabel,
    size: formatBytes(size),
    chunkSize: formatBytes(chunkSize),
    timeoutMinutes: Math.round(timeout / 60_000),
  })

  const [referenceStream, candidateStream] = await Promise.all([
    openRawExport(restApiClient, reference, timeout),
    openRawExport(restApiClient, candidate, timeout),
  ])

  const startTime = Date.now()
  try {
    let offset = 0
    let nextProgressLog = PROGRESS_LOG_INTERVAL

    while (offset < size) {
      const length = Math.min(chunkSize, size - offset)

      // readChunkStrict so that a stream ending early fails here, instead of being read as
      // a difference in content
      const [referenceChunk, candidateChunk] = await Promise.all([
        readChunkStrict(referenceStream, length),
        readChunkStrict(candidateStream, length),
      ])

      if (!referenceChunk.equals(candidateChunk)) {
        assert.fail(
          `raw exports differ at byte ${offset + firstDifferingByte(referenceChunk, candidateChunk)} of ${size}: ` +
            `reference ${referenceLabel} (${reference.collection}/${reference.uuid}), ` +
            `candidate ${candidateLabel} (${candidate.collection}/${candidate.uuid})`
        )
      }

      offset += length
      if (offset >= nextProgressLog) {
        const elapsedSeconds = (Date.now() - startTime) / 1000
        log.debug('Raw exports identical so far', {
          reference: referenceLabel,
          compared: formatBytes(offset),
          total: formatBytes(size),
          percent: Math.round((offset / size) * 100),
          throughput: `${formatBytes(offset / elapsedSeconds)}/s`,
          elapsedSeconds: Math.round(elapsedSeconds),
        })
        nextProgressLog += PROGRESS_LOG_INTERVAL
      }
    }

    const [referenceTail, candidateTail] = await Promise.all([readChunk(referenceStream), readChunk(candidateStream)])
    assert.equal(referenceTail, null, `reference ${referenceLabel} exported more than its ${size} bytes`)
    assert.equal(candidateTail, null, `candidate ${candidateLabel} exported more than its ${size} bytes`)

    log.debug('Raw exports are identical', {
      reference: referenceLabel,
      candidate: candidateLabel,
      size: formatBytes(size),
      durationSeconds: Math.round((Date.now() - startTime) / 1000),
    })
  } finally {
    referenceStream.destroy()
    candidateStream.destroy()
  }
}

/**
 * Asserts that every disk of a VM is byte for byte identical to the corresponding disk of a
 * VM-snapshot.
 *
 * Disks are paired by their position on the VBD bus, and compared one after the other so that
 * two full raw exports at most are in flight at any time.
 *
 * Both sides must be stable for the comparison to be meaningful: a snapshot is read-only, and
 * the VM is expected to be halted. Callers are responsible for that.
 *
 * @param {import('../client/dispatchClient.js').DispatchClient} dispatchClient
 * @param {Object} options
 * @param {string} options.vmUuid - VM whose disks are checked (the candidate)
 * @param {string} options.snapshotUuid - VM-snapshot holding the expected content (the reference)
 * @param {number} [options.chunkSize] - Comparison granularity
 * @param {number} [options.timeout] - Per-request timeout in milliseconds
 * @returns {Promise<number>} Number of disks compared
 * @throws {assert.AssertionError} If the disk sets do not match, or any content differs
 */
export async function assertVmDisksMatchVmSnapshot(dispatchClient, { vmUuid, snapshotUuid, chunkSize, timeout }) {
  const [referenceDisks, candidateDisks] = await Promise.all([
    getOrderedDisks(dispatchClient, snapshotUuid, { collection: 'vm-snapshots' }),
    getOrderedDisks(dispatchClient, vmUuid, { collection: 'vms' }),
  ])

  assert.notEqual(referenceDisks.length, 0, `snapshot ${snapshotUuid} exposes no user disk to compare against`)
  assert.equal(
    candidateDisks.length,
    referenceDisks.length,
    `VM ${vmUuid} has ${candidateDisks.length} disk(s) but snapshot ${snapshotUuid} has ${referenceDisks.length}`
  )

  for (const [index, reference] of referenceDisks.entries()) {
    const candidate = candidateDisks[index]

    // Strict on purpose: a restore that does not give the disk back at its exact original size is
    // a defect worth looking at. The one benign cause to rule out first is VHD alignment — a VHD
    // holds a multiple of 2 MiB, so a source disk that is not 2 MiB-aligned can come back rounded
    // up. If that is what happened, the sizes differ by less than 2 MiB.
    assert.equal(
      candidate.size,
      reference.size,
      `disk ${index} (${candidate.device}) is ${candidate.size} bytes on VM ${vmUuid} but ` +
        `${reference.size} bytes on snapshot ${snapshotUuid} ` +
        `(delta of ${candidate.size - reference.size} bytes)`
    )

    await assertRawExportsAreIdentical(dispatchClient.restApiClient, {
      reference: { ...reference, label: `snapshot ${reference.device}` },
      candidate: { ...candidate, label: `restored ${candidate.device}` },
      size: reference.size,
      chunkSize,
      timeout,
    })
  }

  return referenceDisks.length
}
