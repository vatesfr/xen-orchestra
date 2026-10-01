import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { invalidParameters } from 'xo-common/api-errors.js'

import { ApiError } from '../helpers/error.helper.mjs'
import { KubernetesService } from './kubernetes.service.mjs'
import type { RestApi } from '../rest-api/rest-api.mjs'
import type { XoApp } from '@vates/types'

const CAPI_URL = 'http://capi.invalid:30080'

type HttpRequest = XoApp['httpRequest']

// A service backed by a fake `xoApp`: `httpRequest` is the only thing the tests need to
// control, and the CAPI URL comes from the configuration to avoid depending on the
// hardcoded development URL
function makeService(httpRequest: HttpRequest): KubernetesService {
  const xoApp = {
    config: {
      getOptional: (path: string) => (path === 'rest-api.kubernetesProxyUrl' ? CAPI_URL : undefined),
      getOptionalDuration: () => undefined,
    },
    httpRequest,
  }

  return new KubernetesService({ xoApp } as unknown as RestApi)
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })
}

// mimics `xoApp.httpRequest`, which throws on any non 2xx response and exposes it as
// `error.response` when `bypassStatusCheck` is used
function throwingHttpRequest(response: Response): HttpRequest {
  return async () => {
    throw Object.assign(new Error(`${response.status}`), { response })
  }
}

async function assertApiError(promise: Promise<unknown>, { status, message }: { status: number; message?: string }) {
  const error = await promise.then(
    () => assert.fail('expected the promise to be rejected'),
    (error: unknown) => error
  )

  assert.ok(error instanceof ApiError, `expected an ApiError, got ${String(error)}`)
  assert.equal(error.status, status)
  if (message !== undefined) {
    assert.equal(error.message, message)
  }

  return error
}

// the errors of the invalid parameters are not `ApiError`s but XO errors, as they are
// built by `xo-common`
async function assertInvalidParameters(
  promise: Promise<unknown>,
  { message, errors }: { message: string; errors: unknown }
) {
  const error = await promise.then(
    () => assert.fail('expected the promise to be rejected'),
    (error: unknown) => error
  )

  assert.ok(invalidParameters.is(error), `expected an invalidParameters error, got ${String(error)}`)
  assert.equal((error as Error).message, message)
  assert.deepEqual((error as { data: { errors: unknown } }).data.errors, errors)
}

describe('getCAPISpec', () => {
  it('returns the parsed specification', async () => {
    const service = makeService(async () => jsonResponse({ openapi: '3.1.0', paths: {} }))

    assert.deepEqual(await service.getCAPISpec(), { openapi: '3.1.0', paths: {} })
  })

  it('returns undefined when the response has no content', async () => {
    const service = makeService(async () => new Response(null, { status: 204 }))

    assert.equal(await service.getCAPISpec(), undefined)
  })

  it('requests the specification of the configured CAPI', async () => {
    let url: string | undefined
    let opts: Parameters<HttpRequest>[1]
    const service = makeService(async (_url, _opts) => {
      url = _url
      opts = _opts
      return jsonResponse({})
    })

    await service.getCAPISpec()

    assert.equal(url, `${CAPI_URL}/swagger/openapi.json`)
    assert.equal(opts!.method, 'GET')
    assert.equal(opts!.body, undefined)
    assert.equal(opts!.headers!.accept, 'application/json')
  })

  it('relays the status of the CAPI error', async () => {
    const service = makeService(throwingHttpRequest(jsonResponse({ title: 'not found' }, 404)))

    await assertApiError(service.getCAPISpec(), { status: 404 })
  })

  it('uses a bad gateway status when the CAPI status cannot be relayed', async () => {
    const service = makeService(throwingHttpRequest(jsonResponse({ title: 'teapot' }, 418)))

    await assertApiError(service.getCAPISpec(), { status: 502 })
  })

  it('uses the detail of the CAPI error as message', async () => {
    const service = makeService(throwingHttpRequest(jsonResponse({ detail: 'workerReplicas must be >= 1' }, 400)))

    const error = await assertApiError(service.getCAPISpec(), {
      status: 400,
      message: 'workerReplicas must be >= 1',
    })
    assert.deepEqual(error.data, { CAPIError: { detail: 'workerReplicas must be >= 1' } })
  })

  it('falls back on the title of the CAPI error as message', async () => {
    const service = makeService(throwingHttpRequest(jsonResponse({ title: 'Bad Request' }, 400)))

    await assertApiError(service.getCAPISpec(), {
      status: 400,
      message: 'Bad Request',
    })
  })

  it('keeps the body of a CAPI error which is not JSON', async () => {
    const service = makeService(throwingHttpRequest(new Response('<html>Bad Gateway</html>', { status: 500 })))

    const error = await assertApiError(service.getCAPISpec(), {
      status: 502,
      message: 'CAPI answered with the status 500',
    })
    assert.deepEqual(error.data, { CAPIError: '<html>Bad Gateway</html>' })
  })

  it('translates the validation errors of CAPI into invalid parameters', async () => {
    const errors = [{ name: 'workerReplicas', reason: 'must be >= 1' }]
    const service = makeService(
      throwingHttpRequest(jsonResponse({ detail: 'workerReplicas must be >= 1', errors }, 422))
    )

    await assertInvalidParameters(service.getCAPISpec(), { message: 'workerReplicas must be >= 1', errors })
  })

  it('also translates the validation errors answered with a bad request status', async () => {
    // CAPI used to answer `400` for an invalid input, before answering `422`
    const errors = [{ name: 'name', reason: 'is required' }]
    const service = makeService(throwingHttpRequest(jsonResponse({ errors }, 400)))

    await assertInvalidParameters(service.getCAPISpec(), { message: 'invalid parameters', errors })
  })

  it('does not translate an error which has no validation error', async () => {
    // e.g. CAPI answers a bad request when a cluster does not exist
    const service = makeService(throwingHttpRequest(jsonResponse({ detail: 'unknown cluster' }, 400)))

    await assertApiError(service.getCAPISpec(), { status: 400, message: 'unknown cluster' })
  })

  it('does not translate an error whose validation errors are empty', async () => {
    const service = makeService(throwingHttpRequest(jsonResponse({ detail: 'nope', errors: [] }, 422)))

    await assertApiError(service.getCAPISpec(), { status: 422, message: 'nope' })
  })

  it('throws a service unavailable error when CAPI cannot be reached', async () => {
    const service = makeService(async () => {
      throw new Error('connect ECONNREFUSED')
    })

    await assertApiError(service.getCAPISpec(), {
      status: 503,
      message: 'An error occurred while reaching the CAPI',
    })
  })
})
