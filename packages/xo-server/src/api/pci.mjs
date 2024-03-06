import { defer } from 'golike-defer'

export const set = defer(async function ($defer, { pci, hide }) {
  const xapi = this.getXapi(pci)

  if (hide !== undefined) {
    await xapi.call(`PCI.${hide ? 'hide' : 'unhide'}`, pci._xapiRef)
    $defer.onFailure(() => xapi.call(`PCI.${!hide ? 'hide' : 'unhide'}`, pci._xapiRef))
    await xapi.rebootHost(pci.$host)
  }
})
set.params = {
  id: { type: 'string' },
  hide: { type: 'boolean', optional: true },
}
set.resolve = {
  pci: ['id', 'PCI', 'administrate'],
}
