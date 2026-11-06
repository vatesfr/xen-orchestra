import { invalidParameters } from 'xo-common/api-errors.js'

export function resolvePrivateNetworkPools(xo, { poolIds, pifIds, preferredCenterId }) {
  // Checked before the PrivateNetwork is constructed: its constructor registers it, and with no pool it would stay
  // registered without any network
  if (poolIds.length === 0) {
    throw invalidParameters('at least one pool is required')
  }
  // A pool given twice would get two networks with the same private network uuid and VNI, and PrivateNetwork keeps
  // only the last one it is given per pool: the first would get no tunnel and be invisible to the centre logic
  if (new Set(poolIds).size !== poolIds.length) {
    throw invalidParameters('each pool can only be given once')
  }

  const pools = poolIds.map(id => xo.getXapiObject(id, 'pool'))
  const pifs = pifIds.map(id => xo.getXapiObject(xo.getObject(id, 'PIF')))
  const poolPifs = pools.map(pool => {
    const pif = pifs.find(({ $pool }) => $pool.$ref === pool.$ref)
    if (pif === undefined) {
      throw invalidParameters(`no PIF of pool ${pool.uuid} in pifIds`)
    }
    return [pool, pif]
  })

  let preferredCenter
  if (preferredCenterId !== undefined) {
    preferredCenter = xo.getXapiObject(xo.getObject(preferredCenterId, 'host'))

    // Put pool of preferred center first: its network is created first, the others join it
    const preferredCenterPoolUuid = preferredCenter.$pool.uuid
    const i = pools.findIndex(pool => pool.uuid === preferredCenterPoolUuid)
    if (i === -1) {
      throw invalidParameters(`preferred center ${preferredCenterId} is not a host of the pools`)
    }
    ;[poolPifs[0], poolPifs[i]] = [poolPifs[i], poolPifs[0]]
  }

  return { poolPifs, preferredCenter }
}
