import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { SR_SCOPE_TYPE, type SrScope } from '@core/types/storage-repository.type.ts'
import type { LocationQuery } from 'vue-router'

export type SrScopeQuery =
  | { from: typeof SR_SCOPE_TYPE.POOL }
  | { from: typeof SR_SCOPE_TYPE.HOST; host: FrontXoHost['id'] }

export function toSrScopeQuery(scope: SrScope): SrScopeQuery {
  if (scope.type === SR_SCOPE_TYPE.HOST) {
    return { from: SR_SCOPE_TYPE.HOST, host: scope.hostId as FrontXoHost['id'] }
  }

  return { from: SR_SCOPE_TYPE.POOL }
}

export function parseSrScopeQuery(query: LocationQuery): SrScope {
  const { from, host } = query

  // `?host` alone yields null and a repeated `?host=a&host=b` yields an array,
  // so the id is only trusted once narrowed to a string
  if (from === SR_SCOPE_TYPE.HOST && typeof host === 'string') {
    return { type: SR_SCOPE_TYPE.HOST, hostId: host as FrontXoHost['id'] }
  }

  return { type: SR_SCOPE_TYPE.POOL }
}
