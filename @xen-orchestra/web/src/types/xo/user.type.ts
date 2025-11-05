import type { Branded } from '@core/types/utility.type.ts'
import type { XoGroup } from '@vates/types'

export type XoUser = {
  authProviders?: Record<string, string>
  email: string
  groups: XoGroup['id'][]
  id: Branded<'user'>
  name?: string
  permission: string
  pw_hash?: string
  preferences: Record<string, string>
}
