export type XoVm = {
  id: string
  type: 'VM'

  name_label: string
  uuid: string
  power_state: 'Running' | 'Paused' | 'Halted' | 'Suspended'
}
