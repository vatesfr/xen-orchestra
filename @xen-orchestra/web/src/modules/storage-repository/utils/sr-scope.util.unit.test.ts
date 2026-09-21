import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { parseSrScopeQuery, toSrScopeQuery } from '@/modules/storage-repository/utils/sr-scope.util.ts'
import { SR_SCOPE_TYPE, type SrScope } from '@core/types/storage-repository.type.ts'

const hostScope: SrScope = { type: SR_SCOPE_TYPE.HOST, hostId: 'host-7' as FrontXoHost['id'] }

describe('toSrScopeQuery', () => {
  it('carries a pool scope as the sole query parameter', () => {
    expect(toSrScopeQuery({ type: SR_SCOPE_TYPE.POOL })).toEqual({ from: 'pool' })
  })

  it('carries which host a host scope is about', () => {
    expect(toSrScopeQuery(hostScope)).toEqual({ from: 'host', host: 'host-7' })
  })
})

describe('parseSrScopeQuery', () => {
  it('reads back the host a query was built from', () => {
    expect(parseSrScopeQuery(toSrScopeQuery(hostScope))).toEqual(hostScope)
  })

  it('reads back a pool scope', () => {
    expect(parseSrScopeQuery(toSrScopeQuery({ type: SR_SCOPE_TYPE.POOL }))).toEqual({ type: SR_SCOPE_TYPE.POOL })
  })

  it('falls back to the pool scope when the query says nothing', () => {
    expect(parseSrScopeQuery({})).toEqual({ type: SR_SCOPE_TYPE.POOL })
  })

  it('falls back to the pool scope when a host scope names no host', () => {
    expect(parseSrScopeQuery({ from: 'host', host: null })).toEqual({ type: SR_SCOPE_TYPE.POOL })
  })

  it('falls back to the pool scope when the query repeats the host', () => {
    expect(parseSrScopeQuery({ from: 'host', host: ['host-7', 'host-8'] })).toEqual({ type: SR_SCOPE_TYPE.POOL })
  })

  it('ignores a host left over from another scope', () => {
    expect(parseSrScopeQuery({ from: 'pool', host: 'host-7' })).toEqual({ type: SR_SCOPE_TYPE.POOL })
  })
})
