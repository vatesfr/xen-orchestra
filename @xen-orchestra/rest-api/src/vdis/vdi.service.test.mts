import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { Readable } from 'node:stream'
import { RandomAccessDisk } from '@xen-orchestra/disk-transform'
import { SUPPORTED_VDI_FORMAT } from '@vates/types'
import { toVhdStream } from 'vhd-lib/disk-consumer/index.mjs'
import { VHD_MAX_SIZE } from '@xen-orchestra/xapi'

import { ApiError } from '../helpers/error.helper.mjs'
import { VdiService } from './vdi.service.mjs'
import type { DiskBlock } from '@xen-orchestra/disk-transform'
import type { RestApi } from '../rest-api/rest-api.mjs'
import type { XoVdi } from '@vates/types'

const VDI_ID = 'c77f9955-c1d2-4b39-aa1c-73cdb2dacb7e' as XoVdi['id']
const VDI_REF = 'OpaqueRef:vdi-1'

const BLOCK_SIZE = 2 * 1024 * 1024
const NB_BLOCKS = 4
const VIRTUAL_SIZE = NB_BLOCKS * BLOCK_SIZE
// the disk is sparse: the formats that only store the allocated blocks must not announce
// the virtual size
const ALLOCATED_BLOCK_INDEXES = [0, 2]

const EMPTY_BLOCK = Buffer.alloc(BLOCK_SIZE)
const buildBlockData = (index: number) => Buffer.alloc(BLOCK_SIZE, index + 1)

/**
 * Source of the VHD export the XAPI is mocked to return: the exports rebuilt by XO are
 * generated from the blocks of this disk.
 */
class InMemoryDisk extends RandomAccessDisk {
  getVirtualSize(): number {
    return VIRTUAL_SIZE
  }
  getBlockSize(): number {
    return BLOCK_SIZE
  }
  getBlockIndexes(): number[] {
    return [...ALLOCATED_BLOCK_INDEXES]
  }
  hasBlock(index: number): boolean {
    return ALLOCATED_BLOCK_INDEXES.includes(index)
  }
  async readBlock(index: number): Promise<DiskBlock> {
    return { index, data: buildBlockData(index) }
  }
  async init(): Promise<void> {}
  async close(): Promise<void> {}
  isDifferencing(): boolean {
    return false
  }
}

/** A raw export is byte for byte, unallocated blocks included. */
function createRawExport(): Readable {
  function* blocks() {
    for (let index = 0; index < NB_BLOCKS; index++) {
      yield ALLOCATED_BLOCK_INDEXES.includes(index) ? buildBlockData(index) : EMPTY_BLOCK
    }
  }

  return Readable.from(blocks(), { objectMode: false })
}

/**
 * The XAPI of this VDI only knows how to export it as raw or VHD: the other formats are
 * rebuilt by XO from the blocks of a `XapiDiskSource`, which is fed by the VHD export
 * here since NBD is not available.
 */
function createRestApi() {
  const exportContentCalls: unknown[][] = []

  const xapi = {
    // the disk source reads the format the VDI is stored in from its `sm_config`
    getField: async (_type: string, _ref: string, field: string) =>
      field === 'sm_config' ? { 'image-format': SUPPORTED_VDI_FORMAT.vhd } : undefined,
    VDI_exportContent: async (...args: unknown[]) => {
      exportContentCalls.push(args)
      const { format } = args[1] as { format: SUPPORTED_VDI_FORMAT }

      return format === SUPPORTED_VDI_FORMAT.raw ? createRawExport() : toVhdStream(new InMemoryDisk())
    },
  }

  const restApi = {
    getObject: () => ({ id: VDI_ID, size: VIRTUAL_SIZE }),
    getXapiObject: () => ({ $ref: VDI_REF, $xapi: xapi, virtual_size: VIRTUAL_SIZE }),
  } as unknown as RestApi

  return { exportContentCalls, restApi }
}

describe('VdiService.exportContent', () => {
  for (const format of Object.values(SUPPORTED_VDI_FORMAT)) {
    it(`announces, for the ${format} format, a length equal to the number of streamed bytes`, async () => {
      const { restApi } = createRestApi()

      const exported = await new VdiService(restApi).exportContent(VDI_ID, 'VDI', { format })

      // `length` is only exposed to the controllers, which turn it into a content-length:
      // it is sent before the export is generated, an export streaming more or less than
      // that breaks the download
      const announcedLength = exported.length
      assert.ok(
        Number.isInteger(announcedLength) && (announcedLength as number) > 0,
        `${format} must announce an integer length, got ${announcedLength}`
      )

      let streamedBytes = 0
      for await (const chunk of exported) {
        streamedBytes += chunk.length
      }

      assert.strictEqual(streamedBytes, announcedLength)
    })
  }

  it('exports the raw format through the XAPI, with the virtual size as length', async () => {
    const { exportContentCalls, restApi } = createRestApi()

    const exported = await new VdiService(restApi).exportContent(VDI_ID, 'VDI', { format: 'raw' })

    // the XAPI does not announce the size of a raw export, XO computes it from the VDI
    assert.strictEqual(exported.length, VIRTUAL_SIZE)
    // a raw export is not rebuilt from the disk source: it is the export of the XAPI itself
    assert.deepStrictEqual(exportContentCalls, [[VDI_REF, { format: 'raw' }]])

    exported.destroy()
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
