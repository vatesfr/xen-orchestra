import { SUPPORTED_ACTIONS_BY_RESOURCE, type SupportedResource } from '@xen-orchestra/acl'

export type PrivilegeResource = SupportedResource

export const PRIVILEGE_RESOURCES = (Object.keys(SUPPORTED_ACTIONS_BY_RESOURCE) as PrivilegeResource[]).sort()

export type PrivilegeAction = {
  [Resource in PrivilegeResource]: keyof (typeof SUPPORTED_ACTIONS_BY_RESOURCE)[Resource] & string
}[PrivilegeResource]

export const COLLECTION_PATHS = {
  'acl-privilege': 'acl-privileges',
  'acl-role': 'acl-roles',
  alarm: 'alarms',
  'backup-archive': 'backup-archives',
  'backup-job': 'backup-jobs',
  'backup-log': 'backup-logs',
  'backup-repository': 'backup-repositories',
  group: 'groups',
  host: 'hosts',
  message: 'messages',
  network: 'networks',
  pbd: 'pbds',
  pci: 'pcis',
  pgpu: 'pgpus',
  pif: 'pifs',
  pool: 'pools',
  proxy: 'proxies',
  'restore-log': 'restore-logs',
  schedule: 'schedules',
  server: 'servers',
  sm: 'sms',
  sr: 'srs',
  task: 'tasks',
  user: 'users',
  vbd: 'vbds',
  vdi: 'vdis',
  'vdi-snapshot': 'vdi-snapshots',
  vif: 'vifs',
  vm: 'vms',
  'vm-controller': 'vm-controllers',
  'vm-snapshot': 'vm-snapshots',
  'vm-template': 'vm-templates',
} satisfies Partial<Record<PrivilegeResource, string>>

export type SelectablePrivilegeResource = keyof typeof COLLECTION_PATHS

export function isSelectablePrivilegeResource(resource: PrivilegeResource): resource is SelectablePrivilegeResource {
  return Object.hasOwn(COLLECTION_PATHS, resource)
}

export function getResourceActions(resource: PrivilegeResource | undefined): PrivilegeAction[] {
  if (resource === undefined) {
    return []
  }

  return (Object.keys(SUPPORTED_ACTIONS_BY_RESOURCE[resource]) as PrivilegeAction[]).sort()
}
