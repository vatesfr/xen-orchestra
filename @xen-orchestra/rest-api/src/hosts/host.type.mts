import { XcpPatches, XsPatches } from '@vates/types'

export type MissingPatchesInfo = {
  hasAuthorization: true
  nHostsWithMissingPatches: number
  nPoolsWithMissingPatches: number
  nHostsFailed: number
  missingPatches: XcpPatches[] | XsPatches[]
}

export type XoSrNfsExport = {
  path: string
  acl: string
}

export type XoSrHbaExport = {
  hba: string
  id: string
  lun: number
  path: string
  scsiId: string
  serial: string
  size: number
  vendor: string
}

export type XoSrIscsiLunsExport = {
  id: string
  vendor: string
  serial: string
  size: string
  scsiId: string
}

export type XoSrIscsiIqnsExport = {
  iqn: string
  ip: string
}

export type XoSrsExport = {
  uuid: string
}
