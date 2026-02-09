import type { GetKeysRecursively, XoAclPrivilege } from '@vates/types'
import type { SUPPORTED_ACTIONS_BY_RESOURCE, SupportedActionsByResource, SupportedResource } from '@xen-orchestra/acl'

type XoPrivilege = XoAclPrivilege<SupportedActionsByResource, SupportedResource>

type BasePrivilege = {
  id: XoPrivilege['id']
  selector?: XoPrivilege['selector']
  effect: XoPrivilege['effect']
  roleId: XoPrivilege['roleId']
}

// even if `@xen-orchestra/acl`already expose `AnyPrivilege`, we sadly need to re-export the type.
// `AnyPrivilege` is too complex to be used for the openAPI spec generation
export type RestAnyPrivilege =
  | (BasePrivilege & { resource: 'alarm'; action: ActionsByResource['alarm'] })
  | (BasePrivilege & { resource: 'backup-archive'; action: ActionsByResource['backup-archive'] })
  | (BasePrivilege & { resource: 'backup-job'; action: ActionsByResource['backup-job'] })
  | (BasePrivilege & { resource: 'backup-log'; action: ActionsByResource['backup-log'] })
  | (BasePrivilege & { resource: 'backup-log'; action: ActionsByResource['backup-log'] })
  | (BasePrivilege & { resource: 'backup-repository'; action: ActionsByResource['backup-repository'] })
  | (BasePrivilege & { resource: 'group'; action: ActionsByResource['group'] })
  | (BasePrivilege & { resource: 'host'; action: ActionsByResource['host'] })
  | (BasePrivilege & { resource: 'message'; action: ActionsByResource['message'] })
  | (BasePrivilege & { resource: 'network'; action: ActionsByResource['network'] })
  | (BasePrivilege & { resource: 'pbd'; action: ActionsByResource['pbd'] })
  | (BasePrivilege & { resource: 'pci'; action: ActionsByResource['pci'] })
  | (BasePrivilege & { resource: 'pgpu'; action: ActionsByResource['pgpu'] })
  | (BasePrivilege & { resource: 'pif'; action: ActionsByResource['pif'] })
  | (BasePrivilege & { resource: 'pool'; action: ActionsByResource['pool'] })
  | (BasePrivilege & { resource: 'proxy'; action: ActionsByResource['proxy'] })
  | (BasePrivilege & { resource: 'restore-log'; action: ActionsByResource['restore-log'] })
  | (BasePrivilege & { resource: 'schedule'; action: ActionsByResource['schedule'] })
  | (BasePrivilege & { resource: 'server'; action: ActionsByResource['server'] })
  | (BasePrivilege & { resource: 'sm'; action: ActionsByResource['sm'] })
  | (BasePrivilege & { resource: 'sr'; action: ActionsByResource['sr'] })
  | (BasePrivilege & { resource: 'task'; action: ActionsByResource['task'] })
  | (BasePrivilege & { resource: 'user'; action: ActionsByResource['user'] })
  | (BasePrivilege & { resource: 'vbd'; action: ActionsByResource['vbd'] })
  | (BasePrivilege & { resource: 'vdi'; action: ActionsByResource['vdi'] })
  | (BasePrivilege & { resource: 'vdi-snapshot'; action: ActionsByResource['vdi-snapshot'] })
  | (BasePrivilege & { resource: 'vif'; action: ActionsByResource['vif'] })
  | (BasePrivilege & { resource: 'vm'; action: ActionsByResource['vm'] })
  | (BasePrivilege & { resource: 'vm-controller'; action: ActionsByResource['vm-controller'] })
  | (BasePrivilege & { resource: 'vm-snapshot'; action: ActionsByResource['vm-snapshot'] })
  | (BasePrivilege & { resource: 'vm-template'; action: ActionsByResource['vm-template'] })

// As explained just above, we need to redefine all privileges.
// This type is used to create the `RestAnyPrivilge` union type
// And also to ensure type from `@xen-orchestra/acl` and type from here are the same
// type sync validation is done after this type
type ActionsByResource = {
  alarm: 'read'
  'backup-archive': 'read'
  'backup-job': 'read'
  'backup-log': 'read'
  'backup-repository': 'read'
  group: 'read'
  host: 'read' | 'allow-vm'
  message: 'read'
  network: 'read'
  pbd: 'read'
  pci: 'read'
  pgpu: 'read'
  pif: 'read'
  pool: 'read'
  proxy: 'read'
  'restore-log': 'read'
  schedule: 'read'
  server: 'read'
  sm: 'read'
  sr: 'read'
  task: 'read'
  user: 'read'
  vbd: 'read'
  'vdi-snapshot': 'read'
  vdi: 'read' | 'create' | 'boot'
  vif: 'read' | 'create'
  'vm-controller': 'read'
  'vm-snapshot': 'read'
  'vm-template': 'read' | 'instantiate'
  vm:
    | 'read'
    | 'start'
    | 'shutdown'
    | 'shutdown:clean'
    | 'shutdown:hard'
    | 'reboot'
    | 'reboot:clean'
    | 'reboot:hard'
    | 'pause'
    | 'suspend'
    | 'resume'
    | 'unpause'
}

// ------ RESOURCES CHECK
// If a resource is missing, will throw a TS error as it will not match never
type AssertNever<T extends never> = T
// Ensure all resources match
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type _EnsureAllResourcesHandled = AssertNever<
  Exclude<keyof typeof SUPPORTED_ACTIONS_BY_RESOURCE, keyof ActionsByResource>
>
// ------ RESOURCES CHECK
// ------ ACTIONS CHECK
type AllActionsFor<R extends keyof typeof SUPPORTED_ACTIONS_BY_RESOURCE> = GetKeysRecursively<
  (typeof SUPPORTED_ACTIONS_BY_RESOURCE)[R]
>

// in case the action don't match
// we populate the type with the resource and the action (extra/missing)
// so it help to debug and instantly see what's wrong
type EnsureAllActionsHandledStrict<T extends ActionsByResource> = {
  [R in keyof T]: Exclude<AllActionsFor<R & keyof typeof SUPPORTED_ACTIONS_BY_RESOURCE>, T[R]> extends never
    ? Exclude<T[R], AllActionsFor<R & keyof typeof SUPPORTED_ACTIONS_BY_RESOURCE>> extends never
      ? true // <- actions match
      : {
          error: 'Extra actions found'
          resource: R
          extra: Exclude<T[R], AllActionsFor<R & keyof typeof SUPPORTED_ACTIONS_BY_RESOURCE>>
        }
    : {
        error: 'Missing actions'
        resource: R
        missing: Exclude<AllActionsFor<R & keyof typeof SUPPORTED_ACTIONS_BY_RESOURCE>, T[R]>
      }
}
// If an action is missing/extra, it will throw a TS error as it will not match Record<string, boolean>
type ActionsValidator<T extends Record<string, boolean>> = T

// Ensure all actions match
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type ActionsValidation = ActionsValidator<EnsureAllActionsHandledStrict<ActionsByResource>>
// ------ ACTIONS CHECK
