import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { noSuchObject } from 'xo-common/api-errors.js'

import type { RestApi } from '../rest-api/rest-api.mjs'
import { ServerConfigService } from './server-config.service.mjs'

describe('ServerConfigService#getSource()', () => {
  it('returns the filtered config when the path is known', async () => {
    const expected = {
      http: {
        port: 80,
      },
    }

    const service = new ServerConfigService({
      xoApp: {
        config: {
          parseSourceFiltered: async () => expected,
        },
      },
    } as unknown as RestApi)

    const result = await service.getSource('/etc/xo-server/config.toml')

    assert.deepStrictEqual(result, expected)
  })

  it('throws noSuchObject when the path is not in the known sources', async () => {
    const service = new ServerConfigService({
      xoApp: {
        config: {
          parseSourceFiltered: async (path: string) => {
            throw noSuchObject(path, 'config-source')
          },
        },
      },
    } as unknown as RestApi)

    await assert.rejects(
      () => service.getSource('/etc/passwd'),
      (err: unknown) => noSuchObject.is(err, { id: '/etc/passwd', type: 'config-source' })
    )
  })

  it('throws noSuchObject for traversal paths', async () => {
    const service = new ServerConfigService({
      xoApp: {
        config: {
          parseSourceFiltered: async (path: string) => {
            throw noSuchObject(path, 'config-source')
          },
        },
      },
    } as unknown as RestApi)

    await assert.rejects(
      () => service.getSource('../../etc/passwd'),
      (err: unknown) => noSuchObject.is(err, { id: '../../etc/passwd', type: 'config-source' })
    )
  })
})
