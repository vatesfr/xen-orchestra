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
import { toDockerApiError } from '../helpers/docker.helper.mjs'
import type { RestApi } from '../rest-api/rest-api.mjs'
import type { RouteDefinition } from '../router/types.mjs'

const log = createLogger('xo:rest-api:docker-raw')

/** express path of the passthrough (relative to /rest/v0) */
export const DOCKER_RAW_ENDPOINT = '/docker-engines/:id/_raw/*'
/** path of the hand-written OpenAPI entry replacing the auto-inserted one */
export const DOCKER_RAW_SPEC_PATH = '/docker-engines/{id}/_raw/{path}'

const RAW_SEPARATOR = '/_raw/'

// the only request headers forwarded to dockerd: never `cookie`,
// `authorization`, `x-xo-*`, `upgrade`…
export const INBOUND_HEADERS = ['accept', 'content-length', 'content-type'] as const
// the only response headers sent back
export const OUTBOUND_HEADERS = ['api-version', 'content-length', 'content-type', 'docker-experimental', 'ostype']

// endpoints which hijack the connection (bidirectional streams): not supported
const HIJACK_PATHS = [/^containers\/[^/]+\/attach(?:\/ws)?$/, /^exec\/[^/]+\/start$/, /^session$/, /^grpc$/]
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
    let upstream
    try {
      upstream = await xoApp.callDockerEngineRawApi(engineId, {
        method,
        path,
        headers,
        body: hasBody ? req : undefined,
        signal: controller.signal,
      })
    } catch (error) {
      throw toDockerApiError(error)
    }

    res.status(upstream.statusCode)
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

export const dockerRawRoutes: RouteDefinition[] = (['get', 'post', 'put', 'patch', 'delete'] as const).map(method => ({
  method,
  endpoint: DOCKER_RAW_ENDPOINT,
  tags: ['docker-engines'],
  // writes the response itself, the external router does not send anything else
  callback: ({ req, res, restApi }) => dockerRawHandler({ req, res, restApi }),
}))

const RAW_DESCRIPTION = `Raw Docker Engine API passthrough (\`{path}\` is the Docker API path, which may contain \`/\` and a query string, e.g. \`images/json?all=1\`; it is prefixed with the negotiated API version unless it starts with \`v<version>/\`). Docker's answer is returned as is (status and body), with only the \`api-version\`, \`content-length\`, \`content-type\`, \`docker-experimental\` and \`ostype\` headers.

Disabled by default (501): \`[docker] allowRawApi = true\` in xo-server's configuration. It grants unrestricted access to the Docker daemon of the guest, which is equivalent to root on that guest: every call is logged.

Only the \`accept\`, \`content-type\` and \`content-length\` request headers are forwarded. The request body is limited to \`docker.maxRawRequestSize\` (413) and the response to \`docker.maxRawResponseSize\` (502 when announced by \`content-length\`, otherwise the response is cut). Attach, exec start and connection upgrades are refused (501), as are \`.\`/\`..\` segments and encoded slashes (400). HEAD is supported through GET.

Required privilege:
- admin (no ACL, even in v2)`

function rawOperation(method: string): OpenAPIV3.OperationObject {
  return {
    operationId: `DockerEngineRaw${method[0].toUpperCase()}${method.slice(1)}`,
    description: RAW_DESCRIPTION,
    tags: ['docker-engines'],
    security: [{ '*': [] }],
    parameters: [
      {
        in: 'path',
        name: 'id',
        required: true,
        schema: { type: 'string' },
        example: '8d834412-eb40-4328-a815-3fcc0989bd07',
      },
      {
        in: 'path',
        name: 'path',
        required: true,
        description: 'Docker Engine API path (may contain `/`)',
        schema: { type: 'string' },
        example: 'images/json',
      },
    ],
    ...(method === 'get' || method === 'delete'
      ? {}
      : {
          requestBody: {
            required: false,
            content: { 'application/json': { schema: {} }, 'application/octet-stream': { schema: {} } },
          },
        }),
    responses: {
      '200': { description: "Docker's answer (any status is passed through)" },
      '400': { description: 'Invalid Docker API path' },
      '401': { description: 'Authentication required' },
      '403': { description: 'Not an administrator, or DOCKER feature not authorized' },
      '404': { description: 'Unknown engine' },
      '413': { description: 'Request body larger than docker.maxRawRequestSize' },
      '501': { description: 'Disabled (docker.allowRawApi), or attach/exec start/upgrade' },
      '502': {
        description: 'SSH or Docker failure (see data.code), or response larger than docker.maxRawResponseSize',
      },
      '503': { description: 'Too many busy SSH connections or streams' },
    },
    // never an MCP tool: unrestricted, root-equivalent access
    'x-mcp-exposure': 'deny',
  } as OpenAPIV3.OperationObject
}

/**
 * Mount the passthrough on the external router, and replace the wildcard path
 * it inserted in the OpenAPI spec with a hand-written entry.
 */
export function mountDockerRawRoutes(
  mountExternalRoute: (route: RouteDefinition) => () => void,
  swaggerOpenApiSpec: OpenAPIV3.Document
): void {
  for (const route of dockerRawRoutes) {
    mountExternalRoute(route)
  }
  delete swaggerOpenApiSpec.paths[DOCKER_RAW_ENDPOINT]
  swaggerOpenApiSpec.paths[DOCKER_RAW_SPEC_PATH] = Object.fromEntries(
    dockerRawRoutes.map(({ method }) => [method, rawOperation(method)])
  )
}
