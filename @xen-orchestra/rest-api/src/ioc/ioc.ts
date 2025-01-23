import { Container, decorate, injectable } from 'inversify'
import { buildProviderModule } from 'inversify-binding-decorators'
import { Controller } from 'tsoa'

const iocContainer = new Container()

decorate(injectable(), Controller)

iocContainer.load(buildProviderModule())

export { iocContainer }
