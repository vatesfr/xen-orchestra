import RestApi from '@xen-orchestra/rest-api'
import { Router } from 'express'

export default class ClassRestApiPoc {
  constructor(app, { express }) {
    if (express === undefined) {
      return
    }

    const restApi = new RestApi(express)

    restApi.registerOpenApi()
    restApi.registerRoutes()
  }
}
