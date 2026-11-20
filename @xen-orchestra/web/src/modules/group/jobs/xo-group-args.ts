import type { FrontXoGroup } from '@/modules/group/remote-resources/use-xo-group-collection.ts'
import type { NewGroupPayload } from '@/modules/group/types.ts'
import { defineJobArg } from '@core/packages/job'

export const xoGroupsArg = defineJobArg({
  identify: (group: FrontXoGroup) => group.id,
  toArray: true,
})

export const newGroupArg = defineJobArg({
  identify: (payload: NewGroupPayload) => payload.group.name,
  toArray: false,
})
