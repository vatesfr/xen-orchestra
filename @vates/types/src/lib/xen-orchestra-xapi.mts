import { XoHost } from '../xo.mjs'

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

  listMissingPatches(host: XoHost['id']): Promise<XcpPatches[] | XsPatches[]>
}
