'use strict'
const getAdaptersByRemote = adapters => {
  const adaptersByRemote = {}
  adapters.forEach(({ adapter, remoteId }) => {
    adaptersByRemote[remoteId] = adapter
  })
  return adaptersByRemote
}
exports.getAdaptersByRemote = getAdaptersByRemote
