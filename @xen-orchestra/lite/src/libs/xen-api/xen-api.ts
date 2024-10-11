import { useModal } from '@/composables/modal.composable'
import { isIpv6 } from '@/libs/utils'
import type { VM_COMPRESSION_TYPE } from '@/libs/xen-api/xen-api.enums'
import type {
  ObjectType,
  ObjectTypeToRecord,
  RawXenApiRecord,
  XenApiEvent,
  XenApiHost,
  XenApiPool,
  XenApiRecord,
  XenApiRecordAddEvent,
  XenApiRecordAfterLoadEvent,
  XenApiRecordBeforeLoadEvent,
  XenApiRecordDelEvent,
  XenApiRecordEvent,
  XenApiRecordLoadErrorEvent,
  XenApiRecordModEvent,
  XenApiVm,
} from '@/libs/xen-api/xen-api.types'
import { buildXoObject, typeToRawType } from '@/libs/xen-api/xen-api.utils'
import { JSONRPCClient } from 'json-rpc-2.0'
import { castArray } from 'lodash-es'

export default class XenApi {
  private client: JSONRPCClient
  private sessionId: string | undefined
  private events = new Map<XenApiRecordEvent<any>, Set<(...args: any[]) => void>>()
  private fromToken: string | undefined
  private hostUrl: string

  constructor(hostUrl: string) {
    this.hostUrl = hostUrl
    this.client = new JSONRPCClient(async request => {
      const response = await fetch(`${this.hostUrl}/jsonrpc`, {
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
    this.sessionId = await this.request('session.login_with_password', [username, password])

    return this.sessionId
  }

  async connectWithSessionId(sessionId: string) {
    try {
      this.sessionId = undefined

      await this.request('session.get_all_subject_identifiers', [sessionId])

      this.sessionId = sessionId

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
    this.sessionId = undefined
    this.fromToken = undefined
  }

  private request<T>(method: string, args: any[] = []): PromiseLike<T> {
    return this.client.request(method, args)
  }

  call = <T>(method: string, args: any[] = []): PromiseLike<T> => {
    return this.request(method, [this.sessionId, ...args])
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
      session_id: this.sessionId,
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

  private handleEvents(events: XenApiEvent<ObjectType, XenApiRecord<any>>[]) {
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
    if (this.fromToken === undefined || this.sessionId === undefined) {
      return
    }

    await new Promise(resolve => setTimeout(resolve, 2000))

    if (this.listenedTypes.length === 0) {
      return this.watch()
    }

    const result: {
      token: string
      events: XenApiEvent<ObjectType, XenApiRecord<any>>[]
    } = await this.call('event.from', [this.listenedTypes, this.fromToken, 5.001])

    this.fromToken = result.token

    this.handleEvents(result.events)

    return this.watch()
  }

  get vm() {
    type VmRefs = XenApiVm['$ref'] | XenApiVm['$ref'][]
    type VmRefsWithPowerState = Record<XenApiVm['$ref'], XenApiVm['power_state']>
    type VmRefsWithNameLabel = Record<XenApiVm['$ref'], string>

    return {
      delete: (vmRefs: VmRefs) => Promise.all(castArray(vmRefs).map(vmRef => this.call('VM.destroy', [vmRef]))),
      start: (vmRefs: VmRefs) =>
        Promise.all(castArray(vmRefs).map(vmRef => this.call('VM.start', [vmRef, false, false]))),
      startOn: (vmRefs: VmRefs, hostRef: XenApiHost['$ref']) =>
        Promise.all(castArray(vmRefs).map(vmRef => this.call('VM.start_on', [vmRef, hostRef, false, false]))),
      pause: (vmRefs: VmRefs) => Promise.all(castArray(vmRefs).map(vmRef => this.call('VM.pause', [vmRef]))),
      suspend: (vmRefs: VmRefs) => {
        return Promise.all(castArray(vmRefs).map(vmRef => this.call('VM.suspend', [vmRef])))
      },
      resume: (vmRefsWithPowerState: VmRefsWithPowerState) => {
        const vmRefs = Object.keys(vmRefsWithPowerState) as XenApiVm['$ref'][]

        return Promise.all(
          vmRefs.map(vmRef => {
            if (vmRefsWithPowerState[vmRef] === 'Suspended') {
              return this.call('VM.resume', [vmRef, false, false])
            }

            return this.call('VM.unpause', [vmRef])
          })
        )
      },
      reboot: (vmRefs: VmRefs, force = false) => {
        return Promise.all(castArray(vmRefs).map(vmRef => this.call(`VM.${force ? 'hard' : 'clean'}_reboot`, [vmRef])))
      },
      shutdown: (vmRefs: VmRefs, force = false) => {
        return Promise.all(
          castArray(vmRefs).map(vmRef => this.call(`VM.${force ? 'hard' : 'clean'}_shutdown`, [vmRef]))
        )
      },
      clone: (vmRefsToClone: VmRefsWithNameLabel) => {
        const vmRefs = Object.keys(vmRefsToClone) as XenApiVm['$ref'][]

        return Promise.all(vmRefs.map(vmRef => this.call('VM.clone', [vmRef, vmRefsToClone[vmRef]])))
      },
      migrate: (vmRefs: VmRefs, destinationHostRef: XenApiHost['$ref']) => {
        return Promise.all(
          castArray(vmRefs).map(vmRef => this.call('VM.pool_migrate', [vmRef, destinationHostRef, { force: 'false' }]))
        )
      },
      snapshot: (vmRefsToSnapshot: VmRefsWithNameLabel) => {
        const vmRefs = Object.keys(vmRefsToSnapshot) as XenApiVm['$ref'][]

        return Promise.all(vmRefs.map(vmRef => this.call('VM.snapshot', [vmRef, vmRefsToSnapshot[vmRef]])))
      },
      export: (vmRefs: VmRefs, compression: VM_COMPRESSION_TYPE) => {
        const blockedUrls: URL[] = []

        castArray(vmRefs).forEach(vmRef => {
          const url = new URL(this.hostUrl)
          url.pathname = '/export/'
          url.search = new URLSearchParams({
            session_id: this.sessionId!,
            ref: vmRef,
            use_compression: compression,
          }).toString()

          const _window = window.open(url.href, '_blank')
          if (_window === null) {
            blockedUrls.push(url)
          } else {
            URL.revokeObjectURL(url.toString())
          }
        })

        if (blockedUrls.length > 0) {
          const { onClose } = useModal(() => import('@/components/modals/VmExportBlockedUrlsModal.vue'), {
            blockedUrls,
          })
          onClose(() => blockedUrls.forEach(url => URL.revokeObjectURL(url.toString())))
        }
      },
    }
  }
}
