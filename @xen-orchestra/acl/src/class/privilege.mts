import { createPredicate } from 'value-matcher'
import type { XoAclPrivilege, XoAclSupportedActions, XoAclSupportedResource } from '@vates/types/lib/xen-orchestra/acl'

import { SUPPORTED_ACTIONS_BY_RESOURCE } from '../actions/index.mjs'

export type SupportedActionsByResource = typeof SUPPORTED_ACTIONS_BY_RESOURCE
export type SupportedResource = XoAclSupportedResource<SupportedActionsByResource>
export type SupportedActions<T extends SupportedResource> = XoAclSupportedActions<SupportedActionsByResource, T>
export type TPrivilege<T extends SupportedResource> = XoAclPrivilege<SupportedActionsByResource, T>

export class Privilege<T extends SupportedResource> {
  #action: TPrivilege<T>['action']
  #selector?: (object: object) => boolean
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
    this.#selector = selector !== undefined ? createPredicate(selector) : undefined
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

  #matchSelector(object: object) {
    if (this.#selector === undefined) {
      return true
    }

    return this.#selector(object)
  }

  #matchResource(resource: string): resource is SupportedResource {
    return resource === this.#resource
  }

  match<Resource extends SupportedResource = T>(constraint: {
    action: SupportedActions<Resource>
    resource: Resource
    object: object
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
      throw new Error(`${resource} resource not supported`)
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
