import { after, before, describe, it } from 'node:test'
import { strict as assert } from 'assert'

import 'dotenv/config'
import { getHandler } from '.'

// needs a real container, on Azure or Azurite
//
//   xo_fs_azure='azure://<account>:<key>@<host>/<container>/<dir>' yarn workspace @xen-orchestra/fs test
const url = process.env.xo_fs_azure

describe('AzureHandler#lock()', { skip: url === undefined }, () => {
  let handler

  before(async () => {
    handler = getHandler({ url }).addPrefix(`xo-fs-tests-${Date.now()}`)
    await handler.sync()
  })

  after(async () => {
    await handler?.forget()
  })

  it('refuses a held lock until it is released', async () => {
    const lock = await handler.lock('vm')
    try {
      await assert.rejects(handler.lock('vm'), { code: 'ELOCKED' })
    } finally {
      await lock.dispose()
    }

    const again = await handler.lock('vm')
    await again.dispose()
  })
})
