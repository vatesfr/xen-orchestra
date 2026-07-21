import type { NextFunction, Request, Response } from 'express'

export type SecurityName = '*' | 'token' | 'basic' | 'none'

export type FieldDefinition =
  | {
      type: 'string'
      example?: string
      optional?: boolean
    }
  | {
      type: 'boolean'
      example?: boolean
      optional?: boolean
    }
  | {
      type: 'number'
      example?: number
      optional?: boolean
    }
  | {
      type: 'enum'
      enum: string[]
      example?: string
      optional?: boolean
    }
  | {
      type: 'object'
      fields: Record<string, FieldDefinition>
      optional?: boolean
    }
  | {
      type: 'array'
      items: FieldDefinition
      example?: unknown[]
      optional?: boolean
    }

export type ParamFieldDefinition = Exclude<
  FieldDefinition,
  { type: 'boolean' } | { type: 'object' } | { type: 'array' }
>

export type QueryFieldDefinition = Exclude<FieldDefinition, { type: 'object' } | { type: 'array' }>
type RestApi = object

export interface BaseRouteDefinition<Middleware> {
  method: 'get' | 'post' | 'put' | 'delete' | 'patch'
  endpoint: string
  description?: string
  tags?: string[]
  params?: Record<string, ParamFieldDefinition>
  query?: Record<string, QueryFieldDefinition>
  body?: Record<string, FieldDefinition>
  responses?: Array<{
    status: number
    description: string
    schema?: Record<string, FieldDefinition>
  }>
  middlewares?: Middleware[]
  scope?: 'acl'
  callback: (params: {
    req: Request
    res: Response
    next: NextFunction
    restApi: RestApi
    createAction: Function
  }) => MaybePromise<unknown>
  security?: SecurityName
}

export type MiddlewareDescriptor =
  | { name: 'json' | 'urlencoded' | 'text' | 'raw'; options?: Record<string, unknown> }
  | { name: 'acl'; acls: LooseAclEntry | LooseAclEntry[] }

type MaybePromise<T> = T | Promise<T>
/**
 * Loosely-typed mirror of {@link https://github.com/vatesfr/xen-orchestra/blob/master/@xen-orchestra/rest-api/src/middlewares/acl.middleware.mts | AclEntry}
 * from `@xen-orchestra/rest-api/src/middlewares/acl.middleware.mts`.
 */
export type LooseAclEntry = {
  resource: string
  action?: string | ((opts: { req: object; restApi: RestApi }) => string | undefined)
  actions?: string[] | ((opts: { req: object; restApi: RestApi }) => string[])
  objectId?: string | ((opts: { req: object; restApi: RestApi }) => string)
  objectIds?: string[] | ((opts: { req: object; restApi: RestApi }) => string[])
  object?: object | ((opts: { req: object; restApi: RestApi }) => MaybePromise<object> | undefined)
  objects?: object[] | ((opts: { req: object; restApi: RestApi }) => MaybePromise<object[]> | undefined)
  getObject?: (opts: { restApi: RestApi }) => (id: string) => MaybePromise<object>
}

export type PluginRestRouteDefinition = BaseRouteDefinition<MiddlewareDescriptor>
