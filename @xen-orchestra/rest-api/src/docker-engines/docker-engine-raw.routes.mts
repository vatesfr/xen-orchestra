// Raw Docker Engine API passthrough: /rest/v0/docker-engines/{id}/_raw/<Docker API path>
//
// Not a tsoa controller (a wildcard path): mounted with the external router
// (`mountExternalRoute`), which runs `expressAuthentication` first. Without an
// `acl` middleware, it already refuses non-admin users, but the admin check is
// repeated here, explicitly, because nothing else protects this route: it
// grants unrestricted access to the Docker daemon of the guest, which is
// root-equivalent on that guest.
//
// Handler order (the plan, §7): allowRawApi (501) → admin (403) → DOCKER
// feature → engine exists (404) → no connection hijacking (501) → path checks
// (400) → inbound header allowlist → audit log → response streamed with an
// outbound header allowlist, capped at docker.maxRawResponseSize → errors
// thrown, i.e. passed to `next()` by the external router.

import { pipeline } from 'node:stream/promises'
import type { Request, Response } from 'express'
import { createLogger } from '@xen-orchestra/log'
import type { OpenAPIV3 } from 'openapi-types'
import type { XoDockerEngine } from '@vates/types'
import { unauthorized } from 'xo-common/api-errors.js'

import { ApiError } from '../helpers/error.helper.mjs'
import type { RestApi } from '../rest-api/rest-api.mjs'
import type { RouteDefinition } from '../router/types.mjs'

const log = createLogger('xo:rest-api:docker-raw')

/** express path of the passthrough (relative to /rest/v0) */
export const DOCKER_RAW_ENDPOINT = '/docker-engines/:id/_raw/*'

const RAW_SEPARATOR = '/_raw/'

// the only request headers forwarded to dockerd: never `cookie`,
// `authorization`, `x-xo-*`, `upgrade`…
const INBOUND_HEADERS = ['accept', 'content-length', 'content-type'] as const
// the only response headers sent back
const OUTBOUND_HEADERS = ['api-version', 'content-length', 'content-type', 'docker-experimental', 'ostype']

// endpoints which hijack the connection (bidirectional streams): not supported
// the name may contain `/` (legacy link aliases, e.g. `web/db`): dockerd routes
// these endpoints with `{name:.*}`
const HIJACK_PATHS = [/^containers\/.+\/attach(?:\/ws)?$/, /^exec\/.+\/start$/, /^session$/, /^grpc$/]
const VERSION_SEGMENT = /^v\d+(?:\.\d+)?$/

/**
 * Decoded segments of the Docker path, `undefined` if it is not acceptable:
 * empty segments, `.` and `..`, encoded `/` or `\`, NUL, or invalid encoding.
 * The decoded form matters: dockerd routes on the decoded path.
 */
export function getRawPathSegments(pathname: string): string[] | undefined {
  if (pathname === '' || /%(?:2f|5c|00)/i.test(pathname)) {
    return
  }
  const segments: string[] = []
  for (const segment of pathname.split('/')) {
    let decoded: string
    try {
      decoded = decodeURIComponent(segment)
    } catch {
      return
    }
    if (decoded === '' || decoded === '.' || decoded === '..' || /[\\/\0]/.test(decoded)) {
      return
    }
    segments.push(decoded)
  }
  return segments
}

function isHijack(req: Request, segments: string[] | undefined): boolean {
  if (req.headers.upgrade !== undefined || /\bupgrade\b/i.test(String(req.headers.connection ?? ''))) {
    return true
  }
  if (segments === undefined) {
    return false
  }
  const path = (VERSION_SEGMENT.test(segments[0]) ? segments.slice(1) : segments).join('/')
  return HIJACK_PATHS.some(re => re.test(path))
}

export async function dockerRawHandler({ req, res, restApi }: { req: Request; res: Response; restApi: RestApi }) {
  const { xoApp } = restApi

  // 1. disabled by default: 501 rather than 404 so that an admin knows why
  if (!(xoApp.config.getOptional<boolean>('docker.allowRawApi') ?? false)) {
    throw new ApiError('the raw Docker API passthrough is disabled (docker.allowRawApi)', 501)
  }

  // 2. admin only, explicitly: this route is not protected by tsoa
  const user = restApi.getCurrentUser()
  if (user.permission !== 'admin') {
    throw unauthorized()
  }

  // 3.
  await xoApp.checkFeatureAuthorization('DOCKER')

  // 4. 404 before any work
  const engineId = req.params.id as XoDockerEngine['id']
  const engine = await xoApp.getDockerEngine(engineId)

  // the raw tail, not `req.params[0]` which is decoded and has no query string
  const url = req.originalUrl
  const index = url.indexOf(RAW_SEPARATOR)
  const tail = index === -1 ? '' : url.slice(index + RAW_SEPARATOR.length)
  const queryIndex = tail.indexOf('?')
  const pathname = queryIndex === -1 ? tail : tail.slice(0, queryIndex)
  const segments = getRawPathSegments(pathname)

  // 5.
  if (isHijack(req, segments)) {
    throw new ApiError('attach, exec start and connection upgrades are not supported by the raw passthrough', 501)
  }

  // 6.
  if (segments === undefined) {
    throw new ApiError('invalid Docker API path', 400)
  }

  // 7. (a body already consumed by xo-server's urlencoded parser cannot be forwarded)
  if ((req as Request & { _body?: boolean })._body === true) {
    throw new ApiError('form-encoded bodies are not supported by the raw passthrough', 415)
  }
  const headers: Record<string, string> = {}
  for (const name of INBOUND_HEADERS) {
    const value = req.headers[name]
    if (typeof value === 'string') {
      headers[name] = value
    }
  }
  const method = req.method
  const hasBody =
    method !== 'GET' &&
    method !== 'HEAD' &&
    (req.headers['transfer-encoding'] !== undefined ||
      (req.headers['content-length'] !== undefined && req.headers['content-length'] !== '0'))

  const path = '/' + tail

  // 8. audit every call
  log.info('docker raw', {
    user: user.id,
    userEmail: user.email,
    engine: engineId,
    vm: engine.$VM,
    method,
    path,
  })

  // 9. the request and the response are aborted when the client goes away
  const controller = new AbortController()
  const onClose = () => controller.abort()
  res.once('close', onClose)
  try {
    const upstream = await xoApp.callDockerEngineRawApi(engineId, {
      method,
      path,
      headers,
      body: hasBody ? req : undefined,
      signal: controller.signal,
    })

    // a 401/407 from the daemon (or a proxy in front of it) must not look like
    // an XO authentication failure, nor make a browser prompt for credentials
    if (upstream.statusCode === 401 || upstream.statusCode === 407) {
      upstream.body.destroy()
      throw new ApiError(`Docker API error ${upstream.statusCode}`, 502, {
        data: { code: 'DOCKER_API_ERROR', statusCode: upstream.statusCode },
      })
    }

    res.status(upstream.statusCode)
    // streamed responses (events, logs?follow=1…) must reach the client as they
    // come: xo-server's `compression()` (and any proxy) would buffer them
    res.setHeader('Cache-Control', 'no-transform')
    for (const name of OUTBOUND_HEADERS) {
      const value = upstream.headers[name]
      if (value !== undefined) {
        res.setHeader(name, value)
      }
    }
    try {
      await pipeline(upstream.body, res)
    } catch (error) {
      // the status and headers are gone: the only way to report the failure
      // (e.g. RAW_RESPONSE_TOO_LARGE) is to cut the response
      if (!controller.signal.aborted) {
        log.warn('docker raw: response interrupted', { engine: engineId, method, path, error })
      }
      res.destroy()
    }
  } finally {
    res.off('close', onClose)
  }
}

const dockerRawRoutes: RouteDefinition[] = (['get', 'post', 'put', 'patch', 'delete'] as const).map(method => ({
  method,
  endpoint: DOCKER_RAW_ENDPOINT,
  tags: ['docker-engines'],
  // writes the response itself, the external router does not send anything else
  callback: ({ req, res, restApi }) => dockerRawHandler({ req, res, restApi }),
}))

/**
 * Mount the passthrough on the external router, and remove the wildcard path
 * it inserted in the OpenAPI spec: the hand-written entry,
 * `/docker-engines/{id}/_raw/{path}`, is in `tsoa.json`.
 */
export function mountDockerRawRoutes(
  mountExternalRoute: (route: RouteDefinition) => () => void,
  swaggerOpenApiSpec: OpenAPIV3.Document
): void {
  for (const route of dockerRawRoutes) {
    mountExternalRoute(route)
  }
  delete swaggerOpenApiSpec.paths[DOCKER_RAW_ENDPOINT]
}
