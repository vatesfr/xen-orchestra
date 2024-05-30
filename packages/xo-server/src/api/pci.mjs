import { asyncEach } from '@vates/async-each'
import { defer } from 'golike-defer'

export const disableDom0Access = defer(async function ($defer, { pcis, disable, forceReboot = false }) {
  await this.checkPermissions(pcis.map(id => [id, 'administrate']))

  const _pcis = pcis.map(id => this.getObject(id, 'PCI'))
  if (!_pcis.every(pci => pci.$host === _pcis[0].$host)) {
    // For the changes to take effect, the host must reboot.
    // By only allowing PCIs within the same host, this avoids having to manage the restart of multiple hosts and its priority.
    throw new Error('All PCIs must be in the same host')
  }

  const xapi = this.getXapi(_pcis[0])
  const getMethod = disable => `PCI.${disable ? 'disable' : 'enable'}_dom0_access`

  await asyncEach(
    _pcis,
    async pci => {
      await xapi.call(getMethod(disable), pci._xapiRef)
      $defer.onFailure(() => xapi.call(getMethod(!disable), pci._xapiRef))
    },
    {
      stopOnError: false,
    }
  )

  await xapi.rebootHost(_pcis[0].$host, forceReboot)
})

disableDom0Access.params = {
  pcis: { type: 'array', items: { type: 'string' } },
  disable: { type: 'boolean' },
  forceReboot: { type: 'boolean', optional: true },
}

export async function getDom0AccessStatus({ pci }) {
  return this.getXapi(pci).call('PCI.get_dom0_access_status', pci._xapiRef)
}
getDom0AccessStatus.params = {
  id: { type: 'string' },
}
getDom0AccessStatus.resolve = {
  pci: ['id', 'PCI', 'view'],
}
