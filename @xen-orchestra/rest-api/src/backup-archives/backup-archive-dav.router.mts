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

// ─── XML helpers ──────────────────────────────────────────────────────────────

function xmlEscape(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

type DavEntry = { name: string; isFile: boolean }

function buildMultistatus(selfHref: string, entries: DavEntry[], depth: string): string {
  const selfName = selfHref.replace(/\/$/, '').split('/').pop() ?? ''
  const responses: string[] = [davResponse(selfHref, selfName, false)]

  if (depth !== '0') {
    const baseHref = selfHref.endsWith('/') ? selfHref : selfHref + '/'
    for (const entry of entries) {
      // encodeURIComponent so special chars (e.g. "/" in LVM IDs) stay valid in the href.
      const encodedName = encodeURIComponent(entry.name)
      const entryHref = baseHref + (entry.isFile ? encodedName : encodedName + '/')
      responses.push(davResponse(entryHref, entry.name, entry.isFile))
    }
  }

  return `<?xml version="1.0" encoding="utf-8"?>\n<D:multistatus xmlns:D="DAV:">\n${responses.join('\n')}\n</D:multistatus>`
}

function davResponse(href: string, displayName: string, isFile: boolean): string {
  const resourceType = isFile ? '' : '<D:collection/>'
  return `  <D:response>
    <D:href>${xmlEscape(href)}</D:href>
    <D:propstat>
      <D:prop>
        <D:resourcetype>${resourceType}</D:resourcetype>
        <D:displayname>${xmlEscape(displayName)}</D:displayname>
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
      const name = xmlEscape(e.name)
      const link = e.isFile ? name : name + '/'
      return `    <tr><td><a href="${link}">${link}</a></td></tr>`
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

// objectId 'params.archiveId' is resolved via dot notation against `req`
const DAV_ACL = acl({
  resource: 'backup-archive',
  action: 'read',
  objectId: 'params.archiveId',
  getObject: () => {
    const service = iocContainer.get(BackupArchiveService)
    return (id: XoVmBackupArchive['id']) => service.getBackupArchive(id)
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

      if (method === 'OPTIONS') {
        res.set({ DAV: '1', Allow: 'OPTIONS, GET, HEAD, PROPFIND', 'Accept-Ranges': 'bytes' })
        return res.status(200).end()
      }

      if (!['PROPFIND', 'GET', 'HEAD'].includes(method)) {
        res.setHeader('Allow', 'OPTIONS, GET, HEAD, PROPFIND')
        return res.status(405).end()
      }

      const archiveId = (req as AuthenticatedRequest).params.archiveId as XoVmBackupArchive['id']
      const depth = (req.headers['depth'] as string | undefined) ?? '1'
      const service = iocContainer.get(BackupArchiveService)

      // req.path is relative to /:archiveId/dav — i.e. everything after /dav.
      // Decode each segment so LVM partition IDs like "0%2Fvg%2Flv" reach services as "0/vg/lv".
      // selfHref stays raw (from originalUrl) so PROPFIND hrefs remain valid URLs.
      const pathParts = req.path
        .split('/')
        .filter(Boolean)
        .map(s => decodeURIComponent(s))
      const selfHref = req.originalUrl.split('?')[0]

      try {
        // ── /dav/ → list disks ───────────────────────────────────────────────
        if (pathParts.length === 0) {
          const archive = await service.getBackupArchive(archiveId)
          const entries: DavEntry[] = archive.disks.map(d => ({ name: d.name || d.id, isFile: false }))

          if (method === 'PROPFIND') {
            const xml = buildMultistatus(selfHref.endsWith('/') ? selfHref : selfHref + '/', entries, depth)
            return res.status(207).set('Content-Type', 'application/xml; charset=utf-8').end(xml)
          }

          // GET / HEAD on root → HTML listing
          if (method === 'HEAD') return res.status(200).end()
          return res
            .status(200)
            .set('Content-Type', 'text/html; charset=utf-8')
            .end(buildHtmlListing(selfHref, entries))
        }

        const diskId = pathParts[0]

        // ── /dav/{diskId}/ → list partitions or bare-disk root ───────────────
        // For bare disks (no partition table), files live under the synthetic "_bare_"
        // partition segment to avoid path ambiguity with partition IDs.
        if (pathParts.length === 1) {
          const partitions = await service.listPartitions(archiveId, diskId)
          const entries: DavEntry[] =
            partitions.length === 0
              ? [{ name: '_bare_', isFile: false }]
              : partitions.map(p => ({ name: p.id, isFile: false }))

          const baseHref = selfHref.endsWith('/') ? selfHref : selfHref + '/'

          if (method === 'PROPFIND') {
            return res
              .status(207)
              .set('Content-Type', 'application/xml; charset=utf-8')
              .end(buildMultistatus(baseHref, entries, depth))
          }
          if (method === 'HEAD') return res.status(200).end()
          return res
            .status(200)
            .set('Content-Type', 'text/html; charset=utf-8')
            .end(buildHtmlListing(baseHref, entries))
        }

        // ── /dav/{diskId}/{partitionId}/[path] ───────────────────────────────
        // "_bare_" is a synthetic sentinel for disks with no partition table.
        const rawPartitionId = pathParts[1]
        const partitionId = rawPartitionId === '_bare_' ? undefined : rawPartitionId
        const filePath = '/' + pathParts.slice(2).join('/')
        const isDirectory = req.path.endsWith('/')

        // PROPFIND on a directory
        if (method === 'PROPFIND' || isDirectory) {
          const listPath = isDirectory ? filePath : filePath + '/'
          const rawFiles = await service.listFiles(archiveId, diskId, partitionId, listPath)
          const entries: DavEntry[] = Object.keys(rawFiles).map(name => ({
            name: name.replace(/\/$/, ''),
            isFile: !name.endsWith('/'),
          }))
          const baseHref = selfHref.endsWith('/') ? selfHref : selfHref + '/'

          if (method === 'PROPFIND') {
            return res
              .status(207)
              .set('Content-Type', 'application/xml; charset=utf-8')
              .end(buildMultistatus(baseHref, entries, depth))
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
        log.warn('DAV request failed', { method, path: req.path, error: err })
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
