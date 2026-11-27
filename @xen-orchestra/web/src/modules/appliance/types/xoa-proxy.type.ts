export type XoaProxy = {
  host: string
  port: number
  username?: string
}

export type XoaProxyPayload = XoaProxy & {
  password?: string
}
