import type { FrontXoRole } from '@/modules/role/remote-resources/use-xo-role-collection.ts'
import { defineJobArg } from '@core/packages/job'

export const xoRolesArg = defineJobArg({
  identify: (role: FrontXoRole) => role.id,
  toArray: true,
})
