import cloneDeep from 'lodash/cloneDeep.js'
import { Synchronized } from '@vates/generator-toolbox'

export function forkDeltaExport(deltaExport) {
  const { disks, ...rest } = deltaExport
  const newMetadata = cloneDeep(rest)
  newMetadata.disks = {...deltaExport.disks}
  return newMetadata
}
