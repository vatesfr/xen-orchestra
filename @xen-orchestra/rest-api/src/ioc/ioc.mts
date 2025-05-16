import { buildProviderModule } from 'inversify-binding-decorators'
import { Container, decorate, injectable } from 'inversify'
import { Controller } from 'tsoa'

import { RestApi } from '../rest-api/rest-api.mjs'
import type { XoApp } from '../rest-api/rest-api.type.mjs'
import { XoaService } from '../xoa/xoa.service.mjs'

const iocContainer = new Container()

decorate(injectable(), Controller)
iocContainer.load(buildProviderModule())

export function setupContainer(xoApp: XoApp) {
  if (iocContainer.isBound(RestApi)) {
    iocContainer.unbind(RestApi)
  }

  iocContainer
    .bind(RestApi)
    .toDynamicValue(() => new RestApi(xoApp))
    .inSingletonScope()

  iocContainer
    .bind(XoaService)
    .toDynamicValue(ctx => {
      const restApi = ctx.container.get(RestApi)
      return new XoaService(restApi)
    })
    .inSingletonScope()
}

export { iocContainer }
