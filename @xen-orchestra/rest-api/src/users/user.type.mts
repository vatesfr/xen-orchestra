import type { XoUser } from '@vates/types'

export interface UpdateUserRequestBody {
  firstname?: string
  lastname?: string
  name?: string
  password?: string
  permission?: XoUser['permission']
  preferences?: Omit<XoUser['preferences'], 'otp'>
  username?: string
}
