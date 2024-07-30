import type { Host } from '@/types/host.type'
import type { Pool } from '@/types/pool.type'
import type { Task } from '@/types/task.type'
import type { Vm } from '@/types/vm.type'
import type { ComputedRef, Ref } from 'vue'

declare const __brand: unique symbol

// eslint-disable-next-line no-use-before-define
export type RecordId<Type extends XoObjectType> = string & { [__brand]: `${Type}Id` }

export type XoObject = Vm | Host | Pool | Task

export type XoObjectType = XoObject['type']

export type XoObjectTypeToXoObject<TType extends XoObjectType> = {
  [TObject in XoObject as TObject['type']]: TObject
}[TType]

export type XoObjectContext<TXoObject extends XoObject> = {
  records: ComputedRef<TXoObject[]>
  get: (id: TXoObject['id']) => TXoObject | undefined
  has: (id: TXoObject['id']) => boolean
  isFetching: Readonly<Ref<boolean>>
  isReady: Readonly<Ref<boolean>>
  lastError: Readonly<Ref<string | undefined>>
  hasError: ComputedRef<boolean>
}
