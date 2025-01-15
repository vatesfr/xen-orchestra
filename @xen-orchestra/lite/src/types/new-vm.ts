export interface Disk {
  name_label: string
  name_description: string
  size: number
  SR: string
}

export interface NetworkInterface {
  interface: string
  macAddress: string
}
