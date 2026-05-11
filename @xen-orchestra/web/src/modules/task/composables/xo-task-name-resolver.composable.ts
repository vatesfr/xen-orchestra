import { useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { useXoPoolCollection } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { useXoSrCollection } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import { useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import type { TaskNameSegment } from '@core/types/task.type.ts'
import type { XoHost, XoPool, XoSr, XoVm } from '@vates/types'

const UUID_REGEX = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g

export function useXoTaskNameResolver() {
  const { getVmById } = useXoVmCollection()
  const { getHostById } = useXoHostCollection()
  const { getPoolById } = useXoPoolCollection()
  const { getSrById } = useXoSrCollection()

  function resolveUuid(uuid: string): TaskNameSegment | undefined {
    if (getVmById(uuid as XoVm['id'])) {
      return { text: 'VM', to: { name: '/vm/[id]/dashboard', params: { id: uuid } } }
    }

    if (getHostById(uuid as XoHost['id'])) {
      return { text: 'Host', to: { name: '/host/[id]/dashboard', params: { id: uuid } } }
    }

    if (getPoolById(uuid as XoPool['id'])) {
      return { text: 'Pool', to: { name: '/pool/[id]/dashboard', params: { id: uuid } } }
    }

    if (getSrById(uuid as XoSr['id'])) {
      return { text: 'SR' }
    }

    return undefined
  }

  function resolveTaskName(name: string): TaskNameSegment[] | undefined {
    const resolvedMatches = [...name.matchAll(UUID_REGEX)]
      .map(match => ({ index: match.index, end: match.index + match[0].length, segment: resolveUuid(match[0]) }))
      .filter((m): m is { index: number; end: number; segment: TaskNameSegment } => m.segment !== undefined)

    if (resolvedMatches.length === 0) return undefined

    const segments: TaskNameSegment[] = []
    let cursor = 0

    for (const { index, end, segment } of resolvedMatches) {
      if (index > cursor) segments.push({ text: name.slice(cursor, index) })
      segments.push(segment)
      cursor = end
    }

    if (cursor < name.length) segments.push({ text: name.slice(cursor) })
    return segments
  }

  return { resolveTaskName }
}
