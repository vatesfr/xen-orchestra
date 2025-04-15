import type { Branded } from '@core/types/utility.type.ts'

export type XoUser = {
  id: Branded<'user'>
  email: string
  name?: string
  permission: string
}
