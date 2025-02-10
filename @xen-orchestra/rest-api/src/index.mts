import * as swaggerUi from 'swagger-ui-express'
import { createRequire } from 'module'
import type { Express } from 'express'

import notFoundErrorMiddleware from './middlewares/not-found-error.middleware.mjs'
import { RegisterRoutes } from './open-api/routes/routes.js'

// Avoid using "import from" to import a json file as this requires assert/with and will break compatibility with recent node versions
// https://github.com/nodejs/node/issues/51622
const require = createRequire(import.meta.url)
const swaggerOpenApiSpec = require('../open-api/spec/swagger.json')

export default function setupRestApi(express: Express) {
  RegisterRoutes(express)

  // do not register the doc at the root level, or it may lead to unwated behaviour
  express.get('/rest/v0', (_req, res) => res.redirect('/rest/v0/docs'))
  express.use('/rest/v0/docs', swaggerUi.serve, swaggerUi.setup(swaggerOpenApiSpec))

  express.use(notFoundErrorMiddleware)
}
