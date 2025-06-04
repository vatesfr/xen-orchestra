import * as swaggerUi from 'swagger-ui-express'
import { createRequire } from 'module'
import type { Express } from 'express'

import genericErrorHandler from './middlewares/generic-error-handler.middleware.mjs'
import tsoaToXoErrorHandler from './middlewares/tsoa-to-xo-error.middleware.mjs'
import { RegisterRoutes } from './open-api/routes/routes.js'
import { setupContainer } from './ioc/ioc.mjs'
import type { XoApp } from './rest-api/rest-api.type.mjs'

// Avoid using "import from" to import a json file as this requires assert/with and will break compatibility with recent node versions
// https://github.com/nodejs/node/issues/51622
const require = createRequire(import.meta.url)
const swaggerOpenApiSpec = require('../open-api/spec/swagger.json')

export const BASE_URL = '/rest/v0'

const SWAGGER_UI_OPTIONS = {
  swaggerOptions: {
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

export default function setupRestApi(express: Express, xoApp: XoApp) {
  setupContainer(xoApp)
  RegisterRoutes(express)

  // do not register the doc at the root level, or it may lead to unwanted behaviour
  // uncomment when all endpoints are migrated to this API
  // express.get('/rest/v0', (_req, res) => res.redirect('/rest/v0/docs'))
  express.use(`${BASE_URL}/docs`, swaggerUi.serve, swaggerUi.setup(swaggerOpenApiSpec, SWAGGER_UI_OPTIONS))

  express.use(BASE_URL, tsoaToXoErrorHandler)
  express.use(BASE_URL, genericErrorHandler)
}
