import swaggerUi from 'swagger-ui-express'
import { createRequire } from 'module'
import { Express } from 'express'

import { RegisterRoutes } from './dist/routes.js'

export default class RestApi {
  #api

  constructor(express: Express) {
    this.#api = express
  }

  registerOpenApi() {
    const require = createRequire(import.meta.url)
    const swaggerOpenApiSpec = require('./swagger.json')
    this.#api.use('/rest/v1/api-doc', swaggerUi.serve, swaggerUi.setup(swaggerOpenApiSpec))
  }

  registerRoutes() {
    RegisterRoutes(this.#api)
  }
}
