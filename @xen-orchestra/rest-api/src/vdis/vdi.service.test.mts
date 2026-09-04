import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { Readable } from 'node:stream'
import { VHD_MAX_SIZE } from '@xen-orchestra/xapi'

import { ApiError } from '../helpers/error.helper.mjs'
import { VdiService } from './vdi.service.mjs'
import type { RestApi } from '../rest-api/rest-api.mjs'
import type { XoVdi } from '@vates/types'

const VDI_ID = 'c77f9955-c1d2-4b39-aa1c-73cdb2dacb7e' as XoVdi['id']

describe('VdiService.exportContent', () => {
  it('exports the raw format through the XAPI, with the virtual size as length', async () => {
    const size = 10 * 1024 * 1024 * 1024
    // the XAPI does not announce the size of a raw export, XO computes it
    const stream = Readable.from(['content']) as Readable & { length?: number }
    let exportContentArgs: unknown[] | undefined

    const restApi = {
      getXapiObject: () => ({
        $ref: 'OpaqueRef:vdi-1',
        virtual_size: size,
        $xapi: {
          VDI_exportContent: async (...args: unknown[]) => {
            exportContentArgs = args
            return stream
          },
        },
      }),
    } as unknown as RestApi

    const exported = await new VdiService(restApi).exportContent(VDI_ID, 'VDI', { format: 'raw' })

    assert.strictEqual(exported, stream)
    // `length` is only exposed to the controllers, which turn it into a content-length
    assert.strictEqual(exported.length, size)
    assert.deepStrictEqual(exportContentArgs, ['OpaqueRef:vdi-1', { format: 'raw' }])
  })

  it('rejects a VHD export of a VDI larger than the VHD max size', async () => {
    const size = VHD_MAX_SIZE + 1
    const restApi = {
      getObject: () => ({ id: VDI_ID, size }),
      getXapiObject: () => assert.fail('the disk must not be opened when the size is not supported'),
    } as unknown as RestApi

    await assert.rejects(new VdiService(restApi).exportContent(VDI_ID, 'VDI', { format: 'vhd' }), (error: unknown) => {
      assert(error instanceof ApiError)
      assert.strictEqual(error.status, 422)
      assert.deepStrictEqual(error.data, { maxSize: VHD_MAX_SIZE, size })
      return true
    })
  })
})
