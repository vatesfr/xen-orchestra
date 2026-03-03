import * as swaggerUi from 'swagger-ui-express'
import { createRequire } from 'module'
import { json, Router, type Express, type NextFunction, Request, Response } from 'express'
import type { XoApp } from '@vates/types/xo-app'

import genericErrorHandler from './middlewares/generic-error-handler.middleware.mjs'
import tsoaToXoErrorHandler from './middlewares/tsoa-to-xo-error.middleware.mjs'
import { RegisterRoutes } from './open-api/routes/routes.js'
import { setupContainer } from './ioc/ioc.mjs'
import { setupApiContext } from './middlewares/authentication.middleware.mjs'
import { logMiddleware } from './middlewares/log.middleware.mjs'
import { join } from 'path'
import { pipeline } from 'node:stream/promises'
import { Readable } from 'node:stream'
import { z, ZodError } from 'zod'
import { createSchema } from 'zod-openapi'

export * from './open-api/common/response.common.mjs'

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

// Avoid using "import from" to import a json file as this requires assert/with and will break compatibility with recent node versions
// https://github.com/nodejs/node/issues/51622
const require = createRequire(import.meta.url)
const swaggerOpenApiSpec = require('../open-api/spec/swagger.json')

export const BASE_URL = '/rest/v0'

const SWAGGER_UI_OPTIONS = {
  swaggerOptions: {
    url: `${BASE_URL}/docs/swagger.json`,
    displayRequestDuration: true,
    docExpansion: 'none', // collapse all tags by default
    filter: true, // add a tags searchbar,
    tagsSorter: 'alpha',
    operationsSorter: (prev: Map<string, string>, next: Map<string, string>) => {
      // sort endpoints inside a tag alphabetically > HTTP verb

      const pathComparison = prev.get('path')!.localeCompare(next.get('path')!)
      if (pathComparison !== 0) {
        return pathComparison
      }

      const METHOD_ORDER = { get: 1, post: 2, put: 3, delete: 4, patch: 5 }
      const prevMethod = METHOD_ORDER[prev.get('method')!]
      const nextMethod = METHOD_ORDER[next.get('method')!]

      return prevMethod - nextMethod
    },
    requestSnippetsEnabled: true, // add more snippets (bash, PowerShell, CMD)
  },
}

async function* makeJsonStream(iterable: any) {
  yield '['
  let first = true
  for await (const object of iterable) {
    if (first) {
      first = false
      yield '\n'
    } else {
      yield ',\n'
    }
    yield JSON.stringify(object, null, 2)
  }
  yield '\n]\n'
}

async function* makeNdJsonStream(iterable: any) {
  for await (const object of iterable) {
    yield JSON.stringify(object)
    yield '\n'
  }
}

function buildZodSchema(def?: Record<string, FieldDefinition>): z.ZodTypeAny | undefined {
  if (!def) return undefined

  const shape: Record<string, z.ZodTypeAny> = {}

  for (const [key, field] of Object.entries(def)) {
    let schema: z.ZodTypeAny

    switch (field.type) {
      case 'string':
        schema = z.string()
        break
      case 'boolean':
        schema = z.boolean()
        break
      case 'number':
        schema = z.number()
        break
      case 'enum':
        schema = z.enum(field.enum as [string, ...string[]])
        break
      default:
        throw new Error(`Unsupported type: ${(field as any).type}`)
    }

    if (field.example) {
      schema = schema.meta({ example: field.example })
    }

    if (field.optional) {
      schema = schema.optional()
    }

    shape[key] = schema
  }

  return z.object(shape)
}

function buildOpenApiSchema(def?: Record<string, FieldDefinition>) {
  if (!def) return undefined

  const schema: any = {
    type: 'object',
    properties: {},
  }

  const required: string[] = []

  for (const [key, field] of Object.entries(def)) {
    const property: any = {}

    switch (field.type) {
      case 'enum':
        property.type = 'string'
        property.enum = field.enum
        break
      default:
        property.type = field.type
    }

    if (field.example !== undefined) {
      property.example = field.example
    }

    schema.properties[key] = property

    if (!field.optional) {
      required.push(key)
    }
  }

  if (required.length > 0) {
    schema.required = required
  }

  return schema
}

function extractParametersFromZod(schema: z.ZodType, location: 'path' | 'query') {
  const { schema: jsonSchema } = createSchema(schema, { io: 'input' })

  // If it’s a $ref, we can’t expand properties
  if ('$ref' in jsonSchema) {
    return [
      {
        name: location,
        in: location,
        required: true,
        schema: jsonSchema,
      },
    ]
  }

  // Otherwise, iterate properties
  return Object.entries(jsonSchema.properties ?? {}).map(([name, property]: any) => ({
    name,
    in: location,
    required: (jsonSchema.required ?? []).includes(name),
    schema: {
      type: property.type,
    },
    example: property.example,
  }))
}

function addPathToSwagger(
  method: string,
  fullPath: string,
  paramsSchema: z.ZodType | undefined,
  querySchema: z.ZodType | undefined,
  bodySchema: z.ZodType | undefined,
  responseDefinitions: RouteDefinition['responses'] = []
) {
  if (!swaggerOpenApiSpec.paths[fullPath]) {
    swaggerOpenApiSpec.paths[fullPath] = {}
  }

  const operation: any = {
    tags: ['plugins'],
    parameters: [],
    responses: {},
  }

  if (paramsSchema) {
    operation.parameters.push(...extractParametersFromZod(paramsSchema, 'path'))
  }

  if (querySchema) {
    operation.parameters.push(...extractParametersFromZod(querySchema, 'query'))
  }

  if (bodySchema) {
    const { schema: bodyJson } = createSchema(bodySchema, { io: 'input' })

    operation.requestBody = {
      required: true,
      content: {
        'application/json': { schema: bodyJson },
      },
    }
  }

  if (responseDefinitions) {
    for (const responseDefinition of responseDefinitions ?? []) {
      const response: any = {
        description: responseDefinition.description,
      }

      if (responseDefinition.schema) {
        response.content = {
          'application/json': {
            schema: buildOpenApiSchema(responseDefinition.schema),
          },
        }
      }

      operation.responses[responseDefinition.status] = response
    }
  } else {
    // default 200 response
    operation.responses['200'] = { description: 'Success' }
  }

  swaggerOpenApiSpec.paths[fullPath][method] = operation
}

function createPluginRouter(express: Express) {
  const router: Router = Router({ strict: false })
  express.use(BASE_URL, router)

  function registerDynamicRoutes(
    routes: RouteDefinition[],
    options: {
      authenticate: (req: Request) => Promise<any>
      runWithContext: (user: any, fn: () => any) => Promise<any>
    },
    base = '/'
  ) {
    const { authenticate, runWithContext } = options

    for (const routeDef of routes) {
      const { method, path, handler, params, query, body, responses: responseDefinitions } = routeDef

      const lowerMethod = method.toLowerCase()
      const fullPath = join(base, path)

      if (typeof router[lowerMethod] !== 'function') {
        throw new Error(`Unsupported HTTP method: ${method}`)
      }

      // prevent duplicates
      for (const layer of router.stack) {
        const route = (layer as any).route
        if (route?.path === fullPath && route.methods?.[lowerMethod]) {
          console.warn(`Route already registered: ${method} ${fullPath}`)
          continue
        }
      }

      const paramsSchema = buildZodSchema(params)
      const querySchema = buildZodSchema(query)
      const bodySchema = buildZodSchema(body)

      router[lowerMethod](
        fullPath,
        json(),
        async function autoRegisteredHandler(req: Request, res: Response, next: NextFunction) {
          try {
            const user = await authenticate(req)

            const validatedParams = paramsSchema ? paramsSchema.parse(req.params) : req.params
            const validatedQuery = querySchema ? querySchema.parse(req.query) : req.query
            const validatedBody = bodySchema ? bodySchema.parse(req.body) : req.body

            const result = await runWithContext(user, () =>
              handler({
                params: validatedParams,
                query: validatedQuery,
                body: validatedBody,
                req,
                res,
              })
            )

            const successResponse = responseDefinitions?.find(
              response => response.status >= 200 && response.status < 300
            )
            if (result !== undefined && !res.headersSent) {
              const isIterable =
                result != null && typeof (result[Symbol.iterator] ?? result[Symbol.asyncIterator]) === 'function'
              if (isIterable) {
                res.status(successResponse?.status ?? 200)
                await sendObjects(result, req, res)
              } else {
                res.status(successResponse?.status ?? 200).json(result)
              }
            }
          } catch (error) {
            if (error instanceof ZodError) {
              return res.status(422).json({ error: 'ValidationError', details: error.issues })
            }
            next(error)
          }
        }
      )

      // Keep Swagger mutation
      addPathToSwagger(lowerMethod, fullPath, paramsSchema, querySchema, bodySchema, responseDefinitions)
    }
  }

  function unregisterDynamicRoutes(routes: RouteDefinition[], base = '/') {
    for (const routeDef of routes) {
      const { method, path } = routeDef

      const lowerMethod = method.toLowerCase()
      const fullPath = join(base, path)

      let found = false

      // Loop backwards because dynamic routes were probably added last
      for (let i = router.stack.length - 1; i >= 0; i--) {
        const layer = router.stack[i] as any
        const route = layer.route as any

        if (!route) continue

        const pathMatches = route.path === fullPath
        const methodMatches = route.methods?.[lowerMethod]

        const isAutoRegistered = route.stack?.some((s: any) => s.handle?.name === 'autoRegisteredHandler')

        if (pathMatches && methodMatches && isAutoRegistered) {
          router.stack.splice(i, 1)
          found = true
          break
        }
      }

      if (!found) {
        console.warn('Route to unregister not found:', fullPath)
      }

      // Remove from Swagger
      if (swaggerOpenApiSpec.paths[fullPath]) {
        delete swaggerOpenApiSpec.paths[fullPath][lowerMethod]

        // Clean empty path object
        if (Object.keys(swaggerOpenApiSpec.paths[fullPath]).length === 0) {
          delete swaggerOpenApiSpec.paths[fullPath]
        }
      }
    }
  }

  return { registerDynamicRoutes, unregisterDynamicRoutes }
}

export async function sendObjects(iterable: any, req: Request, res: Response) {
  const jsonFormat = !Object.hasOwn(req.query, 'ndjson')

  res.setHeader('content-type', jsonFormat ? 'application/json' : 'application/x-ndjson')

  return pipeline(Readable.from((jsonFormat ? makeJsonStream : makeNdJsonStream)(iterable)), res)
}

export default function setupRestApi(express: Express, xoApp: XoApp) {
  setupContainer(xoApp)

  express.use(BASE_URL, setupApiContext(xoApp))
  express.use(BASE_URL, logMiddleware)

  RegisterRoutes(express)

  const pluginRouter = createPluginRouter(express)

  express.get(`${BASE_URL}/docs/swagger.json`, (_req, res) => {
    res.setHeader('Content-Type', 'application/json')
    res.json(swaggerOpenApiSpec)
  })

  // do not register the doc at the root level, or it may lead to unwanted behaviour
  express.get('/rest/v0', (_req, res) => res.redirect('/rest/v0/docs'))
  express.use(
    `${BASE_URL}/docs`,
    swaggerUi.serveFiles(undefined, SWAGGER_UI_OPTIONS),
    swaggerUi.setup(null, SWAGGER_UI_OPTIONS)
  )

  express.use(BASE_URL, tsoaToXoErrorHandler)
  express.use(BASE_URL, genericErrorHandler)

  return pluginRouter
}
