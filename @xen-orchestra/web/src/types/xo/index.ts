import { xoApiDefinition } from '@/utils/xo-api-definition.util'
import type { ComputedRef, Ref } from 'vue'

type XoApiDefinition = typeof xoApiDefinition

type XoRecordMapping = {
  [K in keyof XoApiDefinition]: {
    type: XoApiDefinition[K]['type']
    definition: XoApiDefinition[K]['handler'] extends (data: any) => infer T ? T : never
  }
}

export type ApiDefinition = Record<
  string,
  {
    type: 'single' | 'collection'
    path: string
    fields: string
    handler: (data: any) => any
  }
>

// SINGLE RECORD

type XoSingleRecordMapping = {
  [K in keyof XoRecordMapping as XoRecordMapping[K]['type'] extends 'single'
    ? K
    : never]: XoRecordMapping[K]['definition']
}

export type XoSingleRecordType = keyof XoSingleRecordMapping

export type XoSingleRecord = XoSingleRecordMapping[XoSingleRecordType]

export type XoSingleRecordContext<TRecord extends XoSingleRecord> = {
  record: ComputedRef<TRecord | undefined>
  isFetching: Readonly<Ref<boolean>>
  isReady: Readonly<Ref<boolean>>
  lastError: Readonly<Ref<string | undefined>>
  hasError: ComputedRef<boolean>
}

export type TypeToSingleRecord<TType extends XoSingleRecordType> = XoSingleRecordMapping[TType]

// COLLECTION RECORD

type XoCollectionRecordMapping = {
  [K in keyof XoRecordMapping as XoRecordMapping[K]['type'] extends 'collection'
    ? K
    : never]: XoRecordMapping[K]['definition']
}

export type XoCollectionRecordType = keyof XoCollectionRecordMapping

export type XoCollectionRecord = XoCollectionRecordMapping[XoCollectionRecordType]

export type XoCollectionRecordContext<TRecord extends XoCollectionRecord> = {
  records: ComputedRef<TRecord[]>
  get: (id: TRecord['id']) => TRecord | undefined
  has: (id: TRecord['id']) => boolean
  isFetching: Readonly<Ref<boolean>>
  isReady: Readonly<Ref<boolean>>
  lastError: Readonly<Ref<string | undefined>>
  hasError: ComputedRef<boolean>
}

export type TypeToCollectionRecord<TType extends XoCollectionRecordType> = XoCollectionRecordMapping[TType]
