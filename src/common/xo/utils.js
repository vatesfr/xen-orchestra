import forEach from 'lodash/forEach'

export const getDefaultNetworkForVif = (vif, host, pifs, networks) => {
  const nameLabel = networks[vif.$network].name_label
  let defaultNetwork
  forEach(host.$PIFs, pifId => {
    const pif = pifs[pifId]
    if (networks[pif.$network].name_label === nameLabel) {
      defaultNetwork = pif.$network
      return false
    }
  })
  return defaultNetwork
}
