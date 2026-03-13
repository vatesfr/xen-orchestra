import { FieldDefinition, PluginRouter, RouteDefinition } from './types.mjs'
import { json, Router, type Express, type NextFunction, Request, Response } from 'express'
import { join } from 'path'
import { pipeline } from 'node:stream/promises'
import { Readable } from 'node:stream'
import { z, ZodError } from 'zod'
import { createSchema } from 'zod-openapi'
import { buildOpenApiSchema } from '../open-api/schema/build-openapi-schema.mjs'
import { OpenAPIV3 } from 'openapi-types'

export function createPluginRouter(
  express: Express,
  base_url: string,
  swaggerOpenApiSpec: OpenAPIV3.Document
): PluginRouter {
  const router: Router = Router({ strict: false })
  express.use(base_url, router)

  function registerDynamicRoutes(
    routes: RouteDefinition[],
    options: {
      authenticate: (req: Request) => Promise<any>
      runWithContext: (user: any, fn: () => any) => Promise<any>
    },
    base = '/'
  ): void {
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

      const paramsSchema = params ? buildZodSchema(params) : undefined
      const querySchema = query ? buildZodSchema(query) : undefined
      const bodySchema = body ? buildZodSchema(body) : undefined

      const expressPath = fullPath.replace(/{(\w+)}/g, ':$1')
      router[lowerMethod](
        expressPath,
        json(),
        async function autoRegisteredHandler(req: Request, res: Response, next: NextFunction) {
          try {
            const user = await authenticate(req)

            const validatedParams = paramsSchema ? paramsSchema.parse(req.params) : req.params
            const validatedQuery = querySchema ? querySchema.parse(req.query) : req.query
            const validatedBody = bodySchema ? bodySchema.parse(req.body) : req.body

            // TODO: Maybe remove the runwith context.
            const result = await runWithContext(user, () =>
              handler({
                params: validatedParams,
                query: validatedQuery,
                body: validatedBody,
                req,
                res,
              })
            )

            // TODO: check if this is necessary and we just can't fly with the result.
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
            /*if (error instanceof ZodError) {
                            return res.status(422).json({ error: 'ValidationError', details: error.issues })
                        }*/
            next(error)
          }
        }
      )

      // Keep Swagger mutation
      addPathToSwagger(
        lowerMethod,
        fullPath,
        paramsSchema,
        querySchema,
        bodySchema,
        responseDefinitions,
        swaggerOpenApiSpec
      )
    }
  }

  function unregisterDynamicRoutes(routes: RouteDefinition[], base = '/'): void {
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

        const expressPath = fullPath.replace(/{(\w+)}/g, ':$1')
        const pathMatches = route.path === expressPath
        const methodMatches = route.methods?.[lowerMethod]

        // TODO: Check if this could not lead to issues with multiple handlers. Maybe build a custom handler with custom name.
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

// Add the rest route path to the rest api swagger with the input schema and response definitons
function addPathToSwagger(
  method: string,
  fullPath: string,
  paramsSchema: z.ZodType | undefined,
  querySchema: z.ZodType | undefined,
  bodySchema: z.ZodType | undefined,
  responseDefinitions: RouteDefinition['responses'] = [],
  swaggerOpenApiSpec: OpenAPIV3.Document
): void {
  if (!swaggerOpenApiSpec.paths[fullPath]) {
    swaggerOpenApiSpec.paths[fullPath] = {}
  }

  const operation: any = {
    tags: ['plugins'],
    parameters: [],
    responses: {},
  }

  if (paramsSchema) operation.parameters.push(...extractParametersFromZod(paramsSchema, 'path'))

  if (querySchema) operation.parameters.push(...extractParametersFromZod(querySchema, 'query'))

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

// Build zod schema to allow easy input validation
function buildZodSchema(def: Record<string, FieldDefinition>): z.ZodObject<Record<string, z.ZodTypeAny>> {
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

    if (field.example) schema = schema.meta({ example: field.example })

    if (field.optional) schema = schema.optional()

    shape[key] = schema
  }

  return z.object(shape)
}

function extractParametersFromZod(schema: z.ZodType, location: 'path' | 'query'): Array<Record<string, unknown>> {
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
  if (jsonSchema.properties) {
    return Object.entries(jsonSchema.properties).map(([name, property]: any) => ({
      name,
      in: location,
      required: (jsonSchema.required ?? []).includes(name),
      schema: {
        type: property.type,
      },
      example: property.example,
    }))
  }

  return []
}

// Exported for retro-compatibility
export async function sendObjects(iterable: any, req: Request, res: Response) {
  const jsonFormat = !Object.hasOwn(req.query, 'ndjson')

  res.setHeader('content-type', jsonFormat ? 'application/json' : 'application/x-ndjson')

  return pipeline(Readable.from((jsonFormat ? makeJsonStream : makeNdJsonStream)(iterable)), res)
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
