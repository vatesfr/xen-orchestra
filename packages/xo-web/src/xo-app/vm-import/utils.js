import * as CM from 'complex-matcher'

const getRedirectionUrl = vms =>
  vms.length === 0
    ? undefined // no redirect
    : vms.length === 1
    ? `/vms/${vms[0]}`
    : `/home?s=${encodeURIComponent(new CM.Property('id', new CM.Or(vms.map(_ => new CM.String(_)))).toString())}&t=VM`
