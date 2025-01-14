import { Controller, Get, Path, Route } from 'tsoa'
import { Vm } from './type.js'

// SERVUCES
function newVm(id: number): Vm {
  return { name_label: 'foo', id }
}
// SERVUCES

@Route('vms')
export class VmsController extends Controller {
  @Get()
  public async getVms(): Promise<Vm[]> {
    return [newVm(1), newVm(2)]
  }

  @Get('{id}')
  public async getVm(@Path() id: number): Promise<Vm> {
    return newVm(id)
  }
}
