import type { SecurityName } from '../middlewares/authentication.middleware.mjs'
import type { NextFunction, Request, Response } from 'express'
import { MaybePromise } from '../helpers/helper.type.mjs'
import { RestApi } from '../rest-api/rest-api.mjs'

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

export interface RouteDefinition {
  method: 'get' | 'post' | 'put' | 'delete' | 'patch'
  endpoint: string
  tags?: string[]
  params?: Record<string, FieldDefinition>
  query?: Record<string, FieldDefinition>
  body?: Record<string, FieldDefinition>
  responses?: Array<{
    status: number
    description: string
    schema?: Record<string, FieldDefinition>
  }>
  middlewares?: MiddlewareDescriptor[]
  callback: (params: { req: Request; res: Response; next: NextFunction; restApi: RestApi }) => MaybePromise<unknown>
  security?: SecurityName
}
