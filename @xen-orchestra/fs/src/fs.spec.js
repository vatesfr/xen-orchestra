/* eslint-env jest */

import { getHandler } from '.'
import { sep } from 'path'
import fs from 'fs-extra'
import os from 'os'

const tmpDir = os.tmpdir()
const handlerList = [
  { url: 'file://' + tmpDir },
  // {
  //   url: 'smb://login:pass@WORKGROUP\\\\ip\\smb\u0000',
  //   id: '12345',
  // },
  // {
  //   url: 'nfs://ip:/tmp/test',
  //   id: '12345',
  // },
]

const testDir = `${tmpDir}${sep}tests_${Date.now()}`
const pathFile = `${testDir}${sep}file`

handlerList.forEach(element => {
  let handler

  beforeAll(async () => {
    handler = getHandler(element)
    await handler.outputFile(pathFile, '')
  })

  afterAll(async () => {
    if (fs.existsSync(testDir)) {
      await handler.rmdir(testDir, { recursive: true })
    }
    handler = null
  })

  describe('test()', () => {
    it(`handler doesn't crash`, async () => {
      const result = await handler.test()

      expect(result).toMatchSnapshot()
    })
  })

  describe('outputFile()', () => {
    it(`should put the correct content in file`, async () => {
      const content = 'unit test'
      await handler.outputFile(pathFile, content)
      const contentFile = fs.readFileSync(pathFile, 'utf8')

      await expect(contentFile).toEqual(content)
    })
  })

  describe('readFile()', () => {
    it(`should read the correct content in file`, async () => {
      const content = await handler.readFile(pathFile, 'utf8')
      const contentFile = fs.readFileSync(pathFile, 'utf8')

      await expect(content).toEqual(contentFile)
    })
  })

  describe('list()', () => {
    it(`should list the content of folder`, async () => {
      const content = await handler.list(testDir)
      const contentFolder = fs.readdirSync(testDir)

      await expect(content).toEqual(contentFolder)
    })
  })

  describe('createReadStream()', () => {
    it(`should return a stream`, async () => {
      const stream = await handler.createReadStream(pathFile)
      const readStream = fs.createReadStream(pathFile)

      await expect(stream.path).toEqual(readStream.path)
    })
  })

  describe('getSize()', () => {
    it(`should return the correct size`, async () => {
      const fileSize = await handler.getSize(pathFile)
      const stats = await fs.statSync(pathFile)

      expect(fileSize).toEqual(stats.size)
    })
  })

  describe('rename()', () => {
    afterAll(() => {
      fs.unlinkSync(`${testDir}${sep}file2`)
    })

    it(`should rename the file`, async () => {
      await handler.rename(pathFile, `${testDir}${sep}file2`)
      await expect(fs.existsSync(`${testDir}${sep}file2`)).toBe(true)
    })
  })

  describe('unlink()', () => {
    it(`should remove the file`, async () => {
      await handler.unlink(pathFile)

      expect(fs.existsSync(pathFile)).toBe(false)
    })
  })

  describe('rmdir()', () => {
    const testRmDir = `${tmpDir}${sep}tests_rmdir_${Date.now()}`
    const pathFile = `${testRmDir}${sep}file_recursive`

    beforeEach(async () => {
      await handler.outputFile(pathFile, '')
    })

    afterEach(async () => {
      if (fs.existsSync(testRmDir)) {
        await handler.rmdir(testRmDir, { recursive: true })
      }
    })

    it(`should remove folder resursively`, async () => {
      await handler.rmdir(testRmDir, { recursive: true })

      expect(fs.existsSync(testRmDir)).toBe(false)
    })

    it(`should throw an error when recursive is false`, async () => {
      let error
      try {
        await handler.rmdir(testRmDir)
      } catch (e) {
        error = e
      }

      await expect(error.code).toEqual('ENOTEMPTY')
    })
  })
})
