import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import { toSrScopeQuery } from '@/modules/storage-repository/utils/sr-scope.util.ts'
import type { SrScope } from '@core/types/storage-repository.type.ts'
import type { RouteLocationRaw } from 'vue-router'

export function isSrWritable(sr: FrontXoSr) {
  return sr.content_type !== 'iso' && sr.size > 0
}

export function getSrPageLocation(sr: FrontXoSr, scope: SrScope): RouteLocationRaw {
  return {
    name: '/sr/[id]',
    params: { id: sr.id },
    query: toSrScopeQuery(scope),
  }
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
