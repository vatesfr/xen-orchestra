import { Controller, Route } from 'tsoa'
import { provide } from 'inversify-binding-decorators'

@Route('vms')
// the `provide` decorator is mandatory on class that injects/receives dependencies.
// It automatically bind the class to the IOC container that handles dependency injection
@provide(VmController)
export class VmController extends Controller {}
