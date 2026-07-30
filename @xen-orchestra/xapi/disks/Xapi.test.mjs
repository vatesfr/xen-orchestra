import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { XapiDiskSource } from './Xapi.mjs'
import { VDI_FORMAT_QCOW2, VDI_FORMAT_VHD } from '../index.mjs'

// #getPreferedExportFormat only reads fields off the xapi object; nothing here opens a connection.
const xapi = { _preferNbd: false, getField: async () => undefined }

const newSource = exportFormat => new XapiDiskSource({ xapi, vdiRef: 'OpaqueRef:vdi', exportFormat })

// Which format actually gets exported is decided against a live XAPI, so it is covered by the
// bit-to-bit restore comparisons in @xen-orchestra/qa-test rather than here. What is worth pinning
// down without a pool is the guard: a typo must not silently fall through to the storage's format,
// which would make a test claiming to cover qcow2 quietly re-cover vhd.
describe('XapiDiskSource exportFormat', () => {
  it('rejects a format that is neither vhd nor qcow2', () => {
    for (const exportFormat of ['raw', 'vmdk', 'VHD', '', 42, null]) {
      assert.throws(
        () => newSource(exportFormat),
        /unsupported exportFormat/,
        `accepted ${JSON.stringify(exportFormat)}`
      )
    }
  })

  it('accepts vhd, qcow2, and an omitted format', () => {
    for (const exportFormat of [VDI_FORMAT_VHD, VDI_FORMAT_QCOW2, undefined]) {
      assert.doesNotThrow(() => newSource(exportFormat), `rejected ${JSON.stringify(exportFormat)}`)
    }
  })
})
