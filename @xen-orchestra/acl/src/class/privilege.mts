import type * as CMType from '@vates/types/lib/complex-matcher'
import { createPredicate } from 'value-matcher'

import { Role } from './role.mjs'

type SupportedResource = keyof typeof SUPPORTED_ACTIONS_BY_RESOURCE

/**
 * Action MUST follow this pattern:
 * * || (create|read|update|delete):<some-value>
 */
const SUPPORTED_ACTIONS_BY_RESOURCE = {
  vm: ['*', 'read:*', 'update:*', 'create:*', 'delete:*', 'create:snapshot', 'delete:snapshot', 'update:snapshot:*'],
  host: ['*', 'read:*', 'update:*'],
  pool: ['*', 'read:*', 'create:*', 'create:vm', 'create:sr', 'create:host'],
  'vm-snapshot': ['*', 'read:*', 'update:*', 'create:*', 'delete'],
} as const

export class Privilege {
  #id: string
  #action: string
  #selector?: CMType.Id<string> | Record<string, unknown> // If undefined, target ALL objects of the resource
  #effect: 'allow' | 'deny'
  #resource: SupportedResource
  #roleId: Role['id']

  constructor({
    action,
    selector,
    effect = 'allow',
    resource,
    roleId,
  }: {
    roleId: string
    action: string
    selector?: CMType.Id<string> | Record<string, unknown>
    effect?: 'allow' | 'deny'
    resource: SupportedResource
  }) {
    Privilege.checkActionIsValid(action, resource)

    this.#id = crypto.randomUUID()
    this.#action = action
    this.#selector = selector
    this.#effect = effect
    this.#resource = resource
    this.#roleId = roleId
  }

  get id() {
    return this.#id
  }

  get action() {
    return this.#action
  }

  get selector() {
    return this.#selector
  }

  get effect() {
    return this.#effect
  }

  get resource() {
    return this.#resource
  }

  get roleId() {
    return this.#roleId
  }

  #matchAction(action: string) {
    // create:vm - create:vm
    if (this.#action === action) {
      return true
    }

    const [namespaceToMatch, actionToMatch] = action.split(':')
    const [thisNamespace, thisAction] = this.#action.split(':')

    // * - create:vm
    if (thisNamespace === '*') {
      return true
    }
    // update:vm - create:vm
    if (thisNamespace !== namespaceToMatch) {
      return false
    }

    // create:* - create:vm
    if (thisAction === '*') {
      return true
    }
    // create:sr - create:vm
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

  match(constraint: { action: string; resource: string; object?: unknown }) {
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
      throw new Error(`${action} action not supported. See ${supportedActions.join(', ')}`)
    }
  }
}
