import type { AclEntry } from '../middlewares/acl.middleware.mjs'
import type { MaybePromise } from '../helpers/helper.type.mjs'
import type { RestApi } from '../rest-api/rest-api.mjs'
import type { VatesTask } from '@vates/types/lib/vates/task'
import type { BaseRouteDefinition, FieldDefinition, ParamFieldDefinition, QueryFieldDefinition } from '@vates/types'
import type { NextFunction, Request, Response } from 'express'

export type { FieldDefinition, ParamFieldDefinition, QueryFieldDefinition }

export type CreateAction = <CbType>(
  cb: (task: VatesTask) => MaybePromise<CbType>,
  options: {
    sync?: boolean
    statusCode?: number
    taskProperties: { name: string; [key: string]: unknown }
  }
) => Promise<CbType | undefined>

// Maps middleware descriptor names to their OpenAPI content type
export const CONTENT_TYPE_BY_MIDDLEWARE_NAME: Record<string, string> = {
  json: 'application/json',
  urlencoded: 'application/x-www-form-urlencoded',
  text: 'text/plain',
  raw: 'application/octet-stream',
}

export type MiddlewareDescriptor =
  | { name: 'json' | 'urlencoded' | 'text' | 'raw'; options?: Record<string, unknown> }
  | { name: 'acl'; acls: AclEntry | AclEntry[] }

export type RouteDefinition = Omit<BaseRouteDefinition<MiddlewareDescriptor>, 'callback'> & {
  callback: (params: {
    req: Request
    res: Response
    next: NextFunction
    restApi: RestApi
    createAction: CreateAction
  }) => MaybePromise<unknown>
}
