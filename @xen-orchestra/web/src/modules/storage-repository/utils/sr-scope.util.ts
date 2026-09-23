import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { SR_SCOPE_TYPE, type SrScope } from '@core/types/storage-repository.type.ts'
import type { LocationQuery } from 'vue-router'

export type XoSrScope = SrScope<FrontXoHost['id']>

export type SrScopeQuery = { from: typeof SR_SCOPE_TYPE.POOL } | { from: typeof SR_SCOPE_TYPE.HOST; host: string }

export function toSrScopeQuery(scope: SrScope): SrScopeQuery {
  if (scope.type === SR_SCOPE_TYPE.HOST) {
    return { from: SR_SCOPE_TYPE.HOST, host: scope.hostId }
  }

  return { from: SR_SCOPE_TYPE.POOL }
}

export function parseHostIdQuery(query: LocationQuery): FrontXoHost['id'] | undefined {
  // `?host` alone yields null and a repeated `?host=a&host=b` yields an array,
  // so the id is only trusted once narrowed to a string
  return typeof query.host === 'string' ? (query.host as FrontXoHost['id']) : undefined
}

export function parseSrScopeQuery(query: LocationQuery): XoSrScope {
  const hostId = parseHostIdQuery(query)

  if (query.from === SR_SCOPE_TYPE.HOST && hostId !== undefined) {
    return { type: SR_SCOPE_TYPE.HOST, hostId }
  }

  return { type: SR_SCOPE_TYPE.POOL }
}
