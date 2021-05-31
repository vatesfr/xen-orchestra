import { Xapi } from 'xen-api'
import { EventEmitter } from 'events'
import { Map } from 'immutable'

export interface XapiObject {
  $pool: Pool
  $type: keyof types
  $id: string
}

// Dictionary of XAPI types and their corresponding TypeScript types
interface types {
  pool: Pool
  VM: Vm
  host: Host
}

// Types ---

export interface PoolUpdate extends XapiObject {
  name_label: string
}

type _Pool = Omit<XapiObject, '$pool'>
export interface Pool extends _Pool {
  name_label: string
}

export interface Vm extends XapiObject {
  $consoles: Array<{ protocol: string, location: string }>
  is_a_snapshot: boolean
  is_a_template: boolean
  is_control_domain: boolean
  name_description: string
  name_label: string
  power_state: string
}

export interface Host extends XapiObject {
  name_label: string
}

// --------

export interface ObjectsByType extends Map<string, Map<string, XapiObject>> {
  get<NSV, T extends keyof types>(key: T, notSetValue: NSV): Map<string, types[T]> | NSV
  get<T extends keyof types>(key: T): Map<string, types[T]> | undefined
}

export default class XapiConnection {
  areObjectsFetched: Promise<void>
  connected: boolean
  objectsByType: ObjectsByType
  sessionId?: string

  _connectSubscribers: Set<(status: boolean) => void>

  _objectsSubscribers: Set<(objects: ObjectsByType) => void>

  _resolveObjectsFetched!: () => void

  _xapi?: {
    objects: EventEmitter & {
      all: { [id: string]: XapiObject }
    }
    connect(): Promise<void>
    _objectsFetched: Promise<void>
  }

  constructor() {
    this.objectsByType = Map() as ObjectsByType
    this.connected = false
    this.areObjectsFetched = new Promise(resolve => {
      this._resolveObjectsFetched = resolve
    })
    this._objectsSubscribers = new Set()
    this._connectSubscribers = new Set()
  }

  onObjects(cb: (objects: ObjectsByType) => void): () => void {
    this._objectsSubscribers.add(cb)
    return () => this._objectsSubscribers.delete(cb)
  }

  onConnect(cb: (status: boolean) => void): () => void {
    this._connectSubscribers.add(cb)
    return () => this._connectSubscribers.delete(cb)
  }

  async connect({ url, user = 'root', password }: { url: string; user: string; password: string }): Promise<void> {
    const xapi = (this._xapi = new Xapi({
      auth: { user, password },
      url,
      watchEvents: true,
      readonly: false,
    }))

    const updateObjects = (objects: { [id: string]: XapiObject }) => {
      try {
        this.objectsByType = this.objectsByType.withMutations(objectsByType => {
          Object.entries(objects).forEach(([id, object]) => {
            if (object === undefined) {
              // Remove
              objectsByType.forEach((objects, type) => {
                objectsByType.set(type, objects.remove(id))
              })
            } else {
              // Add or update
              const { $type } = object
              objectsByType.set($type, objectsByType.get($type, Map<string, XapiObject>()).set(id, object))
            }
          })
        })

        this._objectsSubscribers.forEach(subscriber => {
          subscriber(this.objectsByType)
        })
      } catch (err) {
        console.error(err)
      }
    }

    try {
      xapi.on('connected', () => {
        console.log('CONNECTED')
        this.sessionId = xapi.sessionId
        this.connected = true
        this._connectSubscribers.forEach(subscriber => {
          subscriber(this.connected)
        })
      })
      await xapi.connect()
      await xapi._objectsFetched

      updateObjects(xapi.objects.all)
      this._resolveObjectsFetched()

      xapi.objects.on('add', updateObjects)
      xapi.objects.on('update', updateObjects)
      xapi.objects.on('remove', updateObjects)
    } catch (err) {
      console.error(err)
    }
  }

  call(method: string, ...args: string[]): Promise<unknown> {
    const { _xapi, connected } = this
    if (!connected || _xapi === undefined) {
      throw new Error('Not connected to XAPI')
    }

    console.log('args:', args)
    console.log('method:', method)
    return _xapi.call(method, ...args)
  }
}
