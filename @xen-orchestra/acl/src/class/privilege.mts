import { createPredicate } from 'value-matcher'
import type { Privilege as TPrivilege } from '../index.mjs'

export type SupportedResource = keyof typeof SUPPORTED_ACTIONS_BY_RESOURCE
export type SupportedActions<T extends SupportedResource> = (typeof SUPPORTED_ACTIONS_BY_RESOURCE)[T][number]

/**
 * Action MUST follow this pattern:
 * (*|create|read|update|delete|...):<some-value | undefined>
 *
 * * mean all actions (E.g. action: * === action: read)
 * value without sub action like 'shutdown' mean: 'shutdown:*' (so shutdown mean you can shutdown:clean and shutdown:hard)
 */
const SUPPORTED_ACTIONS_BY_RESOURCE = {
  sr: ['*', 'read'],
  vdi: ['*', 'read', 'create', 'boot'],
  'vdi-snapshot': ['*', 'read'],
  vbd: ['*', 'read'],
  vm: [
    '*',
    'read',
    'start',
    'shutdown',
    'shutdown:clean',
    'shutdown:hard',
    'reboot',
    'reboot:clean',
    'reboot:hard',
    'pause',
    'suspend',
    'resume',
    'unpause',
  ],
  'vm-template': ['*', 'read', 'instantiate'],
  'vm-snapshot': ['*', 'read'],
  'vm-controller': ['*', 'read'],
  vif: ['*', 'read', 'create'],
  network: ['*', 'read'],
  pif: ['*', 'read'],
  host: ['*', 'read', 'allow-vm'],
  pbd: ['*', 'read'],
  pool: ['*', 'read'],
  message: ['*', 'read'],
  pci: ['*', 'read'],
  pgpu: ['*', 'read'],
  sm: ['*', 'read'],
  alarm: ['*', 'read'],
  'backup-archive': ['*', 'read'],
  'backup-job': ['*', 'read'],
  'backup-log': ['*', 'read'],
  'backup-repository': ['*', 'read'],
  group: ['*', 'read'],
  proxy: ['*', 'read'],
  'restore-log': ['*', 'read'],
  schedule: ['*', 'read'],
  server: ['*', 'read'],
  task: ['*', 'read'],
  user: ['*', 'read'],
} as const

export class Privilege<T extends SupportedResource> {
  #action: TPrivilege<T>['action']
  #selector?: TPrivilege<T>['selector']
  #resource: TPrivilege<T>['resource']

  constructor({
    action,
    selector,
    resource,
  }: {
    action: TPrivilege<T>['action']
    selector?: TPrivilege<T>['selector']
    resource: TPrivilege<T>['resource']
  }) {
    Privilege.checkActionIsValid(action, resource)

    this.#action = action
    this.#selector = selector
    this.#resource = resource
  }

  #matchAction(action: string) {
    // read:name_label - read:name_label
    if (this.#action === action) {
      return true
    }

    const [namespaceToMatch, actionToMatch] = action.split(':')
    const [thisNamespace, thisAction] = this.#action.split(':')

    if (thisNamespace === '*') {
      return true
    }

    // update:vm - read:name_label
    if (thisNamespace !== namespaceToMatch) {
      return false
    }

    // read - read:name_label
    if (thisAction === undefined) {
      return true
    }
    // read:name_decription - read:name_label
    if (thisAction !== actionToMatch) {
      return false
    }

    throw new Error(`Unable to verify if ${this.#action} match ${action} `)
  }

  #matchSelector(object: unknown) {
    const complexMatcher = this.#selector
    if (complexMatcher === undefined) {
      return true
    }

    return createPredicate(complexMatcher)(object)
  }

  #matchResource(resource: string): resource is SupportedResource {
    return resource === this.#resource
  }

  match(constraint: { action: string; resource: string; object: unknown }): boolean {
    return (
      this.#matchResource(constraint.resource) &&
      this.#matchAction(constraint.action) &&
      this.#matchSelector(constraint.object)
    )
  }

  /**
   * Throw if action not supported
   */
  static checkActionIsValid(action: string, resource: string) {
    const supportedActions = SUPPORTED_ACTIONS_BY_RESOURCE[resource]
    if (supportedActions === undefined) {
      throw new Error(
        `${resource} resource not supported. See ${Object.keys(SUPPORTED_ACTIONS_BY_RESOURCE).join(', ')}`
      )
    }

    if (!supportedActions.includes(action)) {
      throw new Error(
        `${action} action not supported for the resource: ${resource}. See ${supportedActions.join(', ')}`
      )
    }
  }
}
