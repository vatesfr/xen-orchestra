export const getIpAddressesByDevice = (addresses: Record<string, string>) =>
  Object.entries(addresses).reduce<Record<string, string[]>>((acc, [key, address]) => {
    const [device] = key.split('/')
    acc[device] = acc[device] ?? []
    acc[device].push(address)
    return acc
  }, {})

export const getUniqueIpAddressesForDevice = (
  addresses: Record<string, string> | undefined,
  device: string
): string[] => {
  if (!addresses) {
    return []
  }

  return [...new Set(getIpAddressesByDevice(addresses)[device])]
}
