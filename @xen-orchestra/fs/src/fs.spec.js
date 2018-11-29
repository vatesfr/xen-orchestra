/* eslint-env jest */

import { getHandler } from '.'
import fs from 'fs-extra'
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

    beforeAll(() => {
      handler = getHandler({ url })
    })
    afterAll(() => {
      handler = undefined
    })

    beforeEach(async () => {
      await handler.outputFile(`${testDir}/file`, TEST_DATA)
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
        expect(await handler.readFile(`${testDir}/file`)).toEqual(TEST_DATA)
      })
    })

    describe('list', () => {
      it(`should list the content of folder`, async () => {
        const content = await handler.list(testDir)
        const contentFolder = await fs.readdir(`${tmpdir}/${testDir}`)

        await expect(content).toEqual(contentFolder)
      })
    })

    describe('createReadStream', () => {
      it(`should return a stream`, async () => {
        const stream = await handler.createReadStream(`${testDir}/file`)
        const readStream = fs.createReadStream(`${tmpdir}/${testDir}/file`)

        await expect(stream.path).toEqual(readStream.path)
      })
    })
    describe('getSize', () => {
      it(`should return the correct size`, async () => {
        const fileSize = await handler.getSize(`${testDir}/file`)
        const stats = await fs.statSync(`${tmpdir}/${testDir}/file`)

        expect(fileSize).toEqual(stats.size)
      })
    })

    describe('rename', () => {
      it(`should rename the file`, async () => {
        await handler.rename(`${testDir}/file`, `${testDir}/file2`)
        await expect(fs.existsSync(`${tmpdir}/${testDir}/file2`)).toBe(true)
      })
    })

    describe('unlink', () => {
      it(`should remove the file`, async () => {
        await handler.unlink(`${testDir}/file`)

        expect(fs.existsSync(`${tmpdir}/${testDir}/file`)).toBe(false)
      })
    })

    describe('rmdir', () => {
      it(`should remove folder resursively`, async () => {
        await handler.rmdir(testDir, { recursive: true })

        expect(fs.existsSync(`${tmpdir}/${testDir}`)).toBe(false)
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
