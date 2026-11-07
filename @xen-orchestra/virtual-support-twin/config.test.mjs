import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { ENABLED_AT_CUSTOMER, neutralizeConfig } from './config.mjs'

describe('neutralizeConfig()', () => {
  const currentUser = { id: 'admin-id', email: 'admin@admin.net' }
  const urlsByPool = new Map([['pool-1', 'http://127.0.0.1:1234']])
  const neutralize = config => neutralizeConfig(config, { currentUser, urlsByPool })

  it('disables schedules and backup repositories', () => {
    assert.deepEqual(neutralize({ schedules: [{ id: 's', enabled: false }], remotes: [{ id: 'r', enabled: true }] }), {
      schedules: [{ id: 's', enabled: false }],
      remotes: [{ id: 'r', enabled: false }],
    })
  })

  it('marks the names of the schedules enabled by the customer', () => {
    assert.deepEqual(neutralize({ schedules: [{ id: 's', name: 'daily', enabled: true }] }).schedules, [
      { id: 's', name: ENABLED_AT_CUSTOMER + 'daily', enabled: false },
    ])
  })

  it('drops proxies and plugin configurations', () => {
    assert.deepEqual(
      neutralize({ proxies: [{ id: 'p' }], plugins: [{ id: 'p', autoload: true, configuration: {} }] }),
      {
        plugins: [{ id: 'p', autoload: true }],
      }
    )
  })

  it('points servers to the fake XAPIs, and disables the others', () => {
    const { xenServers } = neutralize({
      xenServers: [
        { id: 'a', poolId: 'pool-1', host: '10.0.0.1', poolMembersAddresses: ['10.0.0.2'], enabled: true },
        { id: 'b', poolId: 'pool-2', host: '10.0.0.3', enabled: true },
      ],
    })
    assert.deepEqual(xenServers, [
      { id: 'a', poolId: 'pool-1', host: 'http://127.0.0.1:1234', allowUnauthorized: true, enabled: true },
      { id: 'b', poolId: 'pool-2', host: '10.0.0.3', enabled: false },
    ])
  })

  it('keeps the current user over an imported one with the same id or email', () => {
    const users = [
      { id: 'admin-id', email: 'other' },
      { id: 'other', email: 'admin@admin.net' },
      { id: 'u', email: 'user' },
    ]
    assert.deepEqual(neutralize({ users }).users, [{ id: 'u', email: 'user' }])
  })
})
