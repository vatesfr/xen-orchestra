import type { FrontXoGroup } from '@/modules/group/remote-resources/use-xo-group-collection.ts'
import type { FrontXoRole } from '@/modules/role/remote-resources/use-xo-role-collection.ts'

export type NewUserPayload = {
  user: {
    name: string
    username: string
    firstname: string
    lastname: string
    password: string
  }
  groupIds: FrontXoGroup['id'][]
  roleIds: FrontXoRole['id'][]
}
