// Self-contained REST route types shared with `@xen-orchestra/rest-api`.
//
// These live here (rather than in `@xen-orchestra/rest-api`) so that `XoApp`
// can type `registerRestRoutes` without importing from `@xen-orchestra/rest-api`,
// which would create a dependency cycle (`rest-api` already depends on
// `@vates/types`). Only the serializable, self-contained parts of a route are
// described here; `@xen-orchestra/rest-api` extends this with a precise
// `callback`/`middlewares` typing in its own `RouteDefinition`.

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

// Boundary type used by `XoApp.registerRestRoutes`. `@xen-orchestra/rest-api`'s
// full `RouteDefinition` is assignable to this: `middlewares` and `callback` are
// intentionally loose here to avoid importing `AclEntry`/`RestApi`/express (all
// of which depend back on `@vates/types`). Routes stay fully type-checked where
// they are built, against the full `RouteDefinition`.
export interface RestRouteDefinition {
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
  middlewares?: unknown[]
  scope?: 'acl'
  callback: (params: any) => unknown // eslint-disable-line @typescript-eslint/no-explicit-any
  security?: string
}
