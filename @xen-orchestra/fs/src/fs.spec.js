/* eslint-env jest */

import { getHandler } from '.'
import { tmpdir } from 'os'

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

    beforeEach(async () => {
      await handler.outputFile(testFile, TEST_DATA)
    })
    afterEach(async () => {
      await handler.rmdir(testDir, { recursive: true }).catch(error => {
        if (error.code !== 'ENOENT') {
          throw error
        }
      })
    })

    describe('test handler', () => {
      it(`handler doesn't crash`, async () => {
        expect(await handler.test()).toMatchSnapshot()
      })
    })

    describe('outputFile', () => {
      it('writes data to a file', async () => {
        expect(await handler.readFile(testFile)).toEqual(TEST_DATA)
      })
    })

    describe('list', () => {
      it(`should list the content of folder`, async () => {
        await expect(await handler.list(testDir)).toEqual(['file'])
      })
    })

    describe('createReadStream', () => {
      it(`should return a stream`, async () => {
        const stream = await handler.createReadStream(testFile)

        await expect(stream.path).toEqual(`${tmpdir}/${testFile}`)
      })
    })
    describe('getSize', () => {
      it(`should return the correct size`, async () => {
        expect(await handler.getSize(testFile)).toEqual(1024)
      })
    })

    describe('rename', () => {
      it(`should rename the file`, async () => {
        await handler.rename(testFile, `${testDir}/file2`)
        const file = await handler.createReadStream(`${testDir}/file2`)

        expect(file.path).toBe(`${tmpdir}/${testDir}/file2`)
      })
    })

    describe('unlink', () => {
      it(`should remove the file`, async () => {
        let error
        try {
          await handler.unlink(testFile)
          await handler.read(testFile)
        } catch (e) {
          error = e
        }

        await expect(error.code).toEqual('ENOENT')
      })
    })

    describe('rmdir', () => {
      it(`should remove folder resursively`, async () => {
        let error
        try {
          await handler.rmdir(testDir, { recursive: true })
          await handler.list(testDir)
        } catch (e) {
          error = e
        }

        expect(error.code).toBe('ENOENT')
      })

      it(`should throw an error when recursive is false`, async () => {
        let error
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
