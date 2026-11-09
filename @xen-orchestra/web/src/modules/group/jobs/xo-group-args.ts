import type { FrontXoGroup } from '@/modules/group/remote-resources/use-xo-group-collection.ts'
import { defineJobArg } from '@core/packages/job'

export const xoGroupsArg = defineJobArg({
  identify: (group: FrontXoGroup) => group.id,
  toArray: true,
})
