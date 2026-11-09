export default {
  'change-mac': true,
  connect: true,
  create: true,
  delete: true,
  disconnect: true,
  read: true,
  update: {
    allowedIpv4Addresses: true,
    allowedIpv6Addresses: true,
    lockingMode: true,
    networkId: true,
    rateLimit: true,
    txChecksumming: true,
    other_config: true,
  },
}
