import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

import { protocolsMutations } from './ovsdb-client.js'

describe('protocolsMutations', () => {
  it("leaves a bridge with none set alone: OVS's defaults already include OpenFlow 1.1", () => {
    assert.deepEqual(protocolsMutations([]), [])
  })

  it('leaves a bridge that already accepts OpenFlow 1.1 alone', () => {
    assert.deepEqual(protocolsMutations(['OpenFlow10', 'OpenFlow11']), [])
  })

  it("adds OpenFlow11 to a bridge's protocols that lack it, keeping them", () => {
    assert.deepEqual(protocolsMutations(['OpenFlow10', 'OpenFlow14']), [['protocols', 'insert', 'OpenFlow11']])
  })
})
