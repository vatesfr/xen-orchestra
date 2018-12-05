/* eslint-env jest */

import 'dotenv/config'
import asyncIteratorToStream from 'async-iterator-to-stream'
import getStream from 'get-stream'
import { fromCallback } from 'promise-toolbox'
import { pipeline } from 'readable-stream'
import { tmpdir } from 'os'

import { getHandler } from '.'

// https://gist.github.com/julien-f/3228c3f34fdac01ade09
const unsecureRandomBytes = n => {
  const bytes = Buffer.alloc(n)

  const odd = n & 1
  for (let i = 0, m = n - odd; i < m; i += 2) {
    bytes.writeUInt16BE((Math.random() * 65536) | 0, i)
  }

  if (odd) {
    bytes.writeUInt8((Math.random() * 256) | 0, n - 1)
  }

  return bytes
}

const TEST_DATA = unsecureRandomBytes(1024)
const createTestDataStream = asyncIteratorToStream(function*() {
  yield TEST_DATA
})

const rejectionOf = p =>
  p.then(
    value => {
      throw value
    },
    reason => reason
  )

const handlers = [`file://${tmpdir()}`]
if (process.env.xo_fs_nfs) handlers.push(process.env.xo_fs_nfs)
if (process.env.xo_fs_smb) handlers.push(process.env.xo_fs_smb)

handlers.forEach(url => {
  describe(url, () => {
    let handler

    beforeAll(async () => {
      handler = getHandler({ url }).addPrefix(`xo-fs-tests-${Date.now()}`)
      await handler.sync()
    })
    afterAll(async () => {
      await handler.forget()
      handler = undefined
    })

    beforeEach(async () => {
      // ensure test dir exists
      await handler.mkdir('.')
    })
    afterEach(async () => {
      await handler.rmtree('.')
    })

    describe('#type', () => {
      it('returns the type of the remote', () => {
        expect(typeof handler.type).toBe('string')
      })
    })

    describe('#createOutputStream()', () => {
      it('returns a writable stream', async () => {
        const stream = await handler.createOutputStream('file')
        await fromCallback(cb => pipeline(createTestDataStream(), stream, cb))
        await expect(await handler.readFile('file')).toEqual(TEST_DATA)
      })

      it('works on an opened files', async () => {
        const fd = await handler.openFile('file', 'wx')
        try {
          const stream = await handler.createOutputStream(fd)
          await fromCallback(cb => pipeline(createTestDataStream(), stream, cb))
        } finally {
          await handler.closeFile(fd)
        }
        await expect(await handler.readFile('file')).toEqual(TEST_DATA)
      })
    })

    describe('#createReadStream()', () => {
      it(`should return a stream`, async () => {
        await handler.outputFile('file', TEST_DATA)
        const buffer = await getStream.buffer(
          await handler.createReadStream('file')
        )

        await expect(buffer).toEqual(TEST_DATA)
      })

      it('works on an opened files', async () => {
        await handler.outputFile('file', TEST_DATA)
        const fd = await handler.openFile('file', 'r')
        let buffer
        try {
          buffer = await getStream.buffer(await handler.createReadStream(fd))
        } finally {
          await handler.closeFile(fd)
        }
        await expect(buffer).toEqual(TEST_DATA)
      })
    })

    describe('#getSize()', () => {
      it(`should return the correct size`, async () => {
        await handler.outputFile('file', TEST_DATA)
        expect(await handler.getSize('file')).toEqual(TEST_DATA.length)
      })

      it('works on an opened file', async () => {
        await handler.outputFile('file', TEST_DATA)
        const fd = await handler.openFile('file', 'r')
        let size
        try {
          size = await handler.getSize(fd)
        } finally {
          await handler.closeFile(fd)
        }
        expect(size).toEqual(TEST_DATA.length)
      })
    })

    describe('#list()', () => {
      it(`should list the content of folder`, async () => {
        await handler.outputFile('file', TEST_DATA)
        await expect(await handler.list('.')).toEqual(['file'])
      })

      it('can prepend the directory to entries', async () => {
        await handler.outputFile('dir/file', '')
        expect(await handler.list('dir', { prependDir: true })).toEqual([
          '/dir/file',
        ])
      })
    })

    describe('#mkdir()', () => {
      it('creates a directory', async () => {
        await handler.mkdir('dir')
        await expect(await handler.list('.')).toEqual(['dir'])
      })

      it('does not throw on existing directory', async () => {
        await handler.mkdir('dir')
        await handler.mkdir('dir')
      })

      it('throws ENOTDIR on existing file', async () => {
        await handler.outputFile('file', '')
        const error = await rejectionOf(handler.mkdir('file'))
        expect(error.code).toBe('ENOTDIR')
      })
    })

    describe('#mktree()', () => {
      it('creates a tree of directories', async () => {
        await handler.mktree('dir/dir')
        await expect(await handler.list('.')).toEqual(['dir'])
        await expect(await handler.list('dir')).toEqual(['dir'])
      })

      it('does not throw on existing directory', async () => {
        await handler.mktree('dir/dir')
        await handler.mktree('dir/dir')
      })

      it('throws ENOTDIR on existing file', async () => {
        await handler.outputFile('dir/file', '')
        const error = await rejectionOf(handler.mktree('dir/file'))
        expect(error.code).toBe('ENOTDIR')
      })

      it('throws ENOTDIR on existing file in path', async () => {
        await handler.outputFile('file', '')
        const error = await rejectionOf(handler.mktree('file/dir'))
        expect(error.code).toBe('ENOTDIR')
      })
    })

    describe('#outputFile()', () => {
      it('writes data to a file', async () => {
        await handler.outputFile('file', TEST_DATA)
        expect(await handler.readFile('file')).toEqual(TEST_DATA)
      })

      it('throws on existing files', async () => {
        await handler.outputFile('file', '')
        const error = await rejectionOf(handler.outputFile('file', ''))
        expect(error.code).toBe('EEXIST')
      })
    })

    describe('#readFile', () => {
      it('returns a buffer containing the contents of the file', async () => {
        await handler.outputFile('file', TEST_DATA)
        expect(await handler.readFile('file')).toEqual(TEST_DATA)
      })

      it('throws on missing file', async () => {
        const error = await rejectionOf(handler.readFile('file'))
        expect(error.code).toBe('ENOENT')
      })
    })

    describe('#rename()', () => {
      it(`should rename the file`, async () => {
        await handler.outputFile('file', TEST_DATA)
        await handler.rename('file', `file2`)

        expect(await handler.list('.')).toEqual(['file2'])
        expect(await handler.readFile(`file2`)).toEqual(TEST_DATA)
      })
    })

    describe('#rmdir()', () => {
      it('should remove an empty directory', async () => {
        await handler.mkdir('dir')
        await handler.rmdir('dir')
        expect(await handler.list('.')).toEqual([])
      })

      it(`should throw on non-empty directory`, async () => {
        await handler.outputFile('dir/file', '')

        const error = await rejectionOf(handler.rmdir('.'))
        await expect(error.code).toEqual('ENOTEMPTY')
      })

      it('does not throw on missing directory', async () => {
        await handler.rmdir('dir')
      })
    })

    describe('#rmtree', () => {
      it(`should remove a directory resursively`, async () => {
        await handler.outputFile('dir/file', '')
        await handler.rmtree('dir')

        expect(await handler.list('.')).toEqual([])
      })
    })

    describe('#test()', () => {
      it('tests the remote appears to be working', async () => {
        expect(await handler.test()).toEqual({
          success: true,
        })
      })
    })

    describe('#unlink()', () => {
      it(`should remove the file`, async () => {
        await handler.outputFile('file', TEST_DATA)
        await handler.unlink('file')

        await expect(await handler.list('.')).toEqual([])
      })

      it('does not throw on missing file', async () => {
        await handler.unlink('file')
      })
    })
  })
})
