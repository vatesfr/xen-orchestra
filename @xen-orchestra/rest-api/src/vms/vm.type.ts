import { XapiXoObject } from '../xoApp.type.js'

export interface XoVm extends XapiXoObject {
  type: 'VM'

  name_label: string
  uuid: string
  power_state: 'Running' | 'Paused' | 'Halted' | 'Suspended'
}
