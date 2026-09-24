import { createLogger } from '@xen-orchestra/log'
import { invalidCredentials } from 'xo-common/api-errors.js'
import type { XapiXoRecord, XoApp, XoUser, XoVmBackupJob } from '@vates/types'

import type { Container } from 'inversify'
import { safeParseComplexMatcher } from '../helpers/utils.helper.mjs'
import * as CM from 'complex-matcher'
import { AnyPrivilege } from '@xen-orchestra/acl'

const log = createLogger('xo:rest-api:error-handler')

export class RestApi {
  #ioc: Container
  #xoApp: XoApp

  constructor(xoApp: XoApp, iocContainer: Container) {
    this.#xoApp = xoApp
    this.#ioc = iocContainer
  }

  get tasks() {
    return this.#xoApp.tasks
  }

  get xoApp() {
    return this.#xoApp
  }

  get ioc() {
    return this.#ioc
  }

  get resolver(): XoApp['xapiObjectResolver'] {
    return this.#xoApp.xapiObjectResolver
  }

  authenticateUser(...args: Parameters<XoApp['authenticateUser']>) {
    return this.#xoApp.authenticateUser(...args)
  }

  getCurrentUser(opts?: { throwUnauthenticated?: true }): XoUser
  getCurrentUser(opts: { throwUnauthenticated: false }): undefined | XoUser
  getCurrentUser(opts?: { throwUnauthenticated?: boolean }): undefined | XoUser
  getCurrentUser({ throwUnauthenticated = true }: { throwUnauthenticated?: boolean } = {}): undefined | XoUser {
    const user = this.#xoApp.apiContext.user

    if (user === undefined && throwUnauthenticated) {
      log.error('getCurrentUser received an unauthenticated API call')
      throw invalidCredentials()
    }

    return user
  }

  getObject<T extends XapiXoRecord>(id: T['id'], type?: T['type'] | T['type'][]) {
    return this.#xoApp.getObject(id, type)
  }

  buildResolver(...args: Parameters<XoApp['buildResolver']>) {
    return this.#xoApp.buildResolver(...args)
  }

  async buildPrivilegeResolver(objects: object[], userPrivileges: AnyPrivilege[]): Promise<CM.Resolver | undefined> {
    const nodes: CM.Node[] = []
    userPrivileges.forEach(userPrivilege => {
      if (userPrivilege.selector) {
        nodes.push(CM.parse(userPrivilege.selector))
      }
    })

    if (nodes.length === 0) {
      return undefined
    }

    return this.buildResolver(objects, new CM.And(nodes))
  }

  async applyUserFilter<T>(array: T[], filter: string | undefined): Promise<((obj: T) => boolean) | undefined> {
    if (filter !== undefined) {
      const parsedFilter = safeParseComplexMatcher(filter)
      return parsedFilter.createPredicate(await this.buildResolver(array, parsedFilter))
    }

    return undefined
  }

  getObjectsByType<T extends XapiXoRecord>(
    type: T['type'],
    { filter, ...opts }: { filter?: string | ((obj: T) => boolean); limit?: number } = {}
  ): Record<T['id'], T> {
    if (filter !== undefined && typeof filter === 'string') {
      filter = safeParseComplexMatcher(filter).createPredicate(this.resolver)
    }
    return this.#xoApp.getObjectsByType(type, { filter, ...opts }) ?? ({} as Record<T['id'], T>)
  }

  getXapiObject<T extends XapiXoRecord>(maybeId: T['id'] | T, type: T['type'] | T['type'][]) {
    return this.#xoApp.getXapiObject<T>(maybeId, type)
  }

  runWithApiContext(...args: Parameters<XoApp['runWithApiContext']>) {
    return this.#xoApp.runWithApiContext(...args)
  }
}
