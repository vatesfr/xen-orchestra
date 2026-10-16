import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { getHostIcon } from '@/modules/host/utils/xo-host.util.ts'
import type { FrontXoPbd } from '@/modules/pbd/remote-resources/use-xo-pbd-collection.ts'
import { getPbdsConnectionStatus } from '@/modules/pbd/utils/xo-pbd.util.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import type { PrivilegeSelectorMatch } from '@/modules/role/remote-resources/use-xo-privilege-selector-matches-collection.ts'
import type { PrivilegeScopeObject } from '@/modules/role/types.ts'
import type { SelectablePrivilegeResource } from '@/modules/role/utils/privilege-catalogue.util.ts'
import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import { getSrPageLocation } from '@/modules/storage-repository/utils/xo-sr.util.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { type IconName, objectIcon } from '@core/icons'
import { SR_SCOPE_TYPE } from '@core/types/storage-repository.type.ts'
import { toLower } from 'lodash-es'

export function toVmScopeObject(vm: FrontXoVm): PrivilegeScopeObject {
  return {
    id: vm.id,
    label: vm.name_label,
    icon: objectIcon('vm', toLower(vm.power_state)),
    to: { name: '/vm/[id]/dashboard', params: { id: vm.id } },
  }
}

export function toHostScopeObject(host: FrontXoHost): PrivilegeScopeObject {
  return {
    id: host.id,
    label: host.name_label,
    icon: getHostIcon(host),
    to: { name: '/host/[id]/dashboard', params: { id: host.id } },
  }
}

export function toPoolScopeObject(pool: FrontXoPool): PrivilegeScopeObject {
  return {
    id: pool.id,
    label: pool.name_label,
    icon: 'object:pool',
    to: { name: '/pool/[id]/dashboard', params: { id: pool.id } },
  }
}

// A privilege is not bound to a pool or a host, so the SR is shown with the status of all its PBDs.
export function toSrScopeObject(sr: FrontXoSr, pbds: FrontXoPbd[]): PrivilegeScopeObject {
  return {
    id: sr.id,
    label: sr.name_label,
    icon: objectIcon('sr', getPbdsConnectionStatus(pbds)),
    to: getSrPageLocation(sr, { type: SR_SCOPE_TYPE.POOL }),
  }
}

const SCOPE_OBJECT_ICONS: Partial<Record<SelectablePrivilegeResource, IconName>> = {
  'backup-archive': 'object:backup-archive',
  'backup-job': 'object:backup-job',
  'backup-repository': 'object:br',
  group: 'object:organization',
  network: 'object:network',
  proxy: 'object:proxy',
  task: 'object:task',
  user: 'object:account',
  vdi: 'object:vdi',
  'vdi-snapshot': 'object:vdi-snapshot',
  vif: 'object:vif',
  'vm-snapshot': 'object:vm-snapshot',
  'vm-template': 'object:template',
}

export function toScopeObject(
  resource: SelectablePrivilegeResource,
  match: PrivilegeSelectorMatch
): PrivilegeScopeObject {
  return {
    id: match.id,
    label: match.name,
    icon: SCOPE_OBJECT_ICONS[resource],
  }
}
