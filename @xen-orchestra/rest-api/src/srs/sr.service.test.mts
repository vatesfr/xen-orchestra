import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { Readable } from 'node:stream'
import { SUPPORTED_VDI_FORMAT, type XoSr } from '@vates/types'
import { invalidParameters } from 'xo-common/api-errors.js'

import { SrService, type CreateSrBody } from './sr.service.mjs'
import { ApiError } from '../helpers/error.helper.mjs'
import type { RestApi } from '../rest-api/rest-api.mjs'

describe('SrService.create', () => {
  it('resolves the host id to its XAPI ref, maps XO names to XAPI names, and returns the SR uuid', async () => {
    let srCreateParams: Record<string, unknown> | undefined
    let getFieldArgs: unknown[] | undefined
    let getXapiObjectArgs: unknown[] | undefined

    const fakeXapi = {
      SR_create: async (params: Record<string, unknown>) => {
        srCreateParams = params
        return 'OpaqueRef:new-sr'
      },
      getField: async (...args: unknown[]) => {
        getFieldArgs = args
        return 'sr-uuid-123'
      },
    }
    const xapiHost = { $ref: 'OpaqueRef:host-1', $xapi: fakeXapi }
    const restApi = {
      getXapiObject: (...args: unknown[]) => {
        getXapiObjectArgs = args
        return xapiHost
      },
    } as unknown as RestApi

    const service = new SrService(restApi)
    const body = {
      hostId: 'host-uuid',
      name_label: 'NFS store',
      SR_type: 'nfs',
      size: 1234,
      device_config: { server: '10.0.0.1', serverpath: '/data' },
    } as CreateSrBody

    const id = await service.create(body)

    // host id is resolved against the 'host' collection
    assert.deepEqual(getXapiObjectArgs, ['host-uuid', 'host'])
    // body.hostId (XO id) is replaced by the XAPI ref, SR_type/size are mapped to
    // XAPI's type/physical_size, shared is computed from SR_type (nfs -> shared),
    // device_config is forwarded untouched
    assert.deepEqual(srCreateParams, {
      name_label: 'NFS store',
      type: 'nfs',
      physical_size: 1234,
      shared: true,
      device_config: { server: '10.0.0.1', serverpath: '/data' },
      host: 'OpaqueRef:host-1',
    })
    // uuid is read back from the freshly created SR ref
    assert.deepEqual(getFieldArgs, ['SR', 'OpaqueRef:new-sr', 'uuid'])
    assert.equal(id, 'sr-uuid-123')
  })

  it('computes shared from SR_type and forces content_type for ISO SRs', async () => {
    const srCreateCalls: Record<string, unknown>[] = []
    const fakeXapi = {
      SR_create: async (params: Record<string, unknown>) => {
        srCreateCalls.push(params)
        return 'OpaqueRef:new-sr'
      },
      getField: async () => 'sr-uuid-123',
    }
    const restApi = {
      getXapiObject: () => ({ $ref: 'OpaqueRef:host-1', $xapi: fakeXapi }),
    } as unknown as RestApi
    const service = new SrService(restApi)

    // local SR type -> not shared
    await service.create({
      hostId: 'host-uuid',
      name_label: 'local',
      SR_type: 'ext',
      device_config: {},
    } as CreateSrBody)
    assert.equal(srCreateCalls[0].shared, false)
    assert.equal('content_type' in srCreateCalls[0], false)

    // remote ISO library -> shared, content_type forced to 'iso'
    await service.create({
      hostId: 'host-uuid',
      name_label: 'isos',
      SR_type: 'iso',
      device_config: { location: '10.0.0.1:/isos' },
    } as CreateSrBody)
    assert.equal(srCreateCalls[1].shared, true)
    assert.equal(srCreateCalls[1].content_type, 'iso')

    // local ISO library (legacy_mode) -> not shared
    await service.create({
      hostId: 'host-uuid',
      name_label: 'local isos',
      SR_type: 'iso',
      device_config: { legacy_mode: 'true', location: '/media/isos' },
    } as CreateSrBody)
    assert.equal(srCreateCalls[2].shared, false)
    assert.equal(srCreateCalls[2].content_type, 'iso')
  })

  it('rejects linstor (XOSTOR) SR creation with 501', async () => {
    const service = new SrService({} as RestApi)
    const body = {
      hostId: 'host-uuid',
      name_label: 'XOSTOR',
      SR_type: 'linstor',
      device_config: {},
    } as CreateSrBody

    await assert.rejects(service.create(body), (error: unknown) => {
      assert.ok(error instanceof ApiError)
      assert.equal(error.status, 501)
      return true
    })
  })
})

describe('SrService.validateImportVdiFromUrl and SrService.importVdiFromUrl', () => {
  const SR_ID = 'sr-uuid' as XoSr['id']
  const ISO_SR = { content_type: 'iso', type: 'iso', is_tools_sr: false }

  // returns the service and the calls made to XAPI
  function setup(srRecord: Record<string, unknown> = ISO_SR, { importError }: { importError?: Error } = {}) {
    const calls = {
      getXapiObject: [] as unknown[][],
      SR_importVdi: [] as unknown[][],
      getField: [] as unknown[][],
    }
    const fakeXapi = {
      SR_importVdi: async (...args: unknown[]) => {
        calls.SR_importVdi.push(args)
        if (importError !== undefined) {
          throw importError
        }
        return 'OpaqueRef:new-vdi'
      },
      getField: async (...args: unknown[]) => {
        calls.getField.push(args)
        return 'vdi-uuid-123'
      },
    }
    const restApi = {
      getXapiObject: (...args: unknown[]) => {
        calls.getXapiObject.push(args)
        return { ...srRecord, $ref: 'OpaqueRef:sr-1', $xapi: fakeXapi }
      },
    } as unknown as RestApi

    return { calls, service: new SrService(restApi) }
  }

  // a response whose body records whether it has been cancelled
  function createResponse({ status = 200, headers = {} }: { status?: number; headers?: Record<string, string> } = {}) {
    const body = { cancelled: false }
    const response = new Response(
      new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('iso'))
          controller.close()
        },
        cancel() {
          body.cancelled = true
        },
      }),
      { status, headers }
    )
    return { body, response }
  }

  const isInvalidParameters = (error: unknown) => invalidParameters.is(error)
  const isBadGateway = (error: unknown): error is ApiError => error instanceof ApiError && error.status === 502

  it('imports the URL content as a raw VDI in the ISO SR and returns the VDI uuid', async t => {
    const { response } = createResponse({ headers: { 'content-length': '3' } })
    const fetchMock = t.mock.method(globalThis, 'fetch', async () => response)
    const { calls, service } = setup()

    const id = await service.importVdiFromUrl(SR_ID, new URL('https://example.net/isos/debian-13.iso'), {
      name_label: 'Debian',
      name_description: 'installer',
    })

    assert.deepEqual(calls.getXapiObject, [[SR_ID, 'SR']])
    assert.equal(fetchMock.mock.callCount(), 1)
    const [fetchUrl, fetchInit] = fetchMock.mock.calls[0].arguments as [URL, RequestInit]
    assert.equal(String(fetchUrl), 'https://example.net/isos/debian-13.iso')
    // no transparent decompression, so that Content-Length matches the received data
    assert.deepEqual(fetchInit.headers, { 'accept-encoding': 'identity' })

    assert.equal(calls.SR_importVdi.length, 1)
    const [srRef, stream, opts] = calls.SR_importVdi[0] as [string, Readable & { length?: number }, unknown]
    assert.equal(srRef, 'OpaqueRef:sr-1')
    // the size of a raw VDI comes from the Content-Length header
    assert.equal(stream.length, 3)
    assert.deepEqual(opts, {
      format: SUPPORTED_VDI_FORMAT.raw,
      name_label: 'Debian',
      name_description: 'installer',
    })

    assert.deepEqual(calls.getField, [['VDI', 'OpaqueRef:new-vdi', 'uuid']])
    assert.equal(id, 'vdi-uuid-123')
  })

  it('defaults name_label to the decoded file name of the URL', async t => {
    const { response } = createResponse({ headers: { 'content-length': '3' } })
    t.mock.method(globalThis, 'fetch', async () => response)
    const { calls, service } = setup()

    await service.importVdiFromUrl(SR_ID, new URL('https://example.net/isos/my%20distro.iso?token=abc'), {})

    const opts = calls.SR_importVdi[0][2] as { name_label: string }
    assert.equal(opts.name_label, 'my distro.iso')
  })

  for (const [description, url] of [
    ['an invalid URL', 'not a url'],
    ['a non HTTP(S) URL', 'ftp://example.net/debian.iso'],
    ['a file URL', 'file:///etc/passwd'],
    ['a URL with credentials', 'https://alice:s3cret@example.net/debian.iso'],
    ['a URL with a username only', 'https://alice@example.net/debian.iso'],
  ]) {
    it(`rejects ${description} with invalid parameters, before looking up the SR`, () => {
      const { calls, service } = setup()

      assert.throws(() => service.validateImportVdiFromUrl(SR_ID, url), isInvalidParameters)
      assert.equal(calls.getXapiObject.length, 0)
    })
  }

  for (const [description, srRecord] of [
    ['a VM SR', { content_type: 'user', type: 'nfs', is_tools_sr: false }],
    ['the XCP-ng tools SR', { content_type: 'iso', type: 'iso', is_tools_sr: true }],
    ['the DVD drives SR', { content_type: 'iso', type: 'udev', is_tools_sr: false }],
  ] as const) {
    it(`rejects ${description} with invalid parameters`, () => {
      const { service } = setup(srRecord)

      assert.throws(
        () => service.validateImportVdiFromUrl(SR_ID, 'https://example.net/debian.iso'),
        isInvalidParameters
      )
    })
  }

  it('returns the parsed URL for an HTTP(S) URL and an ISO SR, without any download', t => {
    const fetchMock = t.mock.method(globalThis, 'fetch', async () => createResponse().response)
    const { calls, service } = setup()

    const url = service.validateImportVdiFromUrl(SR_ID, 'https://example.net/isos/debian-13.iso?token=abc')

    assert.ok(url instanceof URL)
    assert.equal(url.href, 'https://example.net/isos/debian-13.iso?token=abc')
    assert.deepEqual(calls.getXapiObject, [[SR_ID, 'SR']])
    assert.equal(fetchMock.mock.callCount(), 0)
  })

  it('rejects with 502 when the remote server returns an error, and frees the response body', async t => {
    const { body, response } = createResponse({ status: 404 })
    t.mock.method(globalThis, 'fetch', async () => response)
    const { calls, service } = setup()

    await assert.rejects(service.importVdiFromUrl(SR_ID, new URL('https://example.net/missing.iso'), {}), error => {
      assert.ok(isBadGateway(error))
      assert.match((error as Error).message, /404/)
      return true
    })
    assert.equal(body.cancelled, true)
    assert.equal(calls.SR_importVdi.length, 0)
  })

  it('rejects with 502 when the download cannot start, keeping the URL origin', async t => {
    const networkError = new TypeError('fetch failed', { cause: new Error('getaddrinfo ENOTFOUND example.net') })
    t.mock.method(globalThis, 'fetch', async () => {
      throw networkError
    })
    const { calls, service } = setup()

    await assert.rejects(service.importVdiFromUrl(SR_ID, new URL('https://example.net/debian.iso'), {}), error => {
      assert.ok(isBadGateway(error))
      assert.match(error.message, /https:\/\/example\.net/)
      return true
    })
    assert.equal(calls.SR_importVdi.length, 0)
  })

  it('closes the download when the import fails', async t => {
    const { response } = createResponse({ headers: { 'content-length': '3' } })
    t.mock.method(globalThis, 'fetch', async () => response)
    const importError = new Error('VDI.create failed')
    const { calls, service } = setup(ISO_SR, { importError })

    await assert.rejects(service.importVdiFromUrl(SR_ID, new URL('https://example.net/debian.iso'), {}), importError)
    const stream = calls.SR_importVdi[0][1] as Readable
    assert.equal(stream.destroyed, true)
  })

  it('rejects with 502 when there is no Content-Length, and frees the response body', async t => {
    const { body, response } = createResponse()
    t.mock.method(globalThis, 'fetch', async () => response)
    const { calls, service } = setup()

    await assert.rejects(service.importVdiFromUrl(SR_ID, new URL('https://example.net/debian.iso'), {}), isBadGateway)
    assert.equal(body.cancelled, true)
    assert.equal(calls.SR_importVdi.length, 0)
  })

  it('rejects with 502 when the response has no body', async t => {
    t.mock.method(globalThis, 'fetch', async () => new Response(null, { status: 200 }))
    const { calls, service } = setup()

    await assert.rejects(service.importVdiFromUrl(SR_ID, new URL('https://example.net/debian.iso'), {}), isBadGateway)
    assert.equal(calls.SR_importVdi.length, 0)
  })

  describe('never leaks the full URL, which can contain a secret, in errors', () => {
    const SECRET_URL = 'https://example.net/isos/debian.iso?token=s3cret'
    const assertNoSecret = (error: unknown) => {
      const { message } = error as Error
      assert.doesNotMatch(message, /s3cret|debian\.iso/)
      return true
    }

    it('when the remote server returns an error', async t => {
      t.mock.method(globalThis, 'fetch', async () => createResponse({ status: 403 }).response)
      const { service } = setup()

      await assert.rejects(service.importVdiFromUrl(SR_ID, new URL(SECRET_URL), {}), assertNoSecret)
    })

    it('when the download cannot start', async t => {
      t.mock.method(globalThis, 'fetch', async () => {
        throw new TypeError('fetch failed')
      })
      const { service } = setup()

      await assert.rejects(service.importVdiFromUrl(SR_ID, new URL(SECRET_URL), {}), assertNoSecret)
    })

    it('when there is no Content-Length', async t => {
      t.mock.method(globalThis, 'fetch', async () => createResponse().response)
      const { service } = setup()

      await assert.rejects(service.importVdiFromUrl(SR_ID, new URL(SECRET_URL), {}), assertNoSecret)
    })

    it('when the URL is invalid', () => {
      const { service } = setup()

      assert.throws(() => service.validateImportVdiFromUrl(SR_ID, 'not a url?token=s3cret'), assertNoSecret)
    })
  })
})
