import swaggerUi from 'swagger-ui-express'
import { Express, Request } from 'express'

import { RegisterRoutes } from './open-api/routes/routes.js'
import { XoApp } from './xoApp.type.js'
import f from './open-api/spec/swagger.json' assert { type: 'json' }

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
    this.#api.use(`${this.#prefix}/api-doc`, swaggerUi.serve, swaggerUi.setup(f))
  }

  registerRoutes() {
    RegisterRoutes(this.#api)
  }
}
