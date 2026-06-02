import { Router, type Request, type Response, type NextFunction } from 'express'
import { pipeline } from 'node:stream/promises'
import { Readable } from 'node:stream'
import { createLogger } from '@xen-orchestra/log'
import type { XoVmBackupArchive } from '@vates/types'

import type { AuthenticatedRequest } from '../helpers/helper.type.mjs'
import { acl } from '../middlewares/acl.middleware.mjs'
import { BackupArchiveService } from './backup-archive.service.mjs'
import { iocContainer } from '../ioc/ioc.mjs'

const log = createLogger('xo:rest-api:backup-archives:dav')

// ─── Segment encoding ─────────────────────────────────────────────────────────
// IDs that contain "/" (the archive ID, disk ID, and LVM partition IDs like
// "pv/vg/lv") can't be a single URL path segment: percent-encoding them as "%2F"
// breaks WebDAV clients (okhttp keeps "%2F" in its request URI but normalizes it to
// "/" when parsing response hrefs, so the self entry no longer matches and the whole
// listing is discarded). base64url has no "/" (alphabet: A-Z a-z 0-9 - _), so it
// stays a clean single segment. Slash-free IDs (GPT/MBR partition IDs) are left
// readable so clients like rclone — which name folders from the URL segment, not
// <D:displayname> — show the real partition ID instead of base64url gibberish.
export const encodeDavSeg = (s: string): string => Buffer.from(s, 'utf8').toString('base64url')
const decodeDavSeg = (s: string): string => Buffer.from(s, 'base64url').toString('utf8')

// LVM partition IDs contain "/" and must be base64url-encoded; this prefix marks them
// so the router knows to base64url-decode rather than treat the segment as a literal ID.
const LVM_SEG_PREFIX = '_lvm_'
export const encodePartitionSeg = (id: string): string =>
  id.includes('/') ? LVM_SEG_PREFIX + encodeDavSeg(id) : encodeURIComponent(id)
const decodePartitionSeg = (seg: string): string =>
  seg.startsWith(LVM_SEG_PREFIX) ? decodeDavSeg(seg.slice(LVM_SEG_PREFIX.length)) : decodeURIComponent(seg)

// ─── XML helpers ──────────────────────────────────────────────────────────────

function xmlEscape(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

// `name` is the human-readable display name; `segment` is the URL path segment to
// append to the parent href (already encoded: base64url for ids, %xx for file names).
// `size`/`mtime` are only set for files (bytes / epoch ms).
type DavEntry = { name: string; isFile: boolean; segment: string; size?: number; mtime?: number }

// Always return direct children for directory PROPFIND regardless of the requested Depth.
// RFC 4918 says Depth:0 means "self only", but many Android WebDAV clients (okhttp-based)
// send Depth:0 for every request and never follow with Depth:1 — so they would see an
// empty directory. Returning children unconditionally is the pragmatic fix.
function buildMultistatus(selfHref: string, selfName: string, entries: DavEntry[]): string {
  const responses: string[] = [davResponse(selfHref, selfName, { isFile: false })]

  const baseHref = selfHref.endsWith('/') ? selfHref : selfHref + '/'

  for (const entry of entries) {
    const entryHref = baseHref + (entry.isFile ? entry.segment : entry.segment + '/')
    responses.push(davResponse(entryHref, entry.name, entry))
  }

  return `<?xml version="1.0" encoding="utf-8"?>\n<D:multistatus xmlns:D="DAV:">\n${responses.join('\n')}\n</D:multistatus>`
}

function davResponse(
  href: string,
  displayName: string,
  { isFile, size, mtime }: { isFile: boolean; size?: number; mtime?: number }
): string {
  const resourceType = isFile ? '' : '<D:collection/>'
  const contentType = isFile ? 'application/octet-stream' : 'httpd/unix-directory'
  const lastModified = (mtime !== undefined ? new Date(mtime) : new Date()).toUTCString()
  // getcontentlength is required for files: rclone (and others) trust the listed size and
  // will not GET a file reported as 0 bytes, so it would appear empty. Real sizes come from
  // the partition's lstat; omit the property only when the size is genuinely unknown.
  const lengthProp = isFile && size !== undefined ? `\n        <D:getcontentlength>${size}</D:getcontentlength>` : ''
  return `  <D:response>
    <D:href>${xmlEscape(href)}</D:href>
    <D:propstat>
      <D:prop>
        <D:resourcetype>${resourceType}</D:resourcetype>
        <D:displayname>${xmlEscape(displayName)}</D:displayname>
        <D:getcontenttype>${contentType}</D:getcontenttype>${lengthProp}
        <D:getlastmodified>${lastModified}</D:getlastmodified>
      </D:prop>
      <D:status>HTTP/1.1 200 OK</D:status>
    </D:propstat>
  </D:response>`
}

// ─── HTML directory listing ───────────────────────────────────────────────────

function buildHtmlListing(href: string, entries: DavEntry[]): string {
  const title = xmlEscape(href)
  const rows = entries
    .map(e => {
      const link = e.isFile ? e.segment : e.segment + '/'
      return `    <tr><td><a href="${xmlEscape(link)}">${xmlEscape(e.name)}${e.isFile ? '' : '/'}</a></td></tr>`
    })
    .join('\n')
  return `<!DOCTYPE html><html><head><title>${title}</title></head><body>
  <h1>${title}</h1>
  <table>${rows}</table>
</body></html>`
}

// ─── Range header parsing ─────────────────────────────────────────────────────

type RangeParsed =
  | { kind: 'explicit'; start: number; end: number }
  | { kind: 'from'; start: number }
  | { kind: 'suffix'; length: number }

function parseRangeHeader(header: string): RangeParsed | undefined {
  const m = /^bytes=(\d*)-(\d*)$/.exec(header)
  if (m === null) return undefined
  const [, s, e] = m
  if (s === '' && e === '') return undefined
  if (s === '') return { kind: 'suffix', length: parseInt(e, 10) }
  if (e === '') return { kind: 'from', start: parseInt(s, 10) }
  return { kind: 'explicit', start: parseInt(s, 10), end: parseInt(e, 10) }
}

// ─── ACL ─────────────────────────────────────────────────────────────────────

// objectId 'params.archiveId' is resolved via dot notation against `req`.
// The archiveId in the DAV URL is base64url-encoded, so decode it before resolving.
const DAV_ACL = acl({
  resource: 'backup-archive',
  action: 'read',
  objectId: 'params.archiveId',
  getObject: () => {
    const service = iocContainer.get(BackupArchiveService)
    return (id: XoVmBackupArchive['id']) => service.getBackupArchive(decodeDavSeg(id) as XoVmBackupArchive['id'])
  },
})

// ─── Router ───────────────────────────────────────────────────────────────────

export function createBackupArchiveDavRouter(): Router {
  const router = Router()

  router.use(
    '/:archiveId/dav',
    // @ts-expect-error — acl() expects AuthenticatedRequest; Express types use Request
    DAV_ACL,
    async (req: Request, res: Response, next: NextFunction) => {
      const method = req.method.toUpperCase()

      // RFC 4918 requires DAV: 1 on all responses, not just OPTIONS.
      res.setHeader('DAV', '1')

      if (method === 'OPTIONS') {
        res.set({ DAV: '1', Allow: 'OPTIONS, GET, HEAD, PROPFIND', 'Accept-Ranges': 'bytes' })
        return res.status(200).end()
      }

      if (!['PROPFIND', 'GET', 'HEAD'].includes(method)) {
        res.setHeader('Allow', 'OPTIONS, GET, HEAD, PROPFIND')
        return res.status(405).end()
      }

      const archiveId = decodeDavSeg(
        (req as AuthenticatedRequest).params.archiveId as string
      ) as XoVmBackupArchive['id']
      const service = iocContainer.get(BackupArchiveService)

      // req.path is relative to /:archiveId/dav. Segment 0 (diskId) is base64url; segment 1
      // (partitionId) is base64url only for LVM ids (see encodePartitionSeg); file-path
      // segments after that are normal %xx-encoded names.
      const rawParts = req.path.split('/').filter(Boolean)

      // Absolute-path hrefs (RFC 4918 allows path or full URI). base64url segments make
      // self-matching work without needing a full http(s)://host URI, and a path avoids
      // having to reconstruct the public host behind reverse proxies.
      const selfHref = req.originalUrl.split('?')[0]

      log.debug('DAV request', { method, archiveId, rawParts })

      try {
        // ── /dav/ → list disks ───────────────────────────────────────────────
        if (rawParts.length === 0) {
          const archive = await service.getBackupArchive(archiveId)
          const entries: DavEntry[] = archive.disks.map(d => ({
            name: d.name || d.id,
            isFile: false,
            segment: encodeDavSeg(d.id),
          }))

          const baseHref = selfHref.endsWith('/') ? selfHref : selfHref + '/'
          if (method === 'PROPFIND') {
            return res
              .status(207)
              .set('Content-Type', 'application/xml; charset=utf-8')
              .end(buildMultistatus(baseHref, 'backup-archive', entries))
          }
          if (method === 'HEAD') return res.status(200).end()
          return res
            .status(200)
            .set('Content-Type', 'text/html; charset=utf-8')
            .end(buildHtmlListing(baseHref, entries))
        }

        const diskId = decodeDavSeg(rawParts[0])

        // ── /dav/{diskId}/ → list partitions or bare-disk root ───────────────
        // For bare disks (no partition table), files live under the synthetic "_bare_"
        // partition segment to avoid path ambiguity with partition IDs.
        if (rawParts.length === 1) {
          const partitions = await service.listPartitions(archiveId, diskId)

          const entries: DavEntry[] =
            partitions.length === 0
              ? [{ name: '_bare_', isFile: false, segment: encodePartitionSeg('_bare_') }]
              : partitions.map(p => ({ name: p.id, isFile: false, segment: encodePartitionSeg(p.id) }))

          const baseHref = selfHref.endsWith('/') ? selfHref : selfHref + '/'
          if (method === 'PROPFIND') {
            return res
              .status(207)
              .set('Content-Type', 'application/xml; charset=utf-8')
              .end(buildMultistatus(baseHref, diskId, entries))
          }
          if (method === 'HEAD') return res.status(200).end()
          return res
            .status(200)
            .set('Content-Type', 'text/html; charset=utf-8')
            .end(buildHtmlListing(baseHref, entries))
        }

        // ── /dav/{diskId}/{partitionId}/[path] ───────────────────────────────
        // "_bare_" is a synthetic sentinel for disks with no partition table.
        const rawPartitionId = decodePartitionSeg(rawParts[1])
        const partitionId = rawPartitionId === '_bare_' ? undefined : rawPartitionId
        const fileSegments = rawParts.slice(2).map(s => decodeURIComponent(s))
        const filePath = '/' + fileSegments.join('/')
        const isDirectory = req.path.endsWith('/')

        // PROPFIND on a directory
        if (method === 'PROPFIND' || isDirectory) {
          const listPath = isDirectory ? filePath : filePath + '/'
          const rawFiles = await service.listFiles(archiveId, diskId, partitionId, listPath)
          const entries: DavEntry[] = Object.entries(rawFiles).map(([rawName, info]) => {
            const name = rawName.replace(/\/$/, '')
            const isFile = !rawName.endsWith('/')
            return { name, isFile, segment: encodeURIComponent(name), size: info?.size, mtime: info?.mtime }
          })
          const baseHref = selfHref.endsWith('/') ? selfHref : selfHref + '/'
          const selfName = fileSegments[fileSegments.length - 1] ?? partitionId ?? '_bare_'

          if (method === 'PROPFIND') {
            return res
              .status(207)
              .set('Content-Type', 'application/xml; charset=utf-8')
              .end(buildMultistatus(baseHref, selfName, entries))
          }
          // GET / HEAD on a directory → HTML listing
          if (method === 'HEAD') return res.status(200).end()
          return res
            .status(200)
            .set('Content-Type', 'text/html; charset=utf-8')
            .end(buildHtmlListing(baseHref, entries))
        }

        // ── File GET / HEAD ──────────────────────────────────────────────────
        await handleFileGet(archiveId, diskId, partitionId, filePath, service, req, res, method === 'HEAD')
      } catch (err) {
        log.warn('DAV request failed', { method, path: req.path, archiveId, error: err })
        next(err)
      }
    }
  )

  return router
}

// ─── File GET / HEAD with Range support ──────────────────────────────────────

async function handleFileGet(
  archiveId: XoVmBackupArchive['id'],
  diskId: string,
  partitionId: string | undefined,
  filePath: string,
  service: BackupArchiveService,
  req: Request,
  res: Response,
  isHead: boolean
): Promise<void> {
  const rangeHeader = req.headers['range'] as string | undefined
  const parsed = rangeHeader !== undefined ? parseRangeHeader(rangeHeader) : undefined

  let range: { start?: number; end?: number } | undefined
  let needsProbe = isHead || parsed?.kind === 'suffix'

  if (!needsProbe && parsed !== undefined) {
    // Explicit or from-start range: no probe needed
    if (parsed.kind === 'explicit') {
      range = { start: parsed.start, end: parsed.end }
    } else if (parsed.kind === 'from') {
      range = { start: parsed.start }
    }
  }

  // Probe fetch: mount partition, lstat the file, get totalSize + mimeType — then destroy stream
  let totalSize: number | undefined
  let probedMimeType: string | undefined
  if (needsProbe) {
    const probeStream = await service.fetchFiles(archiveId, diskId, partitionId, [filePath], 'raw')
    totalSize = probeStream.totalSize
    probedMimeType = probeStream.mimeType
    ;(probeStream as NodeJS.ReadableStream & { destroy?: () => void }).destroy?.()

    if (parsed?.kind === 'suffix') {
      const safeTotal = totalSize ?? 0
      const start = Math.max(0, safeTotal - parsed.length)
      range = { start, end: safeTotal - 1 }
    }
  }

  if (isHead) {
    const size = totalSize ?? 0
    res.setHeader('Content-Type', probedMimeType ?? 'application/octet-stream')
    res.setHeader('Content-Length', String(size))
    res.setHeader('Accept-Ranges', 'bytes')
    res.status(200).end()
    return
  }

  const stream = await service.fetchFiles(
    archiveId,
    diskId,
    partitionId,
    [filePath],
    'raw',
    range ? { range } : undefined
  )
  const size = stream.size ?? 0
  const total = stream.totalSize

  res.setHeader('Content-Type', probedMimeType ?? stream.mimeType ?? 'application/octet-stream')
  res.setHeader('Content-Length', String(size))
  res.setHeader('Accept-Ranges', 'bytes')

  if (parsed !== undefined && range !== undefined) {
    const start = range.start ?? 0
    const end = range.end ?? (total !== undefined ? total - 1 : size - 1)
    const contentRange = total !== undefined ? `bytes ${start}-${end}/${total}` : `bytes ${start}-${end}/*`
    res.setHeader('Content-Range', contentRange)
    res.status(206)
  } else {
    res.status(200)
  }

  req.on('close', () => (stream as NodeJS.ReadableStream & { destroy?: () => void }).destroy?.())
  await pipeline(stream as unknown as Readable, res)
}
