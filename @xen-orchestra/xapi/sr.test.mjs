import { strict as assert } from 'node:assert'
import { describe, it } from 'node:test'

import { Xapi } from './index.mjs'

async function create(params) {
  const autoScan = []
  const xapi = {
    async call(method) {
      assert.equal(method, 'SR.create')
      return 'OpaqueRef:sr'
    },
    async setFieldEntry(type, ref, field, entry, value) {
      autoScan.push([type, ref, field, entry, value])
    },
  }
  assert.equal(
    await Xapi.prototype.SR_create.call(xapi, { host: 'OpaqueRef:host', name_label: 'sr', ...params }),
    'OpaqueRef:sr'
  )
  return autoScan
}

describe('Sr#create()', () => {
  it('enables auto-scan on ISO SRs', async () => {
    assert.deepEqual(await create({ content_type: 'iso', type: 'iso' }), [
      ['SR', 'OpaqueRef:sr', 'other_config', 'auto-scan', 'true'],
    ])
  })

  for (const params of [{ type: 'lvmoiscsi' }, { type: 'nfs', content_type: 'user' }, { type: 'linstor' }]) {
    it(`disables auto-scan on ${params.type} SRs`, async () => {
      assert.deepEqual(await create(params), [['SR', 'OpaqueRef:sr', 'other_config', 'auto-scan', 'false']])
    })
  }
})
