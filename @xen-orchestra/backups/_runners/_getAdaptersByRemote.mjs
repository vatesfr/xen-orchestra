export function getAdaptersByRemote(adapters) {
  const adaptersByRemote = {}
  adapters.forEach(({ adapter, remoteId }) => {
    adaptersByRemote[remoteId] = adapter
  })
  return adaptersByRemote
}
