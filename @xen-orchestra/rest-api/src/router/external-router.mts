import { pipeline } from 'node:stream/promises'
import { Readable } from 'node:stream'
import { Router, json, urlencoded, text, raw, type Request, type Response, type RequestHandler } from 'express'
import type { Options, OptionsJson, OptionsText, OptionsUrlencoded } from 'body-parser'
import { invalidParameters } from 'xo-common/api-errors.js'
import { createLogger } from '@xen-orchestra/log'
import { z, ZodError } from 'zod'
import { createSchema } from 'zod-openapi'
import type { OpenAPIV3 } from 'openapi-types'
import { buildOpenApiSchema } from '../open-api/schema/build-openapi-schema.mjs'
import { makeJsonStream, makeNdJsonStream } from '../helpers/stream.helper.mjs'
import type { AuthenticatedRequest } from '../helpers/helper.type.mjs'
import { expressAuthentication } from '../middlewares/authentication.middleware.mjs'
import { iocContainer } from '../ioc/ioc.mjs'
import { RestApi } from '../rest-api/rest-api.mjs'
import {
  CONTENT_TYPE_BY_MIDDLEWARE_NAME,
  type FieldDefinition,
  type MiddlewareDescriptor,
  type RouteDefinition,
} from './types.mjs'

const log = createLogger('xo:rest-api:external-router')

// Returns a mountExternalRoute function that allows routes to be added dynamically to the express router and a reference to the router
export function createExternalRouter(swaggerOpenApiSpec: OpenAPIV3.Document): {
  mountExternalRoute: (route: RouteDefinition) => () => void
  externalRouter: Router
} {
  const externalRouter = Router()

  const mountExternalRoute = function mountExternalRoute(route: RouteDefinition) {
    const restApi = iocContainer.get(RestApi)

    const tags = route.tags ?? []

    // Build zod schema for input validation
    const paramsSchema = route.params && buildZodSchema(route.params)
    const querySchema = route.query && buildZodSchema(route.query)
    const bodySchema = route.body && buildZodSchema(route.body)

    // Format route params for express
    const expressEndpoint = route.endpoint.replace(/{(\w+)}/g, ':$1')

    // Resolve middleware descriptors to actual Express RequestHandlers
    const middlewareDescriptors = route.middlewares ?? []
    const middlewares = middlewareDescriptors.map(resolveMiddleware)

    // Set the body content type based on the used middleware
    const bodyContentType = middlewareDescriptors
      .map(descriptor => CONTENT_TYPE_BY_MIDDLEWARE_NAME[descriptor.name])
      .find(Boolean)

    // Add route to router
    externalRouter[route.method](expressEndpoint, ...middlewares, async (req, res, next) => {
      try {
        // Handle authentication if required
        if (route.security === undefined) route.security = '*'
        await expressAuthentication(req as AuthenticatedRequest, route.security)

        // Coerces query boolean from string to boolean
        coerceBooleanQueryParams(req.query as Record<string, unknown>, route.query)

        // Validate inputs, throws if invalid
        paramsSchema?.parse(req.params)
        querySchema?.parse(req.query)
        bodySchema?.parse(req.body)

        // Call the route callback with the right context and parameters
        const result = await route.callback({ req, res, next, restApi })

        // Handle result formatting if the callback didn't already send a response
        if (!res.headersSent) {
          if (result === undefined) {
            res.status(204).end()
          } else {
            const isIterable =
              result != null &&
              typeof result !== 'string' &&
              typeof (result[Symbol.iterator] ?? result[Symbol.asyncIterator]) === 'function'
            if (isIterable) {
              await sendObjects(result as Iterable<unknown> | AsyncIterable<unknown>, req, res)
            } else {
              res.json(result)
            }
          }
        }
      } catch (error) {
        // Handle zod validation error to run with existing error middleware
        if (error instanceof ZodError) {
          try {
            throw invalidParameters(undefined, error.issues)
          } catch (xoError) {
            return next(xoError)
          }
        }

        return next(error)
      }
    })

    // Add route to the swagger documentation in memory
    addPathToSwagger(
      route.method,
      route.endpoint,
      tags,
      paramsSchema,
      querySchema,
      bodySchema,
      bodyContentType,
      route.responses,
      swaggerOpenApiSpec
    )

    // Return an unregister function to remove the route when they are not needed anymore
    return () => {
      const index = externalRouter.stack.findIndex(layer => {
        // layer.route.methods is not exposed so we need to redefine the type
        const layerRoutes = layer.route as { path: string; methods: Record<string, boolean> } | undefined
        return layerRoutes?.path === expressEndpoint && layerRoutes.methods[route.method] === true
      })

      if (index !== -1) {
        externalRouter.stack.splice(index, 1)

        removePathFromSwagger(route.endpoint, route.method, swaggerOpenApiSpec)
      } else {
        log.warn(`Failed to unregister external route ${route.method.toUpperCase()} ${route.endpoint} from REST API.`)
      }
    }
  }

  return { mountExternalRoute, externalRouter }
}

// Add the rest route path to the rest api swagger with the input schema and response definitions
function addPathToSwagger(
  method: string,
  fullPath: string,
  tags: string[],
  paramsSchema: z.ZodType | undefined,
  querySchema: z.ZodType | undefined,
  bodySchema: z.ZodType | undefined,
  bodyContentType: string | undefined,
  responseDefinitions: RouteDefinition['responses'] = [],
  swaggerOpenApiSpec: OpenAPIV3.Document
): void {
  if (!swaggerOpenApiSpec.paths[fullPath]) {
    swaggerOpenApiSpec.paths[fullPath] = {}
  }

  const operation: OpenAPIV3.OperationObject = {
    tags: [...tags, 'external'],
    parameters: [],
    responses: {},
  }

  if (paramsSchema) operation.parameters?.push(...extractParametersFromZod(paramsSchema, 'path'))

  if (querySchema) operation.parameters?.push(...extractParametersFromZod(querySchema, 'query'))

  if (bodySchema) {
    const { schema: bodyJson } = createSchema(bodySchema, { io: 'input' })

    operation.requestBody = {
      required: true,
      content: {
        [bodyContentType ?? 'text/plain']: { schema: bodyJson as OpenAPIV3.SchemaObject },
      },
    }
  }

  if (responseDefinitions?.length) {
    for (const responseDefinition of responseDefinitions) {
      const response: OpenAPIV3.ResponseObject = {
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

// Remove the rest route path from the rest api swagger
function removePathFromSwagger(path: string, method: string, swaggerOpenApiSpec: OpenAPIV3.Document): void {
  if (swaggerOpenApiSpec.paths?.[path]) {
    delete swaggerOpenApiSpec.paths[path][method]

    if (Object.keys(swaggerOpenApiSpec.paths[path]).length === 0) {
      delete swaggerOpenApiSpec.paths[path]
    }
  }
}

// Resolve a middleware descriptor to an actual Express RequestHandler
function resolveMiddleware(descriptor: MiddlewareDescriptor): RequestHandler {
  switch (descriptor.name) {
    case 'json':
      return json(descriptor.options as OptionsJson)
    case 'urlencoded':
      return urlencoded(descriptor.options as OptionsUrlencoded)
    case 'text':
      return text(descriptor.options as OptionsText)
    case 'raw':
      return raw(descriptor.options as Options)
  }
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

// Build OpenApi parameters from zod schema
function extractParametersFromZod(schema: z.ZodType, location: 'path' | 'query'): Array<OpenAPIV3.ParameterObject> {
  const { schema: jsonSchema } = createSchema(schema, { io: 'input' })

  // If it’s a $ref, we can’t expand properties
  if ('$ref' in jsonSchema) {
    return [
      {
        name: location,
        in: location,
        required: true,
        schema: jsonSchema as OpenAPIV3.SchemaObject,
      },
    ]
  }

  // Otherwise, iterate properties
  if (jsonSchema.properties) {
    return (Object.entries(jsonSchema.properties) as Array<[string, OpenAPIV3.SchemaObject]>).map(
      ([name, property]) => ({
        name,
        in: location,
        required: (jsonSchema.required ?? []).includes(name),
        schema: {
          type: property.type,
        },
        example: property.example,
      })
    ) as OpenAPIV3.ParameterObject[]
  }

  return []
}

function coerceBooleanQueryParams(query: Record<string, unknown>, def: RouteDefinition['query']): void {
  if (!def) return
  for (const [key, field] of Object.entries(def)) {
    if (field.type === 'boolean' && typeof query[key] === 'string') {
      query[key] = query[key] === 'true'
    }
  }
}

// Exported for retro-compatibility
// TODO: remove export when RestApi.registerRestApi is no longer used
export async function sendObjects(
  iterable: Iterable<unknown> | AsyncIterable<unknown>,
  req: Request,
  res: Response
): Promise<void> {
  const jsonFormat = !Object.hasOwn(req.query, 'ndjson')

  res.setHeader('content-type', jsonFormat ? 'application/json' : 'application/x-ndjson')

  return pipeline(Readable.from((jsonFormat ? makeJsonStream : makeNdJsonStream)(iterable)), res)
}
