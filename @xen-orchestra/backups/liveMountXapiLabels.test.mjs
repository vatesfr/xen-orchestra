import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { liveMountXapiLabels } from './liveMountXapiLabels.mjs'

const TIMESTAMP = 1754035712000 // 2025-08-01T08:08:32Z

describe('liveMountXapiLabels', () => {
  it('keeps the name of the disk and names the SR after the restore point', () => {
    assert.deepEqual(liveMountXapiLabels({ timestamp: TIMESTAMP, vdiNameLabel: 'system', vmNameLabel: 'web01' }), {
      srNameLabel: '[XO live mount] web01 (20250801T080832Z)',
      vdiNameLabel: 'system',
      vdiNameDescription: 'Read-only live mount of web01 (20250801T080832Z), removed on unmount.',
    })
  })
})
