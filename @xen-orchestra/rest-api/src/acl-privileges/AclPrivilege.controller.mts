import { XoController } from '../abstract-classes/xo-controller.mjs'
import { Privilege } from '@xen-orchestra/acl'
import { SupportedResource } from '@xen-orchestra/acl/dist/class/privilege.mjs'

export class AclPrivilege extends XoController<Privilege<SupportedResource>> {
  getAllCollectionObjects(): Promise<Privilege<SupportedResource>[]> {
    throw new Error('Method not implemented.')
  }
  getCollectionObject(): Promise<Privilege<SupportedResource>> {
    throw new Error('Method not implemented.')
  }
}
