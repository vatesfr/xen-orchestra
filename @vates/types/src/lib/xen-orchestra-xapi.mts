import { WrappedXenApiRecord, XenApiRecord } from '../xen-api.mjs'
import type { XoHost } from '../xo.mjs'

type XcpPatches = {
  changelog?: {
    author: string
    date: number
    description: string
  }
  description: string
  license: string
  name: string
  release: string
  size: number
  url: string
  version: string
}
type XsPatches = {
  conflicts?: string[]
  date: string
  description: string
  documentationUrl?: string
  guidances: string
  name: string
  id?: string
  paid?: boolean
  requirements?: string[]
  upgrade?: boolean
  url?: string
  uuid?: string
}

export interface Xapi {
  call: <ReturnType>(...args: unknown[]) => Promise<ReturnType>
  callAsync: <ReturnType>(...args: unknown[]) => Promise<ReturnType>

  getField<T extends XenApiRecord, K extends keyof T>(
    type: Extract<WrappedXenApiRecord, T>['$type'],
    ref: T['$ref'],
    field: K
  ): Promise<T[K]>
  listMissingPatches(host: XoHost['id']): Promise<XcpPatches[] | XsPatches[]>
}
