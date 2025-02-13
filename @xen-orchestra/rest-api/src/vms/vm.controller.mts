import { Controller, Route } from 'tsoa'
import { provide } from 'inversify-binding-decorators'

@Route('vms')
@provide(VmController)
export class VmController extends Controller {}
