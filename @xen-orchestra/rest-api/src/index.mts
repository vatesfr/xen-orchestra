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

export default function setupRestApi(express: Express, xoApp: XoApp) {
  setupContainer(xoApp)
  RegisterRoutes(express)

  // do not register the doc at the root level, or it may lead to unwated behaviour
  // uncomment when all endpoints are migrated to this API
  // express.get('/rest/v0', (_req, res) => res.redirect('/rest/v0/docs'))
  express.use('/rest/v0/docs', swaggerUi.serve, swaggerUi.setup(swaggerOpenApiSpec))

  express.use('/rest/v0', tsoaToXoErrorHandler)
  express.use('/rest/v0', genericErrorHandler)
}
