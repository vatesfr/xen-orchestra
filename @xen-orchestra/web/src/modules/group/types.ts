import type { FrontXoRole } from '@/modules/role/remote-resources/use-xo-role-collection.ts'
import type { FrontXoUser } from '@/modules/user/remote-resources/use-xo-user-collection.ts'

export type NewGroupPayload = {
  group: {
    name: string
  }
  roleIds: FrontXoRole['id'][]
  userIds: FrontXoUser['id'][]
}
