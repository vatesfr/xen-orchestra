import { createPredicate } from 'value-matcher'
import type { Privilege as TPrivilege } from '../index.mjs'

/**
 * E.g
 * vms {
 *   shutdown: {
 *    clean: true,
 *    hard: true,
 *  }
 * }
 *
 * `shutdown | shutdown:clean | shutdown:hard`
 */
type GetKeysRecursively<T, Prefix extends string = ''> = {
  [K in keyof T]: T[K] extends object
    ? K extends string
      ? `${Prefix}${K}` | GetKeysRecursively<T[K], `${Prefix}${K}:`>
      : never
    : K extends string
      ? `${Prefix}${K}`
      : never
}[keyof T]

export type SupportedResource = keyof typeof SUPPORTED_ACTIONS_BY_RESOURCE
export type SupportedActions<T extends SupportedResource> =
  | (GetKeysRecursively<(typeof SUPPORTED_ACTIONS_BY_RESOURCE)[T]> & string)
  | '*'

/**
 * value without sub action like 'shutdown' mean: 'shutdown:*' (so shutdown mean you can shutdown:clean and shutdown:hard)
 */
const SUPPORTED_ACTIONS_BY_RESOURCE = {
  sr: {
    read: true,
  },
  vdi: {
    read: true,
    create: true,
    boot: true,
  },
  'vdi-snapshot': {
    read: true,
  },
  vbd: {
    read: true,
  },
  vm: {
    read: true,
    start: true,
    shutdown: {
      clean: true,
      hard: true,
    },
    reboot: {
      clean: true,
      hard: true,
    },
    pause: true,
    suspend: true,
    resume: true,
    unpause: true,
  },
  'vm-template': {
    read: true,
    instantiate: true,
  },
  'vm-snapshot': {
    read: true,
  },
  'vm-controller': {
    read: true,
  },
  vif: {
    read: true,
    create: true,
  },
  network: {
    read: true,
  },
  pif: {
    read: true,
  },
  host: {
    read: true,
    'allow-vm': true,
  },
  pbd: {
    read: true,
  },
  pool: {
    read: true,
  },
  message: {
    read: true,
  },
  pci: {
    read: true,
  },
  pgpu: {
    read: true,
  },
  sm: {
    read: true,
  },
  alarm: {
    read: true,
  },
  'backup-archive': {
    read: true,
  },
  'backup-job': {
    read: true,
  },
  'backup-log': {
    read: true,
  },
  'backup-repository': {
    read: true,
  },
  group: {
    read: true,
  },
  proxy: {
    read: true,
  },
  'restore-log': {
    read: true,
  },
  schedule: {
    read: true,
  },
  server: {
    read: true,
  },
  task: {
    read: true,
  },
  user: {
    read: true,
  },
} as const

export class Privilege<T extends SupportedResource> {
  #action: TPrivilege<T>['action']
  #selector?: TPrivilege<T>['selector']
  #resource: TPrivilege<T>['resource']
  #effect: TPrivilege<T>['effect']

  constructor({
    action,
    selector,
    resource,
    effect,
  }: {
    action: TPrivilege<T>['action']
    selector?: TPrivilege<T>['selector']
    resource: TPrivilege<T>['resource']
    effect: TPrivilege<T>['effect']
  }) {
    Privilege.checkActionIsValid(resource, action)

    this.#action = action
    this.#selector = selector
    this.#resource = resource
    this.#effect = effect
  }

  get effect() {
    return this.#effect
  }

  #matchAction<Resource extends SupportedResource = T>(action: SupportedActions<Resource>) {
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

  match<Resource extends SupportedResource = T>(constraint: {
    action: SupportedActions<Resource>
    resource: Resource
    object: unknown
  }): boolean {
    return (
      this.#matchResource(constraint.resource) &&
      this.#matchAction(constraint.action) &&
      this.#matchSelector(constraint.object)
    )
  }

  /**
   * Throw if action not supported
   */
  static checkActionIsValid<T extends SupportedResource>(resource: T, action: SupportedActions<T>) {
    const supportedActions = SUPPORTED_ACTIONS_BY_RESOURCE[resource]
    if (supportedActions === undefined) {
      throw new Error(
        `${resource} resource not supported. See ${Object.keys(SUPPORTED_ACTIONS_BY_RESOURCE).join(', ')}`
      )
    }

    if (action === '*') {
      return
    }

    const segments = action.split(':')
    let _action: object | undefined = undefined
    segments.forEach(segment => {
      _action = (_action ?? supportedActions)[segment]

      if (_action === undefined) {
        throw new Error(
          `${action} action not supported for the resource: ${resource}. See ${JSON.stringify(supportedActions)}`
        )
      }
    })
  }
}
