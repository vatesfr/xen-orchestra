export default {
  'allow-vm': true,
  detach: true,
  disable: true,
  enable: true,
  evacuate: true,
  export: {
    logs: true,
  },
  forget: true,
  'join-pool': true,
  'migrate-receive': true,
  read: true,
  reboot: {
    clean: true,
    smart: true,
  },
  'restart-toolstack': true,
  shutdown: {
    clean: true,
    emergency: true,
  },
  start: true,
  ipmi: {
    sensorsList: true,
  },
  update: {
    tags: true,
  },
}
