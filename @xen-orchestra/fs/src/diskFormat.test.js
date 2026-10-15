import { describe, it } from 'node:test'
import { strict as assert } from 'assert'

import { getHandler } from '.'

// building a handler does not connect: these only read the parsed remote URL
const diskFormatOf = url => getHandler({ url }).getConfig('diskFormat')

const AZURE_KEY = Buffer.from('key').toString('base64')

describe('getConfig("diskFormat")', () => {
  describe('file', () => {
    it('defaults to vhd', () => {
      assert.equal(diskFormatOf('file:///backups'), 'vhd')
    })

    it('reads a legacy useVhdDirectory remote as vhdDirectory', () => {
      assert.equal(diskFormatOf('file:///backups?useVhdDirectory=true'), 'vhdDirectory')
    })

    it('reads the diskFormat option', () => {
      assert.equal(diskFormatOf('file:///backups?diskFormat=%22hbd%22'), 'hbd')
    })
  })

  // object storage only holds VHD directories, whatever the URL says
  describe('s3', () => {
    it('is always vhdDirectory', () => {
      assert.equal(diskFormatOf('s3://user:pass@s3.example.org/bucket/dir'), 'vhdDirectory')
      assert.equal(diskFormatOf('s3://user:pass@s3.example.org/bucket/dir?diskFormat=%22hbd%22'), 'vhdDirectory')
    })
  })

  describe('azure', () => {
    it('is always vhdDirectory', () => {
      const url = `azure://account:${AZURE_KEY}@account.blob.core.windows.net/container/dir`
      assert.equal(diskFormatOf(url), 'vhdDirectory')
      assert.equal(diskFormatOf(`${url}?diskFormat=%22hbd%22`), 'vhdDirectory')
    })
  })
})
