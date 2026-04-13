import {
  getMissingPrivileges,
  type AnyPrivilegeOnParam,
  type SupportedActions,
  type SupportedResource,
} from '@xen-orchestra/acl'
import type { Response, NextFunction } from 'express'
import type { AuthenticatedRequest } from '../helpers/helper.type.mjs'
import { RestApi } from '../rest-api/rest-api.mjs'
import { iocContainer } from '../ioc/ioc.mjs'
import type { Branded, NonXapiXoRecord, XapiXoRecord, XoRecord } from '@vates/types'
import { ValidateError } from 'tsoa'
import { ApiError } from '../helpers/error.helper.mjs'
import type { XoApp } from '../rest-api/rest-api.type.mjs'

export const ACL_MIDDLEWARE_NAME = '_aclMiddleware'

export function actionsFromBody<Resource extends SupportedResource>(
  actions: SupportedActions<Resource>[]
): (opts: { req: AuthenticatedRequest }) => SupportedActions<Resource>[] {
  return ({ req }) =>
    actions.filter(action => {
      const [, field] = action.split(':')
      return field in req.body
    })
}
export function actionFromBody<Resource extends SupportedResource>(action: SupportedActions<Resource>) {
  return opts => actionsFromBody([action])(opts)[0]
}

export function actionsIfNotSelfUser<Resource extends SupportedResource>(
  actions: SupportedActions<Resource>[]
): (opts: { req: AuthenticatedRequest; restApi: RestApi }) => SupportedActions<Resource>[] {
  return ({ req, restApi }) => {
    const currentUser = restApi.getCurrentUser()
    const userId = req.params.id

    if (currentUser.id !== userId) {
      return actions
    }

    return []
  }
}
export function actionIfNotSelfUser<Resource extends SupportedResource>(action: SupportedActions<Resource>) {
  return opts => actionsIfNotSelfUser([action])(opts)[0]
}

type AclEntry = {
  [Resource in SupportedResource]: {
    resource: Resource
  } & (
    | {
        action:
          | SupportedActions<Resource>
          | ((opts: { req: AuthenticatedRequest; restApi: RestApi }) => SupportedActions<Resource>)
        actions?: never
      }
    | {
        actions:
          | SupportedActions<Resource>[]
          | ((opts: { req: AuthenticatedRequest; restApi: RestApi }) => SupportedActions<Resource>[])
        action?: never
      }
  ) &
    (
      | {
          objectIds: string[] | ((opts: { req: AuthenticatedRequest }) => XoRecord['id'][])
          getObject?:
            | ((opts: { restApi: RestApi }) => (id: Branded<any>) => Promise<NonXapiXoRecord>)
            | ((opts: { restApi: RestApi }) => (id: Branded<any>) => XapiXoRecord)
        }
      | {
          objectId: string | ((opts: { req: AuthenticatedRequest }) => XoRecord['id'])
          getObject?:
            | ((opts: { restApi: RestApi }) => (id: Branded<any>) => Promise<NonXapiXoRecord>)
            | ((opts: { restApi: RestApi }) => (id: Branded<any>) => XapiXoRecord)
        }
      | {
          objectIds?: never
          objectId?: never
          getObject?: never
          objects: object[] | ((opts: { req: AuthenticatedRequest }) => object[])
          object?: never
        }
      | {
          objectIds?: never
          objectId?: never
          getObject?: never
          objects?: never
          object: object | ((opts: { req: AuthenticatedRequest }) => object)
        }
    )
}[SupportedResource]

export const XAPI_TYPE_BY_ACL_RESOURCE = {
  message: 'message',
  gpuGroup: 'gpuGroup',
  host: 'host',
  network: 'network',
  pbd: 'PBD',
  pci: 'PCI',
  pgpu: 'PGPU',
  pif: 'PIF',
  pool: 'pool',
  sr: 'SR',
  vbd: 'VBD',
  vdi: 'VDI',
  'vdi-snapshot': 'VDI-snapshot',
  'vdi-unmanaged': 'VDI-unmanaged',
  vgpu: 'vgpu',
  vgpuType: 'vgpuType',
  vif: 'VIF',
  vm: 'VM',
  'vm-controller': 'VM-controller',
  'vm-snapshot': 'VM-snapshot',
  'vm-template': 'VM-template',
  vtpm: 'VTPM',
  sm: 'SM',
} satisfies Partial<Record<SupportedResource, XapiXoRecord['type']>>

function normalizeAclEntry(acl: AclEntry) {
  const aclAction = acl.action
  const aclActions =
    'actions' in acl && acl.actions !== undefined
      ? acl.actions
      : typeof aclAction === 'function'
        ? (opts: { req: AuthenticatedRequest; restApi: RestApi }) => [aclAction(opts)]
        : [aclAction]

  const actionsResolver =
    typeof aclActions === 'function'
      ? (req: AuthenticatedRequest, restApi: RestApi) => aclActions({ req, restApi })
      : () => aclActions

  const base = { resource: acl.resource, actionsResolver, getObject: acl.getObject }

  if ('objects' in acl && acl.objects !== undefined) {
    return { ...base, objects: acl.objects }
  }

  if ('object' in acl && acl.object !== undefined) {
    let objects: object[] | ((opts: { req: AuthenticatedRequest }) => object[])
    if (typeof acl.object === 'function') {
      const fn = acl.object
      objects = (opts: { req: AuthenticatedRequest }) => [fn(opts)]
    } else {
      objects = [acl.object]
    }
    return { ...base, objects }
  }

  if ('objectIds' in acl && acl.objectIds !== undefined) {
    return { ...base, objectIds: acl.objectIds }
  }

  if ('objectId' in acl && acl.objectId !== undefined) {
    let objectIds: string[] | ((opts: { req: AuthenticatedRequest }) => string[])
    if (typeof acl.objectId === 'function') {
      const fn = acl.objectId
      objectIds = (opts: { req: AuthenticatedRequest }) => [fn(opts)]
    } else {
      objectIds = [acl.objectId]
    }
    return { ...base, objectIds }
  }

  throw new Error('invalid ACL entry')
}

export function acl(acls: AclEntry | AclEntry[]) {
  acls = Array.isArray(acls) ? acls : [acls]
  const _acls = acls.map(normalizeAclEntry)

  async function middleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    const restApi = iocContainer.get(RestApi)
    const user = restApi.getCurrentUser()
    const invalidFields: { [key: string]: { message: string; value: unknown } } = {}
    const missingPrivilegeParams: AnyPrivilegeOnParam[] = []

    for (const acl of _acls) {
      let objects: object[] = []

      if ('objectIds' in acl) {
        let ids: { id: unknown; path?: string }[] = []
        if (typeof acl.objectIds === 'function') {
          ids = acl.objectIds({ req }).map(id => ({ id }))
        } else {
          for (const path of acl.objectIds) {
            const id: unknown = path.split('.').reduce((obj, part) => obj[part], req)
            ids.push({ id, path })
          }
        }

        for (const { id, path } of ids) {
          if (id === undefined) {
            continue
          }
          if (typeof id !== 'string') {
            invalidFields[path ?? 'unknown'] = {
              message: 'invalid string value',
              value: id,
            }
            continue
          }
          if (Object.keys(invalidFields).length > 0) {
            // No need to get objects if we already known some params are invalid
            continue
          }

          try {
            const object =
              (await acl.getObject?.({ restApi })(id as XoRecord['id'])) ??
              restApi.getObject(id as XapiXoRecord['id'], XAPI_TYPE_BY_ACL_RESOURCE[acl.resource])
            objects.push(object)
          } catch (error) {
            return next(error)
          }
        }
      }
      if ('objects' in acl) {
        if (typeof acl.objects === 'function') {
          objects = acl.objects({ req })
        } else {
          objects = acl.objects
        }
      }

      // We cast here to restore the discriminated union correlation between `resource` and `action`.
      // When rebuilding an object from individual properties of a discriminated union, TypeScript transform it into an union type
      //   { resource: SupportedResource, action: SupportedAction<SupportedResource> }
      // This loses the original correlation (e.g. it would allow invalid pairs like { resource: 'vgpu', action: 'snapshot' }).
      // The `as` cast re-asserts the discriminated union member type.
      for (const action of acl.actionsResolver(req, restApi)) {
        if (action === undefined) {
          // action can be undefined, if the action is created from `actionFromBody` or `actionIfNotSelfUser`
          continue
        }

        missingPrivilegeParams.push({ action, resource: acl.resource, objects, user } as AnyPrivilegeOnParam)
      }
    }

    if (Object.keys(invalidFields).length > 0) {
      return next(new ValidateError(invalidFields, 'invalid parameters'))
    }

    let userPrivileges: Awaited<ReturnType<XoApp['getAclV2UserPrivileges']>>
    try {
      userPrivileges = await restApi.xoApp.getAclV2UserPrivileges(user.id)
    } catch (error) {
      return next(error)
    }

    const missingPrivileges = getMissingPrivileges(missingPrivilegeParams, userPrivileges)
    if (missingPrivileges.length > 0) {
      return next(
        new ApiError('not enough privileges', 403, {
          data: {
            missingPrivileges,
          },
        })
      )
    }

    next()
  }

  Object.defineProperty(middleware, 'name', { value: ACL_MIDDLEWARE_NAME })
  return middleware
}
