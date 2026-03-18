import { SecurityName } from '../middlewares/authentication.middleware.mjs'
import { MaybePromise } from '../helpers/helper.type.mjs'

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
  params?: Record<string, FieldDefinition>
  query?: Record<string, FieldDefinition>
  body?: Record<string, FieldDefinition>
  responses?: Array<{
    status: number
    description: string
    schema?: Record<string, FieldDefinition>
  }>
  callback: ({ req, res, next, restApi }) => MaybePromise<unknown>
  security?: SecurityName
}
