import { after, afterEach, before, beforeEach, describe, it } from 'node:test'
import { strict as assert } from 'assert'

import 'dotenv/config'
import { forOwn, random } from 'lodash'

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

const TEST_DATA_LEN = 1024
const TEST_DATA = unsecureRandomBytes(TEST_DATA_LEN)

const rejectionOf = p =>
  p.then(
    value => {
      throw value
    },
    reason => reason
  )

const handlers = [`file://${__dirname}`]
if (process.env.xo_fs_nfs) handlers.push(process.env.xo_fs_nfs)
if (process.env.xo_fs_smb) handlers.push(process.env.xo_fs_smb)

handlers.forEach(url => {
  describe(url, () => {
    let handler

    const testWithFileDescriptor = (path, flags, fn) => {
      it('with path', () => fn({ file: path, flags }))
      it('with file descriptor', async () => {
        const file = await handler.openFile(path, flags)
        try {
          await fn({ file })
        } finally {
          await handler.closeFile(file)
        }
      })
    }

    before(async () => {
      handler = getHandler({ url }).addPrefix(`xo-fs-tests-${Date.now()}`)
      await handler.sync()
    })
    after(async () => {
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
        assert.equal(typeof handler.type, 'string')
      })
    })

    describe('#getInfo()', () => {
      let info
      before(async () => {
        info = await handler.getInfo()
      })

      it('should return an object with info', async () => {
        assert.equal(typeof info, 'object')
      })

      it('should return correct type of attribute', async () => {
        if (info.size !== undefined) {
          assert.equal(typeof info.size, 'number')
        }
        if (info.used !== undefined) {
          assert.equal(typeof info.used, 'number')
        }
      })
    })

    describe('#getSize()', () => {
      beforeEach(() => handler.outputFile('file', TEST_DATA))

      testWithFileDescriptor('file', 'r', async () => {
        assert.equal(await handler.getSize('file'), TEST_DATA_LEN)
      })
    })

    describe('#list()', () => {
      it(`should list the content of folder`, async () => {
        await handler.outputFile('file', TEST_DATA)
        assert.deepEqual(await handler.list('.'), ['file'])
      })

      it('can prepend the directory to entries', async () => {
        await handler.outputFile('dir/file', '')
        assert.deepEqual(await handler.list('dir', { prependDir: true }), ['/dir/file'])
      })

      it('throws ENOENT if no such directory', async () => {
        assert.equal((await rejectionOf(handler.list('dir'))).code, 'ENOENT')
      })

      it('can returns empty for missing directory', async () => {
        assert.deepEqual(await handler.list('dir', { ignoreMissing: true }), [])
      })
    })

    describe('#mkdir()', () => {
      it('creates a directory', async () => {
        await handler.mkdir('dir')
        assert.deepEqual(await handler.list('.'), ['dir'])
      })

      it('does not throw on existing directory', async () => {
        await handler.mkdir('dir')
        await handler.mkdir('dir')
      })

      it('throws ENOTDIR on existing file', async () => {
        await handler.outputFile('file', '')
        const error = await rejectionOf(handler.mkdir('file'))
        assert.equal(error.code, 'ENOTDIR')
      })
    })

    describe('#mktree()', () => {
      it('creates a tree of directories', async () => {
        await handler.mktree('dir/dir')
        assert.deepEqual(await handler.list('.'), ['dir'])
        assert.deepEqual(await handler.list('dir'), ['dir'])
      })

      it('does not throw on existing directory', async () => {
        await handler.mktree('dir/dir')
        await handler.mktree('dir/dir')
      })

      it('throws ENOTDIR on existing file', async () => {
        await handler.outputFile('dir/file', '')
        const error = await rejectionOf(handler.mktree('dir/file'))
        assert.equal(error.code, 'ENOTDIR')
      })

      it('throws ENOTDIR on existing file in path', async () => {
        await handler.outputFile('file', '')
        const error = await rejectionOf(handler.mktree('file/dir'))
        assert.equal(error.code, 'ENOTDIR')
      })
    })

    describe('#outputFile()', () => {
      it('writes data to a file', async () => {
        await handler.outputFile('file', TEST_DATA)
        assert.deepEqual(await handler.readFile('file'), TEST_DATA)
      })

      it('throws on existing files', async () => {
        await handler.unlink('file')
        await handler.outputFile('file', '')
        const error = await rejectionOf(handler.outputFile('file', ''))
        assert.equal(error.code, 'EEXIST')
      })

      it("shouldn't timeout in case of the respect of the parallel execution restriction", async () => {
        const handler = getHandler({ url }, { maxParallelOperations: 1 })
        await handler.sync()
        await handler.outputFile(`xo-fs-tests-${Date.now()}/test`, '')
      }, 40)
    })

    describe('#read()', () => {
      beforeEach(() => handler.outputFile('file', TEST_DATA))

      const start = random(TEST_DATA_LEN)
      const size = random(TEST_DATA_LEN)

      testWithFileDescriptor('file', 'r', async ({ file }) => {
        const buffer = Buffer.alloc(size)
        const result = await handler.read(file, buffer, start)
        assert.deepEqual(result.buffer, buffer)
        assert.deepEqual(result, {
          buffer,
          bytesRead: Math.min(size, TEST_DATA_LEN - start),
        })
      })
    })

    describe('#readFile', () => {
      it('returns a buffer containing the contents of the file', async () => {
        await handler.outputFile('file', TEST_DATA)
        assert.deepEqual(await handler.readFile('file'), TEST_DATA)
      })

      it('throws on missing file', async () => {
        await handler.unlink('file')
        const error = await rejectionOf(handler.readFile('file'))
        assert.equal(error.code, 'ENOENT')
      })
    })

    describe('#rename()', () => {
      it(`should rename the file`, async () => {
        await handler.outputFile('file', TEST_DATA)
        await handler.rename('file', `file2`)

        assert.deepEqual(await handler.list('.'), ['file2'])
        assert.deepEqual(await handler.readFile(`file2`), TEST_DATA)
      })
      it(`should rename the file and create dest directory`, async () => {
        await handler.outputFile('file', TEST_DATA)
        await handler.rename('file', `sub/file2`)

        assert.deepEqual(await handler.list('sub'), ['file2'])
        assert.deepEqual(await handler.readFile(`sub/file2`), TEST_DATA)
      })
      it(`should fail with enoent if source file is missing`, async () => {
        const error = await rejectionOf(handler.rename('file', `sub/file2`))
        assert.equal(error.code, 'ENOENT')
      })
    })

    describe('#rmdir()', () => {
      it('should remove an empty directory', async () => {
        await handler.mkdir('dir')
        await handler.rmdir('dir')
        assert.deepEqual(await handler.list('.'), [])
      })

      it(`should throw on non-empty directory`, async () => {
        await handler.outputFile('dir/file', '')

        const error = await rejectionOf(handler.rmdir('.'))
        assert.equal(error.code, 'ENOTEMPTY')
        await handler.unlink('dir/file')
      })

      it('does not throw on missing directory', async () => {
        await handler.rmdir('dir')
      })
    })

    describe('#rmtree', () => {
      it(`should remove a directory resursively`, async () => {
        await handler.outputFile('dir/file', '')
        await handler.rmtree('dir')

        assert.deepEqual(await handler.list('.'), [])
      })
    })

    describe('#test()', () => {
      it('tests the remote appears to be working', async () => {
        const answer = await handler.test()

        assert.equal(answer.success, true)
        assert.equal(typeof answer.writeRate, 'number')
        assert.equal(typeof answer.readRate, 'number')
      })
    })

    describe('#unlink()', () => {
      it(`should remove the file`, async () => {
        await handler.outputFile('file', TEST_DATA)
        await handler.unlink('file')

        assert.deepEqual(await handler.list('.'), [])
      })

      it('does not throw on missing file', async () => {
        await handler.unlink('file')
      })
    })

    describe('#write()', () => {
      beforeEach(() => handler.outputFile('file', TEST_DATA))
      afterEach(() => handler.unlink('file'))

      const PATCH_DATA_LEN = Math.ceil(TEST_DATA_LEN / 2)
      const PATCH_DATA = unsecureRandomBytes(PATCH_DATA_LEN)

      forOwn(
        {
          'dont increase file size': (() => {
            const offset = random(0, TEST_DATA_LEN - PATCH_DATA_LEN)

            const expected = Buffer.from(TEST_DATA)
            PATCH_DATA.copy(expected, offset)

            return { offset, expected }
          })(),
          'increase file size': (() => {
            const offset = random(TEST_DATA_LEN - PATCH_DATA_LEN + 1, TEST_DATA_LEN)

            const expected = Buffer.alloc(offset + PATCH_DATA_LEN)
            TEST_DATA.copy(expected)
            PATCH_DATA.copy(expected, offset)

            return { offset, expected }
          })(),
        },
        ({ offset, expected }, title) => {
          describe(title, () => {
            testWithFileDescriptor('file', 'r+', async ({ file }) => {
              await handler.write(file, PATCH_DATA, offset)
              assert.deepEqual(await handler.readFile('file'), expected)
            })
          })
        }
      )
    })

    describe('#truncate()', () => {
      afterEach(() => handler.unlink('file'))
      forOwn(
        {
          'shrinks file': (() => {
            const length = random(0, TEST_DATA_LEN)
            const expected = TEST_DATA.slice(0, length)
            return { length, expected }
          })(),
          'grows file': (() => {
            const length = random(TEST_DATA_LEN, TEST_DATA_LEN * 2)
            const expected = Buffer.alloc(length)
            TEST_DATA.copy(expected)
            return { length, expected }
          })(),
        },
        ({ length, expected }, title) => {
          it(title, async () => {
            await handler.outputFile('file', TEST_DATA)
            await handler.truncate('file', length)
            assert.deepEqual(await handler.readFile('file'), expected)
          })
        }
      )
    })
  })
})
