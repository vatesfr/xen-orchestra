import type { XoUser } from '@vates/types'

export interface UpdateUserRequestBody {
  name?: string
  password?: string
  permission?: XoUser['permission']
  preferences?: Record<string, string>
}
