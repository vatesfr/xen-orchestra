import * as swaggerUi from 'swagger-ui-express'
import type { Express } from 'express'

import swaggerOpenApiSpec from './open-api/spec/swagger.json' assert { type: 'json' }
import { RegisterRoutes } from './open-api/routes/routes.js'

export default function setupRestApi(express: Express) {
  RegisterRoutes(express)

  express.use('/rest/v0', swaggerUi.serve, swaggerUi.setup(swaggerOpenApiSpec))
}
