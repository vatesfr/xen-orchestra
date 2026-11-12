import { SUPPORTED_ACTIONS_BY_RESOURCE, type SupportedActions, type SupportedResource } from '@xen-orchestra/acl'

export type PrivilegeResource = SupportedResource

export const PRIVILEGE_RESOURCES = (Object.keys(SUPPORTED_ACTIONS_BY_RESOURCE) as PrivilegeResource[]).sort()

export type PrivilegeAction = {
  [Resource in PrivilegeResource]: SupportedActions<Resource>
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

export function isSelectablePrivilegeResource(resource: string): resource is SelectablePrivilegeResource {
  return Object.hasOwn(COLLECTION_PATHS, resource)
}

function flattenActions(actions: object, prefix = ''): string[] {
  return Object.entries(actions)
    .sort(([firstName], [secondName]) => firstName.localeCompare(secondName))
    .flatMap(([name, subActions]) => {
      const action = `${prefix}${name}`

      if (typeof subActions !== 'object') {
        return [action]
      }

      return [action, ...flattenActions(subActions, `${action}:`)]
    })
}

export function getResourceActions(resource: PrivilegeResource | undefined): PrivilegeAction[] {
  if (resource === undefined) {
    return []
  }

  return ['*', ...flattenActions(SUPPORTED_ACTIONS_BY_RESOURCE[resource])] as PrivilegeAction[]
}

function isActionCoveredBy(action: PrivilegeAction, coveringAction: PrivilegeAction) {
  if (action === coveringAction) {
    return false
  }

  return coveringAction === '*' || action.startsWith(`${coveringAction}:`)
}

export function isActionCovered(action: PrivilegeAction, selectedActions: PrivilegeAction[]) {
  return selectedActions.some(selectedAction => isActionCoveredBy(action, selectedAction))
}

export function removeCoveredActions(actions: PrivilegeAction[]) {
  return actions.filter(action => !isActionCovered(action, actions))
}
