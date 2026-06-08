import { useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { useXoPoolCollection } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { useXoSrCollection } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import { useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import type { TaskNamePart } from '@core/types/task.type.ts'
import type { XoHost, XoPool, XoSr, XoVm } from '@vates/types'

const UUID_REGEX = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g

export function useXoTaskNameResolver() {
  const { getVmById } = useXoVmCollection()
  const { getHostById } = useXoHostCollection()
  const { getPoolById } = useXoPoolCollection()
  const { getSrById } = useXoSrCollection()

  function resolveUuid(uuid: string): TaskNamePart | undefined {
    const vm = getVmById(uuid as XoVm['id'])
    if (vm) {
      return { text: vm.name_label, to: { name: '/vm/[id]/dashboard', params: { id: uuid } } }
    }

    const host = getHostById(uuid as XoHost['id'])
    if (host) {
      return { text: host.name_label, to: { name: '/host/[id]/dashboard', params: { id: uuid } } }
    }

    const pool = getPoolById(uuid as XoPool['id'])
    if (pool) {
      return { text: pool.name_label, to: { name: '/pool/[id]/dashboard', params: { id: uuid } } }
    }

    const sr = getSrById(uuid as XoSr['id'])
    if (sr) {
      return { text: sr.name_label }
    }

    return undefined
  }

  function resolveTaskName(name: string): TaskNamePart[] | undefined {
    if (!name) {
      return undefined
    }

    const parts: TaskNamePart[] = []
    let lastIndex = 0

    for (const match of name.matchAll(UUID_REGEX)) {
      const resolved = resolveUuid(match[0])
      if (resolved === undefined) {
        continue
      }

      if (match.index > lastIndex) {
        parts.push({ text: name.slice(lastIndex, match.index) })
      }
      parts.push(resolved)
      lastIndex = match.index + match[0].length
    }

    // no object was resolved: let the caller fall back to the raw name
    if (parts.length === 0) {
      return undefined
    }

    if (lastIndex < name.length) {
      parts.push({ text: name.slice(lastIndex) })
    }

    return parts
  }

  return { resolveTaskName }
}
