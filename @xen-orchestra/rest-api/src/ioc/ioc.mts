import { buildProviderModule } from 'inversify-binding-decorators'
import { Container, decorate, injectable } from 'inversify'
import { Controller } from 'tsoa'

import { RestApi } from '../rest-api/rest-api.mjs'
import { VmService } from '../vms/vm.service.mjs'
import type { XoApp } from '../rest-api/rest-api.type.mjs'
import { XoaService } from '../xoa/xoa.service.mjs'
import { HostService } from '../hosts/host.service.mjs'
import { PoolService } from '../pools/pool.service.mjs'
import { AlarmService } from '../alarms/alarm.service.mjs'
import { VdiService } from '../vdis/vdi.service.mjs'
import { UserService } from '../users/user.service.mjs'
import { BackupService } from '../backups/backup.service.mjs'

const iocContainer = new Container()

decorate(injectable(), Controller)
iocContainer.load(buildProviderModule())

export function setupContainer(xoApp: XoApp) {
  if (iocContainer.isBound(RestApi)) {
    iocContainer.unbind(RestApi)
  }

  iocContainer
    .bind(RestApi)
    .toDynamicValue(() => new RestApi(xoApp, iocContainer))
    .inSingletonScope()

  iocContainer
    .bind(XoaService)
    .toDynamicValue(ctx => {
      const restApi = ctx.container.get(RestApi)
      return new XoaService(restApi)
    })
    .inSingletonScope()

  iocContainer
    .bind(VmService)
    .toDynamicValue(ctx => {
      const restApi = ctx.container.get(RestApi)
      return new VmService(restApi)
    })
    .inSingletonScope()

  iocContainer
    .bind(PoolService)
    .toDynamicValue(ctx => {
      const restApi = ctx.container.get(RestApi)
      return new PoolService(restApi)
    })
    .inSingletonScope()

  iocContainer
    .bind(HostService)
    .toDynamicValue(ctx => {
      const restApi = ctx.container.get(RestApi)
      return new HostService(restApi)
    })
    .inSingletonScope()

  iocContainer
    .bind(AlarmService)
    .toDynamicValue(ctx => {
      const restApi = ctx.container.get(RestApi)
      return new AlarmService(restApi)
    })
    .inSingletonScope()

  iocContainer
  .bind(VdiService)
  .toDynamicValue(ctx => {
    const restApi = ctx.container.get(RestApi)
    return new VdiService(restApi)
  })
  .inSingletonScope()

  iocContainer
    .bind(UserService)
    .toDynamicValue(ctx => {
      const restApi = ctx.container.get(RestApi)
      return new UserService(restApi)
    })
    .inSingletonScope()

  iocContainer
    .bind(BackupService)
    .toDynamicValue(ctx => {
      const restApi = ctx.container.get(RestApi)
      return new BackupService(restApi)
    })
    .inSingletonScope()
}

export { iocContainer }
