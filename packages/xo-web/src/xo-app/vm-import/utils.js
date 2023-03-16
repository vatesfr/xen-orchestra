import * as CM from 'complex-matcher'
import { resolveIds } from 'utils'

export const getRedirectionUrl = (vms = []) => {
  const vmIds = resolveIds(typeof vms === 'object' ? Object.values(vms) : vms)
  return vmIds.length === 0
    ? undefined // no redirect
    : vmIds.length === 1
    ? `/vms/${vmIds[0]}`
    : `/home?s=${encodeURIComponent(
        new CM.Property('id', new CM.Or(vmIds.map(vm => new CM.String(vm)))).toString()
      )}&t=VM`
}
