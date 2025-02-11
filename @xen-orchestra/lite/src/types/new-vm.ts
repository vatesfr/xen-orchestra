export interface Disk {
  name_label: string
  name_description: string
  size: number
  SR: string | undefined
}

export interface NetworkInterface {
  interface: string
  macAddress: string
}
