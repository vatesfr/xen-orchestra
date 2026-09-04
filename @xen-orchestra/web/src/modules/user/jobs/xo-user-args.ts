import type { FrontXoUser } from '@/modules/user/remote-resources/use-xo-user-collection.ts'
import { defineJobArg } from '@core/packages/job'

export const xoUsersArg = defineJobArg({
  identify: (user: FrontXoUser) => user.id,
  toArray: true,
})
