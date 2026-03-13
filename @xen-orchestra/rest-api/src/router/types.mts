import { Request, Response } from 'express'

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
  method: string
  path: string
  params?: Record<string, FieldDefinition>
  query?: Record<string, FieldDefinition>
  body?: Record<string, FieldDefinition>
  responses?: Array<{
    status: number
    description: string
    schema?: Record<string, FieldDefinition>
  }>
  handler: (ctx: { params: any; query: any; body: any; req: Request; res: Response }) => any | AsyncIterable<any>
}

export type PluginRouter = {
  registerDynamicRoutes: (
    routes: RouteDefinition[],
    options: {
      authenticate: (req: Request) => Promise<any>
      runWithContext: (user: any, fn: () => any) => Promise<any>
    },
    base?: string
  ) => void

  unregisterDynamicRoutes: (routes: RouteDefinition[], base?: string) => void
}
