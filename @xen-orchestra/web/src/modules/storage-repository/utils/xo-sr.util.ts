import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import { SR_SCOPE_TYPE, type SrScope } from '@core/types/storage-repository.type.ts'

export function isSrWritable(sr: FrontXoSr) {
  return sr.content_type !== 'iso' && sr.size > 0
}

export type SrScopeRouteQuery = { from: SrScope['type']; host?: string }

export function getSrScopeRouteQuery(scope: SrScope): SrScopeRouteQuery {
  return { from: scope.type, ...(scope.type === SR_SCOPE_TYPE.HOST && { host: scope.hostId }) }
}

export function getSrScopeFromRouteQuery(query: { from?: unknown; host?: unknown }): SrScope {
  return query.from === SR_SCOPE_TYPE.HOST && typeof query.host === 'string'
    ? { type: SR_SCOPE_TYPE.HOST, hostId: query.host }
    : { type: SR_SCOPE_TYPE.POOL }
}

export function getSrCustomFields(sr: FrontXoSr): Record<string, string> {
  const prefix = 'XenCenter.CustomFields.'

  return Object.entries(sr.other_config).reduce<Record<string, string>>((acc, [key, value]) => {
    if (key.startsWith(prefix)) {
      acc[key.slice(prefix.length)] = value
    }

    return acc
  }, {})
}
