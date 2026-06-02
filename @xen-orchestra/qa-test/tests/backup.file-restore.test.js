import assert from 'node:assert'
import { after, before, describe, it } from 'node:test'
import { createLogger } from '@xen-orchestra/log'

import { backupConfig } from '../backup.config.js'
import { generateBackupJobName, getDefaultSchedule, getScheduleKey } from '../utils/index.js'
import { assertBackupSuccess } from '../utils/backupUtils.js'
import { setup, teardown } from './setup.js'

const log = createLogger('qa:backup:file-restore')

// Magic bytes for archive format validation
const TGZ_MAGIC = [0x1f, 0x8b]
const ZIP_MAGIC = [0x50, 0x4b]

describe('Incremental backup file restore', () => {
  let dispatchClient
  let restApiClient
  let tracker
  let vm
  let backupRepository

  /** @type {import('@vates/types').XoVmBackupArchive} */
  let incrementalBackup

  before(async () => {
    ;({ dispatchClient, tracker, vm, backupRepository } = await setup())
    restApiClient = dispatchClient.restApiClient

    const name = generateBackupJobName()
    const schedule = getDefaultSchedule()
    const config = backupConfig(name, schedule, vm, backupRepository)
    config.mode = 'delta'

    const backupJobId = await dispatchClient.backup.createBackupJob(config)
    const backupJob = await dispatchClient.backup.details(backupJobId)

    tracker.trackResource('backupJob', backupJobId, { name, mode: 'delta' })
    const scheduleKey = getScheduleKey(backupJob)
    if (scheduleKey) {
      tracker.trackResource('schedule', scheduleKey, { name, backupJobId })
    }
    assert(scheduleKey, 'Schedule key is required for file restore tests')

    // First run → full backup (base), second run → delta (incremental)
    for (let i = 0; i < 2; i++) {
      const result = await dispatchClient.backup.runJobAndGetLog(backupJobId, scheduleKey)
      assertBackupSuccess(result, `Backup run ${i + 1}/2`)
      log.debug(`Completed backup run ${i + 1}/2`, { status: result.status })
    }

    // Discover the incremental backup via REST API
    const allArchives = await restApiClient.getObjects('/rest/v0/backup-archives', {
      additionalParams: { 'backup-repository': backupRepository.id },
    })

    const vmArchives = allArchives.filter(a => a.vm?.uuid === vm.uuid).sort((a, b) => a.timestamp - b.timestamp)

    assert(vmArchives.length >= 2, `Expected at least 2 backups via REST API, got ${vmArchives.length}`)
    incrementalBackup = vmArchives[vmArchives.length - 1]

    assert.strictEqual(incrementalBackup.mode, 'delta', 'Latest backup should be a delta')
    assert(incrementalBackup.disks.length > 0, 'Archive should have at least one disk')

    log.debug('Selected incremental backup', {
      id: incrementalBackup.id,
      diskCount: incrementalBackup.disks.length,
      timestamp: new Date(incrementalBackup.timestamp).toISOString(),
    })
  })

  after(async () => {
    await teardown(dispatchClient, tracker)
  })

  it('should list disks, partitions, and files, then download as tgz and zip via REST API', async () => {
    const encodedId = encodeURIComponent(incrementalBackup.id)
    const archiveBase = `/rest/v0/backup-archives/${encodedId}`

    // List disks
    const disks = await restApiClient.get(`${archiveBase}/disks`)
    assert(Array.isArray(disks) && disks.length > 0, 'GET /disks should return at least one disk')
    assert.deepStrictEqual(
      disks.map(d => d.id).sort(),
      incrementalBackup.disks.map(d => d.id).sort(),
      'Disk IDs from REST API should match archive metadata'
    )

    log.debug('Disks listed via REST API', { count: disks.length })

    for (const disk of incrementalBackup.disks) {
      const encodedDiskId = encodeURIComponent(disk.id)
      const diskBase = `${archiveBase}/disks/${encodedDiskId}`

      // List partitions
      const partitions = await restApiClient.get(`${diskBase}/partitions`)
      assert(Array.isArray(partitions), `GET /partitions should return an array for disk ${disk.id}`)
      log.debug('Partitions listed via REST API', { diskId: disk.id, count: partitions.length })

      // When there are no partitions, treat the disk as a bare (unpartitioned) volume
      const targets = partitions.length > 0 ? partitions : [{ id: undefined }]

      for (const partition of targets) {
        const partitionId = partition.id
        let fileEntries

        try {
          if (partitionId !== undefined) {
            const encodedPartId = encodeURIComponent(partitionId)
            fileEntries = await restApiClient.get(`${diskBase}/partitions/${encodedPartId}/files?path=/`)
          } else {
            fileEntries = await restApiClient.get(`${diskBase}/files?path=/`)
          }
        } catch (err) {
          // Some partitions (swap, EFI) cannot be mounted — skip gracefully
          log.warn('Could not list files via REST API, skipping partition', {
            diskId: disk.id,
            partitionId,
            error: err.message,
          })
          continue
        }

        assert(
          Array.isArray(fileEntries),
          `File listing should return an array for disk ${disk.id} / partition ${partitionId}`
        )

        const files = fileEntries.filter(e => e.isFile)
        if (files.length === 0) {
          log.debug('No files at partition root, skipping download test', { diskId: disk.id, partitionId })
          continue
        }

        const paths = files.slice(0, 2).map(f => `/${f.name}`)
        log.debug('Testing file download via REST API', { diskId: disk.id, partitionId, paths })

        for (const format of ['tgz', 'zip']) {
          await assertRestDownload(restApiClient, { encodedId, encodedDiskId, partitionId, paths, format })
        }
      }
    }
  })

  it('should browse and download individual files via WebDAV (PROPFIND, GET, Range GET)', async () => {
    const encodedId = encodeURIComponent(incrementalBackup.id)
    // Strip Content-Type — not appropriate for WebDAV / binary requests
    const authHeaders = Object.fromEntries(
      Object.entries(restApiClient.headers).filter(([k]) => k.toLowerCase() !== 'content-type')
    )

    for (const disk of incrementalBackup.disks) {
      const encodedDiskId = encodeURIComponent(disk.id)
      const davDiskUrl = `${restApiClient.baseUrl}/rest/v0/backup-archives/${encodedId}/dav/${encodedDiskId}`

      // ── PROPFIND at disk level ────────────────────────────────────────────
      const diskPropfind = await fetch(`${davDiskUrl}/`, {
        method: 'PROPFIND',
        headers: { ...authHeaders, Depth: '1' },
        signal: AbortSignal.timeout(60_000),
      })
      assert.strictEqual(diskPropfind.status, 207, `PROPFIND at disk level should return 207 for disk ${disk.id}`)
      const diskXml = await diskPropfind.text()
      assert(diskXml.includes('<D:multistatus'), 'PROPFIND response must be WebDAV XML')
      log.debug('PROPFIND at disk level succeeded', { diskId: disk.id })

      // At disk level, all children are directories: real partitions or the synthetic "_bare_" dir.
      // PROPFIND into each child directory until we find file hrefs.
      const diskDirHrefs = [...diskXml.matchAll(/<D:href>([^<]+)<\/D:href>/g)]
        .map(m => m[1])
        .filter(h => h.endsWith('/') && !h.endsWith(`/${encodedDiskId}/`))

      let partitionRootHrefs = []

      for (const partDir of diskDirHrefs) {
        const partUrl = `${restApiClient.baseUrl}${partDir}`
        let partPropfind
        try {
          partPropfind = await fetch(partUrl, {
            method: 'PROPFIND',
            headers: { ...authHeaders, Depth: '1' },
            signal: AbortSignal.timeout(60_000),
          })
        } catch {
          continue
        }

        if (partPropfind.status !== 207) {
          await partPropfind.body?.cancel()
          continue
        }

        const partXml = await partPropfind.text()
        log.debug('PROPFIND into partition/bare dir succeeded', { partDir })

        const partHrefs = [...partXml.matchAll(/<D:href>([^<]+)<\/D:href>/g)].map(m => m[1])
        partitionRootHrefs = partHrefs.filter(h => !h.endsWith('/') && !partDir.endsWith(h + '/'))

        if (partitionRootHrefs.length > 0) break
      }

      if (partitionRootHrefs.length === 0) {
        log.debug('No files found via WebDAV, skipping file GET tests for this disk', { diskId: disk.id })
        continue
      }

      const fileHref = partitionRootHrefs[0]
      const fileUrl = `${restApiClient.baseUrl}${fileHref}`

      // ── HEAD ─────────────────────────────────────────────────────────────
      const headRes = await fetch(fileUrl, {
        method: 'HEAD',
        headers: authHeaders,
        signal: AbortSignal.timeout(30_000),
      })
      assert(headRes.ok, `HEAD ${fileHref} should succeed (got ${headRes.status})`)
      assert.strictEqual(headRes.headers.get('accept-ranges'), 'bytes', 'Server must advertise byte-range support')
      const contentLength = Number(headRes.headers.get('content-length') ?? '0')
      assert(contentLength > 0, `HEAD Content-Length should be > 0 (got ${contentLength})`)
      log.debug('HEAD succeeded', { href: fileHref, contentLength, mimeType: headRes.headers.get('content-type') })

      // ── Full GET ─────────────────────────────────────────────────────────
      const getRes = await fetch(fileUrl, {
        headers: authHeaders,
        signal: AbortSignal.timeout(60_000),
      })
      assert.strictEqual(getRes.status, 200, `GET ${fileHref} should return 200`)
      const fullBody = Buffer.from(await getRes.arrayBuffer())
      assert(fullBody.length > 0, 'GET response body should not be empty')
      assert.strictEqual(fullBody.length, contentLength, 'GET body length should match HEAD Content-Length')

      // ── Range GET: first 10 bytes ─────────────────────────────────────────
      if (contentLength >= 10) {
        const rangeRes = await fetch(fileUrl, {
          headers: { ...authHeaders, Range: 'bytes=0-9' },
          signal: AbortSignal.timeout(30_000),
        })
        assert.strictEqual(rangeRes.status, 206, 'Range GET should return 206 Partial Content')
        assert(
          rangeRes.headers.get('content-range')?.startsWith('bytes 0-9/'),
          `Content-Range should be "bytes 0-9/…", got "${rangeRes.headers.get('content-range')}"`
        )
        const rangeBody = Buffer.from(await rangeRes.arrayBuffer())
        assert.strictEqual(rangeBody.length, 10, 'Range body should be exactly 10 bytes')
        assert(rangeBody.equals(fullBody.subarray(0, 10)), 'Range bytes must match the start of the full file')
        log.debug('Range GET validated', { href: fileHref, rangeLength: rangeBody.length })
      }

      log.debug('WebDAV file access fully validated', { diskId: disk.id, href: fileHref })
      break // One disk with a successful full test is sufficient
    }
  })
})

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Downloads files from a backup archive via the REST API and validates the archive format.
 *
 * @param {import('../client/restApiClient.js').RestApiClient} restApiClient
 * @param {{ encodedId: string, encodedDiskId: string, partitionId: string|undefined, paths: string[], format: 'tgz'|'zip' }} opts
 */
async function assertRestDownload(restApiClient, { encodedId, encodedDiskId, partitionId, paths, format }) {
  const params = new URLSearchParams(paths.map(p => ['paths[]', p]))
  const diskBase = `/rest/v0/backup-archives/${encodedId}/disks/${encodedDiskId}`
  const endpoint =
    partitionId !== undefined
      ? `${diskBase}/partitions/${encodeURIComponent(partitionId)}/files.${format}?${params}`
      : `${diskBase}/files.${format}?${params}`

  const response = await fetch(`${restApiClient.baseUrl}${endpoint}`, {
    headers: restApiClient.headers,
    signal: AbortSignal.timeout(120_000),
  })

  assert(response.ok, `REST download failed for format=${format}: HTTP ${response.status} ${response.statusText}`)

  const bytes = Buffer.from(await response.arrayBuffer())
  assert(bytes.length > 0, `Downloaded ${format} archive must not be empty`)

  const magic = format === 'tgz' ? TGZ_MAGIC : ZIP_MAGIC
  assert.strictEqual(bytes[0], magic[0], `${format} archive byte[0] mismatch`)
  assert.strictEqual(bytes[1], magic[1], `${format} archive byte[1] mismatch`)

  log.debug('REST download validated', { format, size: bytes.length, partitionId })
}
