import { XapiObject, XapiXoObject } from '../xoApp.type.js'

export interface XapiVm extends XapiObject {
  uuid: string
  name_label: string
  power_state: 'Running' | 'Paused' | 'Halted' | 'Suspended'
}

export interface XoVm extends XapiXoObject {
  type: 'VM'

  name_label: XapiVm['name_label']
  uuid: XapiVm['uuid']
  power_state: XapiVm['power_state']
}
