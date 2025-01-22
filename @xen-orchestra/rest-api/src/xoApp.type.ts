import EventEmitter from 'events'
import { XoVm } from './vms/vm.type.js'
import { Response } from 'express'
import { XoServer } from './servers/server.type.js'

type XoPool = {
  id: string
  type: 'pool'
}

/**
 * XapiXoObject can be every "xapi-to-xo" object
 */
export type XapiXoObject = XoVm | XoPool /** | XoVmTempalte | XoVdi | ... */

type ObjectsEvents = {
  add: (objects: Record<XapiXoObject['id'], XapiXoObject>) => void
  remove: (objects: Record<XapiXoObject['id'], undefined>) => void
  update: (objects: Record<XapiXoObject['id'], XapiXoObject>) => void
}

interface Objects extends EventEmitter {
  on<T extends keyof ObjectsEvents>(event: T, cb: ObjectsEvents[T]): this
}

/**
 * Can be every type of object handled by XO
 */
export type XoObject = XapiXoObject | XoServer

export interface XoApp extends EventEmitter {
  _objects: Objects

  getObjects: <T extends XapiXoObject>(opts?: { filter: (obj: XapiXoObject) => boolean }) => Record<string, T>
  getObject: <T extends XapiXoObject>(id: T['id'], type: T['type']) => T

  getAllXenServers: () => Promise<XoServer[]>
  getXenServer: (id: XoServer['id']) => Promise<XoServer>

  addSseClient: (id: symbol, client: Response) => void
  removeSseClient: (id: symbol) => void
}
