/* eslint-env jest */

import { getHandler } from '.'
import { tmpdir } from 'os'
import getStream from 'get-stream'

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

;[`file://${tmpdir()}`].forEach(url => {
  describe(url, () => {
    let handler
    const testDir = `xo-fs-tests-${Date.now()}`
    const testFile = `${testDir}/file`

    beforeAll(() => {
      handler = getHandler({ url })
    })
    afterAll(() => {
      handler = undefined
    })

    afterEach(async () => {
      await handler.rmdir(testDir, { recursive: true }).catch(error => {
        if (error.code !== 'ENOENT') {
          throw error
        }
      })
    })

    describe('#test()', () => {
      it('tests the remote appears to be working', async () => {
        expect(await handler.test()).toMatchSnapshot()
      })
    })

    describe('#outputFile()', () => {
      it('writes data to a file', async () => {
        await handler.outputFile(testFile, TEST_DATA)
        expect(await handler.readFile(testFile)).toEqual(TEST_DATA)
      })
    })

    describe('#list()', () => {
      it(`should list the content of folder`, async () => {
        await handler.outputFile(testFile, TEST_DATA)
        await expect(await handler.list(testDir)).toEqual(['file'])
      })
    })

    describe('#createReadStream()', () => {
      it(`should return a stream`, async () => {
        await handler.outputFile(testFile, TEST_DATA)
        const buffer = await getStream.buffer(
          await handler.createReadStream(testFile)
        )

        await expect(buffer).toEqual(TEST_DATA)
      })
    })
    describe('#getSize()', () => {
      it(`should return the correct size`, async () => {
        await handler.outputFile(testFile, TEST_DATA)
        expect(await handler.getSize(testFile)).toEqual(TEST_DATA.length)
      })
    })

    describe('#rename()', () => {
      it(`should rename the file`, async () => {
        await handler.outputFile(testFile, TEST_DATA)
        await handler.rename(testFile, `${testDir}/file2`)

        expect(await handler.list(testDir)).toEqual(['file2'])
        expect(await handler.readFile(`${testDir}/file2`)).toEqual(TEST_DATA)
      })
    })

    describe('#unlink()', () => {
      it(`should remove the file`, async () => {
        await handler.outputFile(testFile, TEST_DATA)
        await handler.unlink(testFile)

        await expect(await handler.list(testDir)).toEqual([])
      })
    })

    describe('#rmdir()', () => {
      it(`should remove folder resursively`, async () => {
        let error
        await handler.outputFile(testFile, TEST_DATA)
        await handler.rmdir(testDir, { recursive: true })

        try {
          await handler.list(testDir)
        } catch (e) {
          error = e
        }

        expect(error.code).toBe('ENOENT')
      })

      it(`should throw an error when recursive is false`, async () => {
        let error
        await handler.outputFile(testFile, TEST_DATA)

        try {
          await handler.rmdir(testDir)
        } catch (e) {
          error = e
        }

        await expect(error.code).toEqual('ENOTEMPTY')
      })
    })
  })
})
