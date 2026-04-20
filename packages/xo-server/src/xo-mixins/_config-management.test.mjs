import assert from 'assert/strict'
import test from 'node:test'

import ConfigManagement from './config-management.mjs'

const { describe, it } = test

describe('ConfigManagement', function () {
  it('encryptCredentialDatabase forces passphrase', async function () {
    const mockApp = { hooks: { on: () => {} }, config: { getOptional: () => false } }
    let configManagement = new ConfigManagement(mockApp)

    // Check that the export config works without a passphrase when encryptCredentialDatabase is false
    await assert.doesNotReject(() => configManagement.exportConfig({ compress: false, entries: [] }))

    mockApp.config = { getOptional: () => true }
    configManagement = new ConfigManagement(mockApp)

    // Check that the export config throws without a passphrase when encryptCredentialDatabase is true.
    await assert.rejects(() => configManagement.exportConfig({ compress: false, entries: [] }), {
      message: 'Config export requires a passphrase when credential encryption is enabled.',
    })

    // Check that the export config works without a passphrase when encryptCredentialDatabase is true.
    await assert.doesNotReject(() =>
      configManagement.exportConfig({ compress: false, entries: [], passphrase: 'passphrase' })
    )
  })
})
