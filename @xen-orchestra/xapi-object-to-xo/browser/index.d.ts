import type { XapiRecord } from '../index.d.ts'

export declare const Ref: {
  EMPTY: string
  is(value: unknown): boolean
  isNotEmpty(value: unknown): boolean
}

export declare function createRecordWrapper(
  xapi: unknown
): (type: string, ref: string, data: Record<string, unknown>) => XapiRecord

export declare function createXapiGraph(params?: {
  recordsByType?: Record<string, Record<string, Record<string, unknown>>>
  call?: (method: string, ...args: unknown[]) => Promise<unknown>
}): {
  facade: unknown
  getObjectByRef: (ref: string) => XapiRecord | undefined
  setRecord: (type: string, ref: string, data: object) => void
  deleteRecord: (ref: string) => void
}
