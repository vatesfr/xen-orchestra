import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

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

  it('throws a 404 when the path is not in the known sources', async () => {
    const error = Object.assign(new Error('path is not a loaded config source'), {
      statusCode: 404,
    })

    const service = new ServerConfigService({
      xoApp: {
        config: {
          parseSourceFiltered: async () => {
            throw error
          },
        },
      },
    } as unknown as RestApi)

    await assert.rejects(
      () => service.getSource('/etc/passwd'),
      (err: Error & { statusCode?: number }) => err.statusCode === 404
    )
  })

  it('throws a 404 for traversal paths', async () => {
    const error = Object.assign(new Error('path is not a loaded config source'), {
      statusCode: 404,
    })

    const service = new ServerConfigService({
      xoApp: {
        config: {
          parseSourceFiltered: async () => {
            throw error
          },
        },
      },
    } as unknown as RestApi)

    await assert.rejects(
      () => service.getSource('../../etc/passwd'),
      (err: Error & { statusCode?: number }) => err.statusCode === 404
    )
  })
})
