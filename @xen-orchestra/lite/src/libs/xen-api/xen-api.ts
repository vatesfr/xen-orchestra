import { ipToHostname } from '@/libs/utils'
import { vbdOperations } from '@/libs/xen-api/operations/vbd-operations'
import { vdiOperations } from '@/libs/xen-api/operations/vdi-operations'
import { vifOperations } from '@/libs/xen-api/operations/vif-operations'
import { vmOperations } from '@/libs/xen-api/operations/vm-operations'
import type {
  ObjectType,
  ObjectTypeToRecord,
  RawXenApiRecord,
  XenApiEvent,
  XenApiHost,
  XenApiPool,
  XenApiRecordAddEvent,
  XenApiRecordAfterLoadEvent,
  XenApiRecordBeforeLoadEvent,
  XenApiRecordDelEvent,
  XenApiRecordEvent,
  XenApiRecordLoadErrorEvent,
  XenApiRecordModEvent,
} from '@/libs/xen-api/xen-api.types'
import { buildXoObject, typeToRawType } from '@/libs/xen-api/xen-api.utils'
import { JSONRPCClient } from 'json-rpc-2.0'

export default class XenApi {
  private client: JSONRPCClient
  private _sessionId: string | undefined
  private events = new Map<XenApiRecordEvent<any>, Set<(...args: any[]) => void>>()
  private fromToken: string | undefined
  private readonly _hostUrl: string

  constructor(hostUrl: string) {
    this._hostUrl = hostUrl
    this.client = new JSONRPCClient(async request => {
      const response = await fetch(`${this._hostUrl}/jsonrpc`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(request),
      })

      if (response.status === 200) {
        const json = await response.json()
        return this.client.receive(json)
      } else if (request.id !== undefined) {
        return Promise.reject(new Error(response.statusText))
      }
    })
  }

  async connectWithPassword(username: string, password: string) {
    this._sessionId = await this.request('session.login_with_password', [username, password])

    return this._sessionId
  }

  async connectWithSessionId(_sessionId: string) {
    try {
      this._sessionId = undefined

      await this.request('session.get_all_subject_identifiers', [_sessionId])

      this._sessionId = _sessionId

      return true
    } catch (error: any) {
      if (error?.message === 'SESSION_INVALID') {
        return false
      } else {
        throw error
      }
    }
  }

  async disconnect() {
    await this.call('session.logout')
    this._sessionId = undefined
    this.fromToken = undefined
  }

  private request<T>(method: string, args: unknown[] = []) {
    return this.client.request(method, args) as Promise<T>
  }

  call = <T>(method: string, args: unknown[] = []): Promise<T> => {
    return this.request(method, [this._sessionId, ...args])
  }

  async getResource(
    pathname: string,
    { abortSignal, host, query }: { abortSignal?: AbortSignal; host: XenApiHost; query: any }
  ) {
    const url = new URL('http://localhost')
    url.protocol = window.location.protocol
    url.hostname = ipToHostname(host.address)
    url.pathname = pathname
    url.search = new URLSearchParams({
      ...query,
      session_id: this._sessionId,
    }).toString()

    return fetch(url, { signal: abortSignal })
  }

  async loadRecords<Type extends ObjectType, XRecord extends ObjectTypeToRecord<Type>>(type: Type): Promise<XRecord[]> {
    this.emitEvent(`${type}.beforeLoad`)

    try {
      const result = await this.call<Record<XRecord['$ref'], RawXenApiRecord<XRecord>>>(
        `${typeToRawType(type)}.get_all_records`
      )

      const records = Object.entries(result).map(([opaqueRef, record]) =>
        buildXoObject(record as RawXenApiRecord<XRecord>, {
          opaqueRef: opaqueRef as XRecord['$ref'],
        })
      )

      this.emitEvent(`${type}.afterLoad`, records)

      return records
    } catch (e) {
      this.emitEvent(`${type}.loadError`, e)
      return []
    }
  }

  addEventListener<Type extends ObjectType, XRecord extends ObjectTypeToRecord<Type>>(
    event: XenApiRecordAfterLoadEvent<Type>,
    callback: (records: XRecord[]) => void
  ): void

  addEventListener<Type extends ObjectType>(event: XenApiRecordBeforeLoadEvent<Type>, callback: () => void): void

  addEventListener<Type extends ObjectType>(
    event: XenApiRecordLoadErrorEvent<Type>,
    callback: (error: Error) => void
  ): void

  addEventListener<Type extends ObjectType, XRecord extends ObjectTypeToRecord<Type>>(
    event: XenApiRecordAddEvent<Type> | XenApiRecordModEvent<Type>,
    callback: (record: XRecord) => void
  ): void

  addEventListener<Type extends ObjectType, XRecord extends ObjectTypeToRecord<Type>>(
    event: XenApiRecordDelEvent<Type>,
    callback: (opaqueRef: XRecord['$ref']) => void
  ): void

  addEventListener<Type extends ObjectType>(event: XenApiRecordEvent<Type>, callback: (...args: any[]) => void) {
    if (!this.events.has(event)) {
      this.events.set(event, new Set())
    }

    this.events.get(event)!.add(callback)
  }

  removeEventListener<Type extends ObjectType>(event: XenApiRecordBeforeLoadEvent<Type>, callback: () => void): void

  removeEventListener<Type extends ObjectType>(
    event: XenApiRecordLoadErrorEvent<Type>,
    callback: (error: Error) => void
  ): void

  removeEventListener<Type extends ObjectType, XRecord extends ObjectTypeToRecord<Type>>(
    event: XenApiRecordAfterLoadEvent<Type>,
    callback: (records: XRecord[]) => void
  ): void

  removeEventListener<Type extends ObjectType, XRecord extends ObjectTypeToRecord<Type>>(
    event: XenApiRecordAddEvent<any> | XenApiRecordModEvent<any>,
    callback: (record: XRecord) => void
  ): void

  removeEventListener<Type extends ObjectType, XRecord extends ObjectTypeToRecord<Type>>(
    event: XenApiRecordDelEvent<Type>,
    callback: (opaqueRef: XRecord['$ref']) => void
  ): void

  removeEventListener<Type extends ObjectType>(event: XenApiRecordEvent<Type>, callback: (value: any) => void) {
    this.events.get(event)?.delete(callback)
  }

  get listenedTypes() {
    const keys = new Set<ObjectType>()

    for (const event of this.events.keys()) {
      keys.add(event.split('.')[0] as ObjectType)
    }

    return Array.from(keys)
  }

  private emitEvent<Type extends ObjectType>(event: XenApiRecordEvent<Type>, ...args: any[]) {
    const callbacks = this.events.get(event)

    if (callbacks !== undefined) {
      callbacks.forEach(callback => {
        // eslint-disable-next-line n/no-callback-literal
        callback(...args)
      })
    }
  }

  private handleEvents(events: XenApiEvent[]) {
    events.forEach(({ class: cls, operation, ref, snapshot }) => {
      const eventName = `${cls}.${operation}` as XenApiRecordEvent<any>

      if (operation === 'add' || operation === 'mod') {
        this.emitEvent(eventName, buildXoObject(snapshot, { opaqueRef: ref }))
        return
      }

      if (operation === 'del') {
        this.emitEvent(eventName, ref)
      }
    })
  }

  async startWatching(poolRef: XenApiPool['$ref']) {
    this.fromToken = await this.call('event.inject', ['pool', poolRef])
    return this.watch()
  }

  private async watch(): Promise<void> {
    if (this.fromToken === undefined || this._sessionId === undefined) {
      return
    }

    await new Promise(resolve => setTimeout(resolve, 2000))

    if (this.listenedTypes.length === 0) {
      return this.watch()
    }

    const result: {
      token: string
      events: XenApiEvent[]
    } = await this.call('event.from', [this.listenedTypes, this.fromToken, 5.001])

    this.fromToken = result.token

    this.handleEvents(result.events)

    return this.watch()
  }

  // Get field directly from xapi
  getField<T>(type: string, ref: string, field: string): Promise<T> {
    return this.call<T>(`${type}.get_${field}`, [ref])
  }

  get hostUrl(): string {
    return this._hostUrl
  }

  get sessionId() {
    return this._sessionId
  }

  get vm() {
    return vmOperations(this)
  }

  get vif() {
    return vifOperations(this)
  }

  get vdi() {
    return vdiOperations(this)
  }

  get vbd() {
    return vbdOperations(this)
  }
}
