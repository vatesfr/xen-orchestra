import { strict as assert } from 'node:assert'
import test from 'node:test'

import { getSourceId } from './_sourceId.mjs'

test('getSourceId', async t => {
  await t.test('is the instance UUID of a vCenter', () => {
    assert.equal(getSourceId('5c1b-uuid', 'vcenter.example.org'), '5c1b-uuid')
  })

  await t.test('is the address of a standalone ESXi, with its port', () => {
    assert.equal(getSourceId(undefined, ' ESXi.Example.org '), 'esxi.example.org:443')
    assert.equal(getSourceId(undefined, 'esxi.example.org:8443'), 'esxi.example.org:8443')
    assert.equal(getSourceId('', '192.168.1.2'), '192.168.1.2:443')
  })

  await t.test('unbrackets an IPv6 address, as the front does not bracket it', () => {
    assert.equal(getSourceId(undefined, '[FE80::1]:8443'), 'fe80::1:8443')
    assert.equal(getSourceId(undefined, '[fe80::1]'), 'fe80::1:443')
    assert.equal(getSourceId(undefined, 'fe80::1'), 'fe80::1:443')
  })
})
