import { XoServer } from './servers/server.type.js'
import { XoVm } from './vms/vm.type.js'

/**
 * XapiXoObject can be every "xapi-to-xo" object
 */
export type XapiXoObject = XoVm /** | XoVmTempalte | XoVdi | ... */

export type XoApp = {
  getObjects: <T extends XapiXoObject>(opts?: { filter: (obj: XapiXoObject) => boolean }) => Record<string, T>
  getObject: <T extends XapiXoObject>(id: T['id'], type: T['type']) => T

  getAllXenServers: () => Promise<XoServer[]>
  getXenServer: (id: XoServer['id']) => Promise<XoServer>
}
