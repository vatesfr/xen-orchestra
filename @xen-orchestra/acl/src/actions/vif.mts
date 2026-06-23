export default {
  connect: true,
  create: true,
  delete: true,
  disconnect: true,
  read: true,
  update: {
    allowedIpv4Addresses: true,
    allowedIpv6Addresses: true,
    lockingMode: true,
    rateLimit: true,
    txChecksumming: true,
  },
}
