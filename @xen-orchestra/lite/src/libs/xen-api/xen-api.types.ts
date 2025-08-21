/* eslint-disable no-use-before-define */

import type { XEN_API_OBJECT_TYPES } from '@/libs/xen-api/xen-api.utils'
import type {
  XenApiBond,
  XenApiConsole,
  XenApiHost,
  XenApiHostMetrics,
  XenApiMessage,
  XenApiNetwork,
  XenApiPbd,
  XenApiPci,
  XenApiPgpu,
  XenApiPif,
  XenApiPifMetrics,
  XenApiPool,
  XenApiSr,
  XenApiVdi,
  XenApiVif,
  XenApiVm,
  XenApiVmGuestMetrics,
  XenApiVmMetrics,
} from '@vates/types'

type TypeMapping = typeof XEN_API_OBJECT_TYPES
export type ObjectType = keyof TypeMapping
export type RawObjectType = TypeMapping[ObjectType]

export type RawTypeToType<RawType extends RawObjectType> = Lowercase<RawType>
export type TypeToRawType<Type extends ObjectType> = TypeMapping[Type]

type ObjectTypeToRecordMapping = {
  bond: XenApiBond
  console: XenApiConsole
  host: XenApiHost
  host_metrics: XenApiHostMetrics
  message: XenApiMessage
  network: XenApiNetwork
  pbd: XenApiPbd
  pci: XenApiPci
  pgpu: XenApiPgpu
  pif: XenApiPif
  pif_metrics: XenApiPifMetrics
  pool: XenApiPool
  sr: XenApiSr
  vdi: XenApiVdi
  vif: XenApiVif
  vm: XenApiVm
  vm_guest_metrics: XenApiVmGuestMetrics
  vm_metrics: XenApiVmMetrics
}

export type ObjectTypeToRecord<Type extends ObjectType> = Type extends keyof ObjectTypeToRecordMapping
  ? ObjectTypeToRecordMapping[Type]
  : never

export type XenApiRecordBeforeLoadEvent<Type extends ObjectType> = `${Type}.beforeLoad`
export type XenApiRecordAfterLoadEvent<Type extends ObjectType> = `${Type}.afterLoad`
export type XenApiRecordLoadErrorEvent<Type extends ObjectType> = `${Type}.loadError`
export type XenApiRecordAddEvent<Type extends ObjectType> = `${Type}.add`
export type XenApiRecordModEvent<Type extends ObjectType> = `${Type}.mod`
export type XenApiRecordDelEvent<Type extends ObjectType> = `${Type}.del`
export type XenApiRecordEvent<Type extends ObjectType> =
  | XenApiRecordBeforeLoadEvent<Type>
  | XenApiRecordAfterLoadEvent<Type>
  | XenApiRecordLoadErrorEvent<Type>
  | XenApiRecordAddEvent<Type>
  | XenApiRecordModEvent<Type>
  | XenApiRecordDelEvent<Type>

declare const __brand: unique symbol

export type RecordRef<Type extends ObjectType> = string & { [__brand]: `${Type}Ref` }
export type RecordUuid<Type extends ObjectType> = string & { [__brand]: `${Type}Uuid` }

export interface XenApiRecord<Type extends ObjectType> {
  $ref: RecordRef<Type>
  uuid: RecordUuid<Type>
}

export type RawXenApiRecord<T extends XenApiRecord<ObjectType>> = Omit<T, '$ref'>


export type XenApiEvent<
  RelationType extends ObjectType = ObjectType,
  XRecord extends ObjectTypeToRecord<RelationType> = ObjectTypeToRecord<RelationType>,
> = {
  id: string
  class: RelationType
  operation: 'add' | 'mod' | 'del'
  ref: XRecord['$ref']
  snapshot: RawXenApiRecord<XRecord>
}

export interface XenApiError extends Error {
  data?: any
}

/* eslint-enable no-use-before-define */
