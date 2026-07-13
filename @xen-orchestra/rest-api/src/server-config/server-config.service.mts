import { inject } from 'inversify'
import { provide } from 'inversify-binding-decorators'
import { RestApi } from '../rest-api/rest-api.mjs'
import type { ConfigContent, ConfigSource } from './server-config.type.mjs'

@provide(ServerConfigService)
export class ServerConfigService {
  #restApi: RestApi

  constructor(@inject(RestApi) restApi: RestApi) {
    this.#restApi = restApi
  }

  getMerged(): ConfigContent {
    return this.#restApi.xoApp.config.getFiltered()
  }

  listSources(): ConfigSource[] {
    return this.#restApi.xoApp.config
      .getSources()
      .flatMap(layer => layer.files.map(path => ({ layer: layer.name, path })))
  }

  getSource(path: string): Promise<ConfigContent> {
    return this.#restApi.xoApp.config.parseSourceFiltered(path)
    // parseSourceFiltered throws a 403 if path is not in the known sources list
  }
}
