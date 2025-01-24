import EventEmitter from 'events'
import { XoVm } from './vms/vm.type.js'
import { Response } from 'express'
import { XoServer } from './servers/server.type.js'

// -----
interface XoPool extends XapiXoObject {
  id: string
  type: 'pool'
}

interface XoUser extends NonXapiObject {
  id: string
  permission: string
}
// -----

/**
 * XapiXoObject can be every "xapi-to-xo" object
 */
export type XapiXoObject = {
  id: string
  type: 'VM' | 'pool'
}

/**
 * Every object that is not aa XapiXoObject
 */
export type NonXapiObject = {
  id: string
}

/**
 * Can be every type of object handled by XO
 */
export type XoObject = XapiXoObject | NonXapiObject

interface Objects<T extends XapiXoObject> extends EventEmitter {
  indexes: {
    type: {
      [K in T['type']]: Record<T['id'], Extract<T, { type: K }>> | undefined
    }
  }
}

export interface XoApp extends EventEmitter {
  authenticateUser: (
    params: { token?: string; username?: string; password?: string },
    optional?: { ip?: string }
  ) => Promise<{ bypassOtp: boolean; user: XoUser }>
  objects: Objects<XoVm | XoPool> /** Nedd to add all XapiXoType here */

  getObjects: (opts?: { filter?: (obj: XapiXoObject) => boolean }) => Record<XapiXoObject['id'], XapiXoObject>
  getObject: <T extends XapiXoObject>(id: T['id'], type: T['type']) => T

  getAllXenServers: () => Promise<XoServer[]>
  getXenServer: (id: XoServer['id']) => Promise<XoServer>

  addSseClient: (id: symbol, client: Response) => void
  removeSseClient: (id: symbol) => void
}
