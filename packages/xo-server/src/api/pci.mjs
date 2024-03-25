import { asyncEach } from '@vates/async-each'
import { defer } from 'golike-defer'

export const hide = defer(async function ($defer, { pcis, hide }) {
  await this.checkPermissions(pcis.map(id => [id, 'administrate']))

  const _pcis = pcis.map(id => this.getObject(id, 'PCI'))
  if (!_pcis.every(pci => pci.$host === _pcis[0].$host)) {
    // For the changes to take effect, the host must reboot.
    // By only allowing PCIs within the same host, this avoids having to manage the restart of multiple hosts and its priority.
    throw new Error('All PCIs must be in the same host')
  }
  const xapi = this.getXapi(_pcis[0])
  const getMethod = hide => `PCI.${hide ? 'disable' : 'enable'}_dom0_access`

  await asyncEach(
    _pcis,
    async pci => {
      await xapi.call(getMethod(hide), pci._xapiRef)
      $defer.onFailure(() => xapi.call(getMethod(!hide), pci._xapiRef))
    },
    {
      stopOnError: false,
    }
  )

  await xapi.rebootHost(_pcis[0].$host)
})

hide.params = {
  pcis: { type: 'array', items: { type: 'string' } },
  hide: { type: 'boolean' },
}

export async function isHidden({ pci }) {
  return !(await this.getXapi(pci).call('PCI.is_dom0_access_enabled', pci._xapiRef))
}
isHidden.params = {
  id: { type: 'string' },
}
isHidden.resolve = {
  pci: ['id', 'PCI', 'view'],
}
