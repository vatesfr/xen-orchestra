import { interfaces } from 'inversify'
import { fluentProvide, provide } from 'inversify-binding-decorators'

const provideSingleton = function <T>(identifier: interfaces.ServiceIdentifier<T>) {
  return fluentProvide(identifier).inSingletonScope().done()
}

export { provideSingleton, provide }
