import { test } from 'node:test'
import assert from 'node:assert'
import { DiskAlias } from './DiskAlias.mjs'

test('DiskAlias', async t => {
  await t.test('isAlias() recognizes only *.alias.<extension> files', () => {
    const vhdAlias = new DiskAlias('vhd')
    assert.equal(vhdAlias.isAlias('filename.alias.vhd'), true)
    assert.equal(vhdAlias.isAlias('alias.vhd'), false)
    assert.equal(vhdAlias.isAlias('filename.vhd'), false)
    assert.equal(vhdAlias.isAlias('filename.alias.vhd.other'), false)
  })

  await t.test('isAlias() is scoped to its own extension', () => {
    const vhdAlias = new DiskAlias('vhd')
    const qcow2Alias = new DiskAlias('qcow2')
    assert.equal(vhdAlias.isAlias('filename.alias.qcow2'), false)
    assert.equal(qcow2Alias.isAlias('filename.alias.qcow2'), true)
  })

  await t.test('resolve() returns the path in argument for a non alias file', async () => {
    const vhdAlias = new DiskAlias('vhd')
    assert.equal(await vhdAlias.resolve(undefined as any, 'filename.vhd'), 'filename.vhd')
  })
})
