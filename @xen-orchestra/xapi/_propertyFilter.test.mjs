import assert from 'node:assert/strict'
import { test } from 'node:test'

import { PropertyFilter } from './_propertyFilter.mjs'

const filter = new PropertyFilter(['VM.platform:hvm_serial', 'VM.other_config:xo:foo', 'VBD.other_config:owner'])

test('isFiltered matches the key case-insensitively, for the configured class and field only', () => {
  assert.equal(filter.isFiltered('VM', 'platform', 'hvm_serial'), true)
  assert.equal(filter.isFiltered('VM', 'platform', 'HVM_serial'), true)
  // the key can contain the separators
  assert.equal(filter.isFiltered('VM', 'other_config', 'xo:foo'), true)
  assert.equal(filter.isFiltered('VM', 'platform', 'viridian'), false)
  assert.equal(filter.isFiltered('VM', 'other_config', 'hvm_serial'), false)
  assert.equal(filter.isFiltered('VIF', 'other_config', 'owner'), false)
})

test('filterField removes the filtered keys without modifying its input', () => {
  const platform = { HVM_serial: 'pty', viridian: 'true' }
  assert.deepEqual(filter.filterField('VM', 'platform', platform), { viridian: 'true' })
  assert.deepEqual(platform, { HVM_serial: 'pty', viridian: 'true' })
})

test('filterField returns other values as is', () => {
  const platform = { viridian: 'true' }
  assert.equal(filter.filterField('VM', 'platform', platform), platform)
  assert.equal(filter.filterField('VM', 'platform', undefined), undefined)
  assert.equal(filter.filterField('VM', 'platform', 'hvm_serial'), 'hvm_serial')
  const tags = ['hvm_serial']
  assert.equal(filter.filterField('VM', 'tags', tags), tags)
})

test('filterRecord filters the map fields of the record', () => {
  const record = {
    name_label: 'vm',
    other_config: { 'xo:foo': 'bar', base_template_name: 'Debian' },
    platform: { hvm_serial: 'pty' },
  }
  assert.deepEqual(filter.filterRecord('VM', record), {
    name_label: 'vm',
    other_config: { base_template_name: 'Debian' },
    platform: {},
  })
  assert.equal(filter.filterRecord('VIF', record), record)
})

test('filterRecord does not add the missing fields', () => {
  assert.deepEqual(Object.keys(filter.filterRecord('VBD', { device: '0' })), ['device'])
})

test('without filtered properties nothing is filtered', () => {
  const record = { platform: { hvm_serial: 'pty' } }
  assert.equal(new PropertyFilter().filterRecord('VM', record), record)
  assert.equal(new PropertyFilter([]).isFiltered('VM', 'platform', 'hvm_serial'), false)
})

test('invalid filtered properties are refused', () => {
  assert.throws(() => new PropertyFilter(['hvm_serial']), /expected Class.field:key/)
})

test('filterCall filters the params of the calls writing map fields', () => {
  const ref = 'OpaqueRef:1'
  assert.deepEqual(
    filter.filterCall('VM.create', [{ name_label: 'vm', platform: { HVM_serial: 'pty', nx: 'true' } }]),
    [{ name_label: 'vm', platform: { nx: 'true' } }]
  )
  assert.deepEqual(filter.filterCall('Async.VM.create', [{ platform: { hvm_serial: 'pty' } }]), [{ platform: {} }])
  assert.deepEqual(filter.filterCall('VM.set_platform', [ref, { hvm_serial: 'pty', nx: 'true' }]), [
    ref,
    { nx: 'true' },
  ])
  assert.deepEqual(filter.filterCall('Async.VM.set_other_config', [ref, { 'XO:foo': 'bar' }]), [ref, {}])
  assert.equal(filter.filterCall('VM.add_to_platform', [ref, 'HVM_serial', 'pty']), undefined)
  assert.throws(() => filter.filterCall('Async.VM.add_to_platform', [ref, 'hvm_serial', 'pty']), /is filtered/)
})

test('filterCall returns the params of the other calls as is', () => {
  const ref = 'OpaqueRef:1'
  for (const [method, params] of [
    ['VM.add_to_platform', [ref, 'nx', 'true']],
    ['VM.remove_from_platform', [ref, 'hvm_serial']],
    ['VM.set_name_label', [ref, 'hvm_serial']],
    ['VM.set_platform', [ref, { nx: 'true' }]],
    ['VM.start', [ref, false, false]],
    ['VIF.create', [{ other_config: { owner: 'true' } }]],
    ['VM.get_record', [ref]],
    ['session.login_with_password', ['root', 'secret']],
    ['system.listMethods', []],
  ]) {
    assert.deepEqual(filter.filterCall(method, params), params)
  }
  assert.deepEqual(new PropertyFilter().filterCall('VM.create', [{ platform: { hvm_serial: 'pty' } }]), [
    { platform: { hvm_serial: 'pty' } },
  ])
})
