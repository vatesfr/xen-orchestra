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
  update: {
    tags: true,
  },
  probe: {
    nfs: true,
    zfs: true,
    hba: true,
    iscsiiqn: true,
    iscsilun: true,
    'iscsi-exists': true,
    'hba-exists': true,
    'nfs-exists': true,
  },
}
