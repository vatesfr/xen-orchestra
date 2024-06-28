import defined, { get } from '@xen-orchestra/defined'
import { find, forEach, includes, isEmpty, map, some } from 'lodash'

import { destructPattern } from '../../xo-app/backup/utils'

export const getDefaultNetworkForVif = (vif, destHost, pifs, networks) => {
  const originNetwork = networks[vif.$network]
  const originVlans = map(originNetwork.PIFs, pifId => pifs[pifId].vlan)

  let destNetworkId = pifs[destHost.$PIFs[0]].$network

  forEach(destHost.$PIFs, pifId => {
    const { $network, vlan } = pifs[pifId]

    if (networks[$network].name_label === originNetwork.name_label) {
      destNetworkId = $network

      return false
    }

    if (vlan !== -1 && includes(originVlans, vlan)) {
      destNetworkId = $network
    }
  })

  return destNetworkId
}

export const getDefaultMigrationNetwork = (intraPool, destHost, pools, pifs) => {
  const migrationNetwork = pools[destHost.$pool].otherConfig['xo:migrationNetwork']
  let defaultPif
  return defined(
    find(pifs, pif => {
      if (pif.$host === destHost.id) {
        if (migrationNetwork !== undefined && pif.ip !== '' && pif.$network === migrationNetwork) {
          return true
        }
        if (pif.management) {
          defaultPif = pif
        }
      }
    }),
    intraPool ? {} : defaultPif
  ).$network
}

export const isDeltaBackup = backup => backup.mode === 'delta' && !isEmpty(get(() => destructPattern(backup.remotes)))
export const isFullBackup = backup => backup.mode === 'full' && !isEmpty(get(() => destructPattern(backup.remotes)))
export const isCRBackup = backup => isDeltaBackup(backup) && !isEmpty(get(() => destructPattern(backup.srs)))
export const isDRBackup = backup => isFullBackup(backup) && !isEmpty(get(() => destructPattern(backup.srs)))
export const isRollingSnapshotBackup = backup => some(backup.settings, setting => setting.snapshotRetention > 0)
export const isPoolMetadataBackup = backup => !isEmpty(destructPattern(backup.pools))
export const isXoConfigBackup = backup => backup.xoMetadata !== undefined
