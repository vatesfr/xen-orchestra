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
