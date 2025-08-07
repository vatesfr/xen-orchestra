import { XcpPatches, XsPatches } from '@vates/types'

export type MissingPatchesInfo = {
  hasAuthorization: true
  nHostsWithMissingPatches: number
  nPoolsWithMissingPatches: number
  nHostsFailed: number
  missingPatches: XcpPatches[] | XsPatches[]
}
