import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

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
      shared: true,
      device_config: { server: '10.0.0.1', serverpath: '/data' },
    } as CreateSrBody

    const id = await service.create(body)

    // host id is resolved against the 'host' collection
    assert.deepEqual(getXapiObjectArgs, ['host-uuid', 'host'])
    // body.hostId (XO id) is replaced by the XAPI ref, SR_type/size are mapped to
    // XAPI's type/physical_size, device_config is forwarded untouched
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

  it('rejects linstor (XOSTOR) SR creation', async () => {
    const service = new SrService({} as RestApi)
    const body = {
      hostId: 'host-uuid',
      name_label: 'XOSTOR',
      SR_type: 'linstor',
      shared: true,
      device_config: {},
    } as CreateSrBody

    await assert.rejects(service.create(body), (error: unknown) => {
      assert.ok(error instanceof ApiError)
      assert.equal(error.status, 403)
      return true
    })
  })
})
