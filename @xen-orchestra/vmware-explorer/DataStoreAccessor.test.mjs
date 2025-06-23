import { describe, it, beforeEach, mock } from 'node:test'
import assert from 'node:assert'
import { EsxiDatastore } from './DataStoreAccessor.mjs'
import { Buffer } from 'node:buffer'
import {Readable} from 'node:stream'

describe('EsxiDatastore', () => {
  let mockEsxi
  let datastore

  beforeEach(() => {
    mockEsxi = {
      download: mock.fn(async (ds, path, range) => {
        const size = 10 * 1024 * 1024 // 10MB test file
        let from = 0
        let to = size
        
        if (range) {
          ;[from, to] = range.split('-').map(Number)
          if (isNaN(to)) to = size
        }

        const generator = { 
          [Symbol.asyncIterator]() {
            let pos = from
            return {
              next: () => {
                if (pos >= to) return Promise.resolve({ done: true })
                const chunkSize = Math.min(64 * 1024, to - pos)
                pos += chunkSize
                return Promise.resolve({ 
                  value: Buffer.alloc(chunkSize, `data-${pos}`), 
                  done: false 
                })
              }
            }
          }
        }
        const stream =  Readable.from(generator, {objectMode: false})
        return {
          body:stream, 
          headers: new Map([['content-length', String(to - from)]])
        }
      })
    }

    datastore = new EsxiDatastore(mockEsxi, 'test-datastore')
  })

  describe('open', () => {
    it('should open a stream and return a descriptor', async () => {
      const descriptor = await datastore.open('/test.vmdk')
      assert.strictEqual(descriptor, 0)
      assert.strictEqual(mockEsxi.download.mock.calls.length, 1)
      const call = mockEsxi.download.mock.calls[0]
      assert.deepStrictEqual(call.arguments, ['test-datastore', '/test.vmdk', undefined])
    })

    it('should open with range when specified', async () => {
      const descriptor = await datastore.open('/test.vmdk', {from:1024, to:2048})
      assert.strictEqual(descriptor, 0)
      assert.strictEqual(mockEsxi.download.mock.calls.length, 1)
      const call = mockEsxi.download.mock.calls[0]
      assert.deepStrictEqual(call.arguments, ['test-datastore', '/test.vmdk', '1024-2048'])
    })
  })

  describe('read', () => {
    it('should read sequentially without reopening', async () => {
      const descriptor = await datastore.open('/test.vmdk')
      const buffer1 = Buffer.alloc(1024)
      const buffer2 = Buffer.alloc(1024)

      const result1 = await datastore.read(descriptor, buffer1, 0)
      const result2 = await datastore.read(descriptor, buffer2, 1024)

      assert.strictEqual(mockEsxi.download.mock.calls.length, 1)
      assert.strictEqual(result1.bytes_read, 1024)
      assert.strictEqual(result2.bytes_read, 1024)
      assert.strictEqual(result1.buffer, buffer1) // Verify we're using the same buffer
      assert.strictEqual(result2.buffer, buffer2)
    })

    it('should read directly into provided buffer', async () => {
      const descriptor = await datastore.open('/test.vmdk')
      const buffer = Buffer.alloc(2048)
      const fillBefore = buffer.toString('hex')

      const result = await datastore.read(descriptor, buffer, 0)

      assert.strictEqual(result.bytes_read, 2048)
      assert.strictEqual(result.buffer, buffer) // Same buffer
      assert.notStrictEqual(buffer.toString('hex'), fillBefore) // Buffer was modified
    })

    it('should handle parallel reads sequentially', async () => {
      const descriptor = await datastore.open('/test.vmdk')
      const buffer1 = Buffer.alloc(1024)
      const buffer2 = Buffer.alloc(1024)

      const [result1, result2] = await Promise.all([
        datastore.read(descriptor, buffer1, 0),
        datastore.read(descriptor, buffer2, 1024)
      ])

      assert.strictEqual(mockEsxi.download.mock.calls.length, 1)
      assert.strictEqual(result1.bytes_read, 1024)
      assert.strictEqual(result2.bytes_read, 1024)
    })

    it('should throw when reading beyond file end', async () => {
      const descriptor = await datastore.open('/test.vmdk')
      const buffer = Buffer.alloc(1024)

      await assert.rejects(
        () => datastore.read(descriptor, buffer, 10 * 1024 * 1024 - 512),
        {
          message: /after the end of the file/
        }
      )
    })
  })

  describe('close', () => {
    it('should close the stream and remove descriptor', async () => {
      const descriptor = await datastore.open('/test.vmdk')
    const buffer = Buffer.alloc(1024)
      const stream =await  datastore.read(descriptor,buffer)
      
      await datastore.close(descriptor)
      await assert.rejects(
        () => datastore.read(descriptor, Buffer.alloc(1), 0),
        /Descriptor [0-9]+ not found in.*/
      )
    })
  })

  describe('getSize', () => {
    it('should return file size', async () => {
      const size = await datastore.getSize('/test.vmdk')
      assert.strictEqual(size, 10 * 1024 * 1024)
    })
  })
})