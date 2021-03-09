import { Xapi } from 'xen-api'
import { EventEmitter } from 'events'
import { Map } from 'immutable'

export interface XapiObject {
  $type: string
  $id: string
}

export interface Vm extends XapiObject {
  is_a_snapshot: boolean
  is_a_template: boolean
  is_control_domain: boolean
  name_description: string
  name_label: string
  power_state: string
}

export type ObjectsByType = Map<string, Map<string, XapiObject>>

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
    this.objectsByType = Map()
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

  call(method: string, ...args: string[]): void {
    const { _xapi, connected } = this
    if (!connected) {
      throw new Error('Not connected to XAPI')
    }

    console.log('args:', args)
    console.log('method:', method)
    return _xapi.call(method, ...args)
  }
}
