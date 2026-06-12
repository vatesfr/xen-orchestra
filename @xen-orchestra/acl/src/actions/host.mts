export default {
  'allow-vm': true,
  disable: true,
  'migrate-receive': true,
  enable: true,
  evacuate: true,
  export: {
    logs: true,
  },
  'join-pool': true,
  read: true,
  ipmi: {
    sensorsList: true,
  },
  remove: true,
  update: {
    tags: true,
  },
}
