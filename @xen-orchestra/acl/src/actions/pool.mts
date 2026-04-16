export default {
  create: {
    network: true,
    vm: true,
  },
  'emergency-shutdown': true,
  read: true,
  'rolling-reboot': true,
  'rolling-update': true,
  update: {
    tags: true,
  },
}
