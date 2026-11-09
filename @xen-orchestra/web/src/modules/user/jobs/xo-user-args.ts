import type { FrontXoUser } from '@/modules/user/remote-resources/use-xo-user-collection.ts'
import type { NewUserPayload } from '@/modules/user/types.ts'
import { defineJobArg } from '@core/packages/job'

export const xoUsersArg = defineJobArg({
  identify: (user: FrontXoUser) => user.id,
  toArray: true,
})

export const newUserArg = defineJobArg({
  identify: (payload: NewUserPayload) => payload.user.name,
  toArray: false,
})
