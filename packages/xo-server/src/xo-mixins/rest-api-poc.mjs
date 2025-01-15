import RestApi from '@xen-orchestra/rest-api'

export default class ClassRestApiPoc {
  constructor(app, { express }) {
    if (express === undefined) {
      return
    }

    const restApi = new RestApi(app, express)

    restApi.registerOpenApi()
    restApi.registerRoutes()
  }
}
