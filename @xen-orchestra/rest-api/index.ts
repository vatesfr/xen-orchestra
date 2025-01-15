import swaggerUi from 'swagger-ui-express'
import { createRequire } from 'module'
import { Express, Request } from 'express'

import { RegisterRoutes } from './dist/routes.js'
import { XoApp } from './xoApp.type.js'

export interface ExtendedRequest extends Request {
  xoApp: XoApp
}

export default class RestApi {
  #api: Express
  #prefix = '/rest/v1'

  constructor(xoApp: XoApp, express: Express) {
    express.use(this.#prefix, (req, _res, next) => {
      ;(req as ExtendedRequest).xoApp = xoApp
      next()
    })

    this.#api = express
  }

  registerOpenApi() {
    const require = createRequire(import.meta.url)
    const swaggerOpenApiSpec = require('./swagger.json')
    this.#api.use(`${this.#prefix}/api-doc`, swaggerUi.serve, swaggerUi.setup(swaggerOpenApiSpec))
  }

  registerRoutes() {
    RegisterRoutes(this.#api)
  }
}
