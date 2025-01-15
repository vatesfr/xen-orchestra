import swaggerUi from 'swagger-ui-express'
import { Express, Request } from 'express'

import swaggerOpenApiSpec from './open-api/spec/swagger.json' assert { type: 'json' }
import { RegisterRoutes } from './open-api/routes/routes.js'
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
    this.#api.use(`${this.#prefix}/api-doc`, swaggerUi.serve, swaggerUi.setup(swaggerOpenApiSpec))
  }

  registerRoutes() {
    RegisterRoutes(this.#api)
  }
}
