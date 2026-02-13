import {
  type AnyPrivilege,
  type AnyPrivilegeOnParam,
  type SupportedActions,
  type SupportedResource,
  getMissingPrivileges,
} from '@xen-orchestra/acl'
import type { Branded, XoMessage } from '@vates/types'
import { createLogger } from '@xen-orchestra/log'
import { isPromise } from 'node:util/types'
import type { NextFunction, Request, Response } from 'express'
import { unauthorized, noSuchObject } from 'xo-common/api-errors.js'

import { AlarmService } from '../alarms/alarm.service.mjs'
import { ApiError } from '../helpers/error.helper.mjs'
import type { AuthenticatedRequest, MaybePromise } from '../helpers/helper.type.mjs'
import { BackupArchiveService } from '../backup-archives/backup-archive.service.mjs'
import { BackupJobService } from '../backup-jobs/backup-job.service.mjs'
import { BackupLogService } from '../backup-logs/backup-log.service.mjs'
import { iocContainer } from '../ioc/ioc.mjs'
import { RestApi } from '../rest-api/rest-api.mjs'
import type { RestXoRecord } from '../abstract-classes/base-controller.mjs'
import type { XoApp } from '../rest-api/rest-api.type.mjs'

const log = createLogger('xo:rest-api:authentication')

export type SecurityName = '*' | 'token' | 'basic' | 'none'

const aclResourceToGetObject: Record<
  AnyPrivilege['resource'],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (restApi: RestApi) => (id: Branded<any>) => MaybePromise<RestXoRecord>
> = {
  host: restApi => id => restApi.getObject(id, 'host'),
  message: restApi => id => {
    const maybeMessage = restApi.getObject<XoMessage>(id, 'message')
    const alarmService = restApi.ioc.get(AlarmService)
    if (alarmService.isAlarm(maybeMessage)) {
      throw noSuchObject(id, 'message')
    }
    return maybeMessage
  },
  network: restApi => id => restApi.getObject(id, 'network'),
  pbd: restApi => id => restApi.getObject(id, 'PBD'),
  pci: restApi => id => restApi.getObject(id, 'PCI'),
  pgpu: restApi => id => restApi.getObject(id, 'PGPU'),
  pif: restApi => id => restApi.getObject(id, 'PIF'),
  pool: restApi => id => restApi.getObject(id, 'pool'),
  sm: restApi => id => restApi.getObject(id, 'SM'),
  sr: restApi => id => restApi.getObject(id, 'SR'),
  vbd: restApi => id => restApi.getObject(id, 'VBD'),
  vdi: restApi => id => restApi.getObject(id, 'VDI'),
  'vdi-snapshot': restApi => id => restApi.getObject(id, 'VDI-snapshot'),
  vif: restApi => id => restApi.getObject(id, 'VIF'),
  vm: restApi => id => restApi.getObject(id, 'VM'),
  'vm-controller': restApi => id => restApi.getObject(id, 'VM-controller'),
  'vm-snapshot': restApi => id => restApi.getObject(id, 'VM-snapshot'),
  'vm-template': restApi => id => restApi.getObject(id, 'VM-template'),

  alarm: restApi => async id => {
    const maybeAlarm = restApi.getObject<XoMessage>(id, 'message')
    const alarmService = restApi.ioc.get(AlarmService)
    if (!alarmService.isAlarm(maybeAlarm)) {
      throw noSuchObject(id, 'alarm')
    }
    return alarmService.parseAlarm(maybeAlarm)
  },
  'backup-archive': restApi => async id => {
    const backupArchiveService = restApi.ioc.get(BackupArchiveService)
    return backupArchiveService.getBackupArchive(id)
  },
  'backup-job': restApi => async id => {
    const job = await restApi.xoApp.getJob(id)
    const backupJobService = restApi.ioc.get(BackupJobService)
    if (!backupJobService.isBackupJob(job)) {
      throw noSuchObject(id, 'backup-job')
    }
    return job
  },
  'backup-log': restApi => async id => {
    const log = await restApi.xoApp.getBackupNgLogs(id)
    const backupLogService = restApi.ioc.get(BackupLogService)
    if (!backupLogService.isBackupLog(log)) {
      throw noSuchObject(id, 'backup-log')
    }
    return log
  },
  'backup-repository': restApi => restApi.xoApp.getRemote,
  group: restApi => restApi.xoApp.getGroup,
  proxy: restApi => restApi.xoApp.getProxy,
  'restore-log': restApi => async id => {
    const log = await restApi.xoApp.getBackupNgLogs(id)
    const backupLogService = restApi.ioc.get(BackupLogService)
    if (backupLogService.isBackupLog(log)) {
      throw noSuchObject(id, 'restore-log')
    }
    return log
  },
  schedule: restApi => restApi.xoApp.getSchedule,
  server: restApi => restApi.xoApp.getXenServer,
  task: restApi => restApi.tasks.get,
  user: restApi => restApi.xoApp.getUser,
}

type MiddlewarePrivilege<T extends AnyPrivilege['resource']> = {
  resource: T
  action: SupportedActions<T>
}
type MiddlewarePrivilegeOpts = {
  // How to retrive the object ID. by default req.params.id
  objectId?: (params: AuthenticatedRequest['params']) => string
}

export function acl<T extends SupportedResource>(
  privileges: MiddlewarePrivilege<T> | MiddlewarePrivilege<T>[],
  opts: MiddlewarePrivilegeOpts = {}
) {
  if (!Array.isArray(privileges)) {
    privileges = [privileges]
  }

  return async function _aclMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    const restApi = iocContainer.get(RestApi)
    const user = restApi.getCurrentUser()
    const objectId = (opts.objectId?.(req.params) ?? req.params.id) as RestXoRecord['id']
    const getObject = aclResourceToGetObject[privileges[0].resource](restApi)

    let object: RestXoRecord
    try {
      const maybePromise = getObject(objectId)
      if (isPromise(maybePromise)) {
        object = await maybePromise
      } else {
        object = maybePromise
      }
    } catch (error) {
      return next(error)
    }

    const paramPrivileges = privileges.map(privilege => ({
      ...privilege,
      objects: object,
      user,
    })) as unknown as Extract<AnyPrivilegeOnParam, { resource: T }>[]
    const userPrivileges = await restApi.xoApp.getAclV2UserPrivileges(user.id)
    const missingPrivileges = getMissingPrivileges(paramPrivileges, userPrivileges)
    if (missingPrivileges.length === 0) {
      return next()
    }

    next(
      new ApiError('no enough privileges', 403, {
        data: {
          missingPrivileges: missingPrivileges.map(({ action, resource, objectId }) => ({
            action,
            resource,
            objectId,
          })),
        },
      })
    )
  }
}

// TSOA spec require this function to be async
export async function expressAuthentication(req: AuthenticatedRequest, securityName: SecurityName) {
  if (securityName === 'none') {
    return undefined
  }

  const restApi = iocContainer.get(RestApi)
  const user = restApi.getCurrentUser()
  const authType = req.res.locals.authType

  if (securityName !== '*' && authType !== securityName) {
    throw new ApiError(`invalid authentification. please use ${securityName} authentication`, 401)
  }

  if (user.permission !== 'admin') {
    // If user is not admin, ensure an ACL middleware is set on the endpoint. Otherwise throw unauthorized
    const currentPosition = req.route.stack.findIndex(layer => layer.name === expressAuthentication.name)
    const hasAclMiddleware = req.route.stack.slice(currentPosition + 1).some(layer => layer.name === '_aclMiddleware')
    if (!hasAclMiddleware) {
      log.error(`This endpoint can only be used by 'xoa-admin' users for now. Your permission: ${user.permission}`)
      throw unauthorized()
    }
  }

  return user
}

export function setupApiContext(xoApp: XoApp) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const { cookies, headers, ip, query } = req
    const { authorization } = headers
    const token = cookies.authenticationToken ?? cookies.token

    const hasToken = Boolean(token)
    const hasBasic = Boolean(authorization)

    if (hasToken && hasBasic) {
      return next(new ApiError('Having multiple authentication methods is not supported, please choose one', 400))
    }

    if (!hasToken && !hasBasic) {
      return xoApp.runWithApiContext(undefined, next)
    }

    const credentials = {}
    if (hasToken) {
      Object.assign(credentials, { token })
      res.locals.authType = 'token'
    } else {
      const [, encoded] = authorization!.split(' ')
      if (encoded === undefined) {
        return next(new ApiError('Malformed Authorization header', 400))
      }

      const [username, password] = Buffer.from(encoded, 'base64').toString().split(':')
      Object.assign(credentials, { username, password, otp: query.otp })
      res.locals.authType = 'basic'
    }

    try {
      const { user } = await xoApp.authenticateUser(credentials, { ip })
      return xoApp.runWithApiContext(user, next)
    } catch (error) {
      return next(error)
    }
  }
}
