import type { SecurityName } from '../middlewares/authentication.middleware.mjs'
import type { NextFunction, Request, Response } from 'express'
import type { MaybePromise } from '../helpers/helper.type.mjs'
import type { RestApi } from '../rest-api/rest-api.mjs'
import type { VatesTask } from '@vates/types/lib/vates/task'

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

export type MiddlewareDescriptor = { name: 'json' | 'urlencoded' | 'text' | 'raw'; options?: Record<string, unknown> }

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

export type ParamFieldDefinition = Exclude<FieldDefinition, { type: 'boolean' }>

export interface RouteDefinition {
  method: 'get' | 'post' | 'put' | 'delete' | 'patch'
  endpoint: string
  tags?: string[]
  params?: Record<string, ParamFieldDefinition>
  query?: Record<string, FieldDefinition>
  body?: Record<string, FieldDefinition>
  responses?: Array<{
    status: number
    description: string
    schema?: Record<string, FieldDefinition>
  }>
  middlewares?: MiddlewareDescriptor[]
  callback: (params: {
    req: Request
    res: Response
    next: NextFunction
    restApi: RestApi
    createAction: CreateAction
  }) => MaybePromise<unknown>
  security?: SecurityName
}
