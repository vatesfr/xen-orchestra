import type { XoTask } from '@vates/types'

export type ResolvedReference = {
  type: string
  name: string
  href: string
}

export type ResolvedReferences = Record<string, ResolvedReference>

export type XoTaskWithResolvedReferences = XoTask & {
  resolvedReferences: ResolvedReferences
}
