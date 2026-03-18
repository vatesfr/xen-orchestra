import { FieldDefinition, RouteDefinition } from './types.mjs'
import { json, Router, Request, Response } from 'express'
import { invalidParameters } from 'xo-common/api-errors.js'
import { pipeline } from 'node:stream/promises'
import { Readable } from 'node:stream'
import { z, ZodError } from 'zod'
import { createSchema } from 'zod-openapi'
import { buildOpenApiSchema } from '../open-api/schema/build-openapi-schema.mjs'
import { OpenAPIV3 } from 'openapi-types'
import { AuthenticatedRequest } from '../helpers/helper.type.mjs'
import { expressAuthentication } from '../middlewares/authentication.middleware.mjs'
import { iocContainer } from '../ioc/ioc.mjs'
import { RestApi } from '../rest-api/rest-api.mjs'
import { isPromise } from 'node:util/types'

// Returns a mountPluginRoute function tha allows routes to be added dynamically to the express router and a reference to the router
export function createMountPluginRoute(swaggerOpenApiSpec: OpenAPIV3.Document): {
  mountPluginRoute: Function
  pluginRouter: Router
} {
  const pluginRouter = Router()
  pluginRouter.use(json())

  const mountPluginRoute = function mountPluginRoute(route: RouteDefinition) {
    const restApi = iocContainer.get(RestApi)

    // Build zod schema for input validation
    const paramsSchema = route.params ? buildZodSchema(route.params) : undefined
    const querySchema = route.query ? buildZodSchema(route.query) : undefined
    const bodySchema = route.body ? buildZodSchema(route.body) : undefined

    // Format route params for express
    const expressEndpoint = route.endpoint.replace(/{(\w+)}/g, ':$1')
    pluginRouter[route.method](expressEndpoint, async (req, res, next) => {
      try {
        // Handle authentification if required
        if (route.security === undefined) route.security = '*'
        if (route.security !== 'none') {
          await expressAuthentication(req as AuthenticatedRequest, route.security)
        }

        // Validate inputs, throws if invalid
        paramsSchema?.parse(req.params)
        querySchema?.parse(req.query)
        bodySchema?.parse(req.body)

        let result: ReturnType<typeof route.callback>
        const callbackPromise = route.callback({ req, res, next, restApi })
        if (isPromise(callbackPromise)) {
          result = await callbackPromise
        } else {
          result = callbackPromise
        }

        // Handle result formating if iterable, status code should be already be set by the route callback
        if (result !== undefined && !res.headersSent) {
          const isIterable =
            result != null && typeof (result[Symbol.iterator] ?? result[Symbol.asyncIterator]) === 'function'
          if (isIterable) {
            await sendObjects(result, req, res)
          } else {
            res.json(result)
          }
        }
      } catch (error) {
        // Handle zod validation error to run with existing error middleware
        if (error instanceof ZodError) {
          try {
            invalidParameters(undefined, error.issues)
          } catch (xoError) {
            return next(xoError)
          }
        }

        return next(error)
      }
    })

    // Add route to the swagger documentation in memory)
    addPathToSwagger(
      route.method,
      route.endpoint,
      paramsSchema,
      querySchema,
      bodySchema,
      route.responses,
      swaggerOpenApiSpec
    )

    // Return an unregister function to remove the route when the plugin is unmounted
    return () => {
      const layer = pluginRouter.stack.at(-1)
      if (layer) {
        const index = pluginRouter.stack.indexOf(layer)
        if (index !== -1) {
          pluginRouter.stack.splice(index, 1)
        }

        removePathFromSwagger(route.endpoint, route.method, swaggerOpenApiSpec)
      } else {
        console.warn(
          `Failed to unregister plugin route ${route.method.toUpperCase()} ${route.endpoint} from Express router.`
        )
      }
    }
  }

  return { mountPluginRoute, pluginRouter }
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

// Remove the rest route path from the rest api swagger
function removePathFromSwagger(path: string, method: string, swaggerOpenApiSpec: OpenAPIV3.Document): void {
  if (swaggerOpenApiSpec.paths?.[path]) {
    delete swaggerOpenApiSpec.paths[path][method]

    if (Object.keys(swaggerOpenApiSpec.paths[path]).length === 0) {
      delete swaggerOpenApiSpec.paths[path]
    }
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
