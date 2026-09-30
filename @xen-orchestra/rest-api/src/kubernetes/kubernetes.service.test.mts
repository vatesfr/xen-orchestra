import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

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
      status: 500,
      message: 'CAPI answered with the status 500',
    })
    assert.deepEqual(error.data, { CAPIError: '<html>Bad Gateway</html>' })
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

describe('openEventStream', () => {
  const abortController = new AbortController()

  it('requests the stream and returns its body', async () => {
    let url: string | undefined
    let opts: Parameters<HttpRequest>[1]
    const service = makeService(async (_url, _opts) => {
      url = _url
      opts = _opts
      return new Response('event: ping\ndata: {}\n\n', { headers: { 'content-type': 'text/event-stream' } })
    })

    const stream = await service.openEventStream('api/kubernetes/clusters/cluster-1/events', {
      signal: abortController.signal,
    })

    assert.equal(url, `${CAPI_URL}/api/kubernetes/clusters/cluster-1/events`)
    assert.equal(opts!.headers!.accept, 'text/event-stream')
    assert.equal(opts!.signal, abortController.signal)

    // an event stream is idle most of the time: it must not be aborted between two events
    assert.equal(opts!.bodyTimeout, 0)

    const { value } = await stream.getReader().read()
    assert.equal(new TextDecoder().decode(value), 'event: ping\ndata: {}\n\n')
  })

  it('throws the error answered by CAPI', async () => {
    const service = makeService(throwingHttpRequest(jsonResponse({ detail: 'unknown cluster' }, 404)))

    await assertApiError(
      service.openEventStream('api/kubernetes/clusters/nope/events', { signal: abortController.signal }),
      { status: 404, message: 'unknown cluster' }
    )
  })

  it('throws a bad gateway error when the response has no body', async () => {
    const service = makeService(async () => new Response(null, { status: 204 }))

    await assertApiError(
      service.openEventStream('api/kubernetes/clusters/cluster-1/events', { signal: abortController.signal }),
      { status: 502 }
    )
  })

  it('rethrows an abort as-is, as it is not a failure', async () => {
    const service = makeService(async () => {
      throw Object.assign(new Error('This operation was aborted'), { name: 'AbortError' })
    })

    const error = await service
      .openEventStream('api/kubernetes/clusters/cluster-1/events', { signal: abortController.signal })
      .then(
        () => assert.fail('expected the promise to be rejected'),
        (error: unknown) => error
      )

    assert.ok(!(error instanceof ApiError))
    assert.equal((error as Error).name, 'AbortError')
  })
})
