export const getIpAddressesByDevice = (addresses: Record<string, string>) =>
  Object.entries(addresses).reduce<Record<string, string[]>>((acc, [key, address]) => {
    const [device] = key.split('/')
    acc[device] = acc[device] ?? []
    acc[device].push(address)
    return acc
  }, {})
