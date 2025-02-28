import { useModal } from '@/composables/modal.composable'
import { ipToHostname } from '@/libs/utils'
import type { VM_COMPRESSION_TYPE } from '@/libs/xen-api/xen-api.enums'
import type {
  ObjectType,
  ObjectTypeToRecord,
  RawXenApiRecord,
  XenApiEvent,
  XenApiHost,
  XenApiNetwork,
  XenApiPool,
  XenApiRecordAddEvent,
  XenApiRecordAfterLoadEvent,
  XenApiRecordBeforeLoadEvent,
  XenApiRecordDelEvent,
  XenApiRecordEvent,
  XenApiRecordLoadErrorEvent,
  XenApiRecordModEvent,
  XenApiSr,
  XenApiVdi,
  XenApiVif,
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

  private request<T>(method: string, args: unknown[] = []) {
    return this.client.request(method, args) as Promise<T>
  }

  call = <T>(method: string, args: unknown[] = []): Promise<T> => {
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
    if (this.fromToken === undefined || this.sessionId === undefined) {
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

  get vm() {
    type VmRefs = XenApiVm['$ref'] | XenApiVm['$ref'][]
    type VmRefsWithPowerState = Record<XenApiVm['$ref'], XenApiVm['power_state']>
    type VmRefsWithNameLabel = Record<XenApiVm['$ref'], string>

    return {
      setAffinityHost: (vmRefs: XenApiVm['$ref'], hostRef: XenApiHost['$ref'] | null) =>
        Promise.all(castArray(vmRefs).map(vmRef => this.call('VM.set_affinity', [vmRef, hostRef ?? '']))),

      setAutoPowerOn: (vmRefs: XenApiVm['$ref'], value: boolean) =>
        Promise.all(
          castArray(vmRefs).map(vmRef =>
            this.call('VM.set_other_config', [
              vmRef,
              {
                auto_poweron: value ? 'true' : null,
              },
            ])
          )
        ),

      setVirtualizationMode: (vmRefs: XenApiVm['$ref'], virtualizationMode: 'pv' | 'hvm') => {
        if (virtualizationMode !== 'pv' && virtualizationMode !== 'hvm') {
          return Promise.reject(new Error(`The virtualization mode must be 'pv' or 'hvm'`))
        }
        return Promise.all(
          castArray(vmRefs).map(vmRef =>
            this.call(virtualizationMode === 'hvm' ? 'VM.set_HVM_boot_policy' : 'VM.set_domain_type', [
              vmRef,
              virtualizationMode === 'hvm' ? 'Boot order' : '',
            ])
          )
        )
      },

      setMemoryMin: (vmRefs: XenApiVm['$ref'], memoryDynamicMin: number) =>
        Promise.all(
          castArray(vmRefs).map(vmRef => this.call('VM.set_memory_dynamic_min', [vmRef, String(memoryDynamicMin)]))
        ),

      setMemoryDynamicRange: (vmRefs: VmRefs, dynamicMin: number, dynamicMax: number) => {
        return Promise.all(
          castArray(vmRefs).map(vmRef => this.call('VM.set_memory_dynamic_range', [vmRef, dynamicMin, dynamicMax]))
        )
      },

      setMemoryStaticMax: (vmRefs: VmRefs, staticMax: number) => {
        return Promise.all(
          castArray(vmRefs).map(vmRef => this.call('VM.set_memory_static_max', [vmRef, String(staticMax)]))
        )
      },

      setMemoryDynamicMin: (vmRefs: VmRefs, dynamicMin: number) => {
        return Promise.all(
          castArray(vmRefs).map(vmRef => this.call('VM.set_memory_dynamic_min', [vmRef, String(dynamicMin)]))
        )
      },

      setMemoryDynamicMax: (vmRefs: VmRefs, max: number) =>
        Promise.all(
          castArray(vmRefs).map(vmRef =>
            this.call('VM.set_memory_limits', [vmRef, 'memory_static_min', String(max), String(max), String(max)])
          )
        ),

      setVCPUs: (vmRefs: VmRefs, count: number) =>
        Promise.all(castArray(vmRefs).map(vmRef => this.call('VM.set_VCPUs_number_live', [vmRef, String(count)]))),

      setCpuCap: (vmRefs: VmRefs, cap: number | null) =>
        Promise.all(
          castArray(vmRefs).map(vmRef => this.call('VM.set_VCPUs_params', [vmRef, 'cap', cap?.toString() ?? '']))
        ),

      setCpuMask: (vmRefs: VmRefs, mask: string[] | null) =>
        Promise.all(
          castArray(vmRefs).map(vmRef => this.call('VM.set_VCPUs_params', [vmRef, 'mask', mask?.join(',') ?? '']))
        ),

      setCpusStaticMax: (vmRefs: VmRefs, max: number) =>
        Promise.all(castArray(vmRefs).map(vmRef => this.call('VM.set_VCPUs_max', [vmRef, String(max)]))),

      setCpuWeight: (vmRefs: VmRefs, weight: number | null) =>
        Promise.all(
          castArray(vmRefs).map(vmRef => this.call('VM.set_VCPUs_params', [vmRef, 'weight', weight?.toString() ?? '']))
        ),
      setMemory: (vmRefs: VmRefs, count: number) =>
        Promise.all(castArray(vmRefs).map(vmRef => this.call('VM.set_memory', [vmRef, count]))),

      setCopyBiosString: (vmRefs: VmRefs, hostRef: XenApiHost['$ref']) =>
        Promise.all(castArray(vmRefs).map(vmRef => this.call('VM.set_copy_bios_string', [vmRef, hostRef]))),

      setNameDescription: (vmRefs: VmRefs, nameDescription: string) =>
        Promise.all(castArray(vmRefs).map(vmRef => this.call('VM.set_name_description', [vmRef, nameDescription]))),

      setNameLabel: (vmRefs: VmRefs, nameLabel: string) =>
        Promise.all(castArray(vmRefs).map(vmRef => this.call('VM.set_name_label', [vmRef, nameLabel]))),

      getAllowedVBDDevices: (vmRefs: VmRefs) =>
        Promise.all(castArray(vmRefs).map(vmRef => this.call('VM.get_allowed_VBD_devices', [vmRef]))),

      getAllowedVIFDevices: (vmRefs: VmRefs) =>
        Promise.all(castArray(vmRefs).map(vmRef => this.call('VM.get_allowed_VIF_devices', [vmRef]))),

      removeFromOtherConfig: (vmRefs: VmRefs, key: string) => {
        return Promise.all(castArray(vmRefs).map(vmRef => this.call('VM.remove_from_other_config', [vmRef, key])))
      },

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

      clone: (vmRefsToClone: VmRefsWithNameLabel): Promise<XenApiVm['$ref'][]> => {
        const vmRefs = Object.keys(vmRefsToClone) as XenApiVm['$ref'][]

        return Promise.all(vmRefs.map(vmRef => this.call<XenApiVm['$ref']>('VM.clone', [vmRef, vmRefsToClone[vmRef]])))
      },

      copy: (vmRefsToCopy: VmRefsWithNameLabel, srRef: XenApiSr['$ref']): Promise<XenApiVm['$ref'][]> => {
        const vmRefs = Object.keys(vmRefsToCopy) as XenApiVm['$ref'][]

        return Promise.all(
          vmRefs.map(vmRef => this.call<XenApiVm['$ref']>('VM.copy', [vmRef, vmRefsToCopy[vmRef], srRef]))
        )
      },

      provision: (vmRefs: VmRefs) => {
        return Promise.all(castArray(vmRefs).map(vmRef => this.call('VM.provision', [vmRef])))
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

  // TODO move to another file
  // WIP
  get vif() {
    type VifRefs = XenApiVif['$ref'] | XenApiVif['$ref'][]
    type VmRefs = XenApiVm['$ref'] | XenApiVm['$ref'][]
    type NetworkRef = XenApiNetwork['$ref']
    return {
      create: (
        vmRefs: VmRefs,
        device: string,
        networkRef: NetworkRef,
        MAC: string,
        MTU: string,
        other_config = {},
        qos_algorithm_params = {},
        qos_algorithm_type = ''
      ) => {
        return Promise.all(
          castArray(vmRefs).map(vmRef => {
            const vifRecord = {
              device,
              network: networkRef,
              VM: vmRef,
              MAC,
              MTU,
              other_config,
              qos_algorithm_params,
              qos_algorithm_type,
            }
            return this.call('VIF.create', [vifRecord])
          })
        )
      },

      delete: (vifRefs: VifRefs) => Promise.all(castArray(vifRefs).map(vifRef => this.call('VIF.destroy', [vifRef]))),
    }
  }

  // TODO move to another file
  get vbd() {
    type VmRef = XenApiVm['$ref']
    type VdiRef = XenApiVdi['$ref']
    return {
      create: (
        vmRefs: VmRef,
        vdiRefs: VdiRef,
        bootable: boolean,
        currently_attached: boolean,
        device: string,
        empty: boolean,
        type: string = 'Disk',
        mode: string,
        qos_algorithm_params = {},
        qos_algorithm_type: string,
        unpluggable: string,
        userdevice: string
      ) => {
        return Promise.all(
          castArray(vmRefs).map(vmRef =>
            this.call(`VIF.create`, [
              vmRef,
              vdiRefs,
              device,
              bootable,
              currently_attached,
              device,
              empty,
              type,
              mode,
              qos_algorithm_params,
              qos_algorithm_type,
              unpluggable,
              userdevice,
            ])
          )
        )
      },
    }
  }
}
