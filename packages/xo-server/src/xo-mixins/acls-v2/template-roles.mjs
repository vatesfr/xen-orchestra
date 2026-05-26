// === XOA
export const REAL_ONLY_ALL = {
  roleTemplateId: 1,
  name: 'Read only',
  description: 'Access the whole infra in read-only mode',
  privileges: [
    // XAPI objects privilges
    { action: 'read', resource: 'sr', effect: 'allow' },
    { action: 'read', resource: 'vdi', effect: 'allow' },
    { action: 'read', resource: 'vdi-snapshot', effect: 'allow' },
    { action: 'read', resource: 'vdi-unmanaged', effect: 'allow' },
    { action: 'read', resource: 'vbd', effect: 'allow' },
    { action: 'read', resource: 'vgpu', effect: 'allow' },
    { action: 'read', resource: 'vgpuType', effect: 'allow' },
    { action: 'read', resource: 'vm', effect: 'allow' },
    { action: 'read', resource: 'vm-template', effect: 'allow' },
    { action: 'read', resource: 'vm-snapshot', effect: 'allow' },
    { action: 'read', resource: 'vm-controller', effect: 'allow' },
    { action: 'read', resource: 'vif', effect: 'allow' },
    { action: 'read', resource: 'vtpm', effect: 'allow' },
    { action: 'read', resource: 'network', effect: 'allow' },
    { action: 'read', resource: 'pif', effect: 'allow' },
    { action: 'read', resource: 'host', effect: 'allow' },
    { action: 'read', resource: 'pbd', effect: 'allow' },
    { action: 'read', resource: 'pool', effect: 'allow' },
    { action: 'read', resource: 'message', effect: 'allow' },
    { action: 'read', resource: 'pci', effect: 'allow' },
    { action: 'read', resource: 'pgpu', effect: 'allow' },
    { action: 'read', resource: 'sm', effect: 'allow' },

    // XO objects privileges
    { action: 'read', resource: 'acl-privilege', effect: 'allow' },
    { action: 'read', resource: 'acl-role', effect: 'allow' },
    { action: 'read', resource: 'alarm', effect: 'allow' },
    { action: 'read', resource: 'backup-archive', effect: 'allow' },
    { action: 'read', resource: 'backup-job', effect: 'allow' },
    { action: 'read', resource: 'backup-log', effect: 'allow' },
    { action: 'read', resource: 'backup-repository', effect: 'allow' },
    { action: 'read', resource: 'gpuGroup', effect: 'allow' },
    { action: 'read', resource: 'group', effect: 'allow' },
    { action: 'read', resource: 'proxy', effect: 'allow' },
    { action: 'read', resource: 'restore-log', effect: 'allow' },
    { action: 'read', resource: 'schedule', effect: 'allow' },
    { action: 'read', resource: 'server', effect: 'allow' },
    { action: 'read', resource: 'task', effect: 'allow' },
    { action: 'read', resource: 'user', effect: 'allow' },
  ],
}

// === VMs
export const VMS_POWER_STATE_MANAGER = {
  roleTemplateId: 2,
  name: 'VMs power state manager',
  description: "Allow to manage VM's power state",
  privileges: [
    { action: 'start', resource: 'vm', effect: 'allow' },
    { action: 'shutdown', resource: 'vm', effect: 'allow' },
    { action: 'reboot', resource: 'vm', effect: 'allow' },
    { action: 'pause', resource: 'vm', effect: 'allow' },
    { action: 'suspend', resource: 'vm', effect: 'allow' },
    { action: 'resume', resource: 'vm', effect: 'allow' },
    { action: 'unpause', resource: 'vm', effect: 'allow' },
  ],
}

export const VMS_CREATOR = {
  roleTemplateId: 3,
  name: 'VMs creator',
  description: 'Allow to create VMs',
  privileges: [
    { action: 'create:vm', resource: 'pool', effect: 'allow' },
    { action: 'instantiate', resource: 'vm-template', effect: 'allow' },
    { action: 'create', resource: 'vdi', effect: 'allow' },
    { action: 'create', resource: 'vif', effect: 'allow' },
    { action: 'boot', resource: 'vdi', effect: 'allow' },
    { action: 'allow-vm', resource: 'host', effect: 'allow' },
  ],
}

export const VMS_READ_ONLY = {
  roleTemplateId: 4,
  name: 'VMs read only',
  description: 'Allow to only see VMs',
  privileges: [{ action: 'read', resource: 'vm', effect: 'allow' }],
}

// === Administrator
export const ADMINISTRATOR = {
  roleTemplateId: 5,
  name: 'Administrator',
  description: 'Full access to the entire infra, all objects, and user management',
  privileges: [
    // XAPI objects privileges
    { action: '*', resource: 'sr', effect: 'allow' },
    { action: '*', resource: 'vdi', effect: 'allow' },
    { action: '*', resource: 'vdi-snapshot', effect: 'allow' },
    { action: '*', resource: 'vdi-unmanaged', effect: 'allow' },
    { action: '*', resource: 'vbd', effect: 'allow' },
    { action: '*', resource: 'vgpu', effect: 'allow' },
    { action: '*', resource: 'vgpuType', effect: 'allow' },
    { action: '*', resource: 'vm', effect: 'allow' },
    { action: '*', resource: 'vm-template', effect: 'allow' },
    { action: '*', resource: 'vm-snapshot', effect: 'allow' },
    { action: '*', resource: 'vm-controller', effect: 'allow' },
    { action: '*', resource: 'vif', effect: 'allow' },
    { action: '*', resource: 'vtpm', effect: 'allow' },
    { action: '*', resource: 'network', effect: 'allow' },
    { action: '*', resource: 'pif', effect: 'allow' },
    { action: '*', resource: 'host', effect: 'allow' },
    { action: '*', resource: 'pbd', effect: 'allow' },
    { action: '*', resource: 'pool', effect: 'allow' },
    { action: '*', resource: 'message', effect: 'allow' },
    { action: '*', resource: 'pci', effect: 'allow' },
    { action: '*', resource: 'pgpu', effect: 'allow' },
    { action: '*', resource: 'sm', effect: 'allow' },

    // XO objects privileges
    { action: '*', resource: 'acl-privilege', effect: 'allow' },
    { action: '*', resource: 'acl-role', effect: 'allow' },
    { action: '*', resource: 'alarm', effect: 'allow' },
    { action: '*', resource: 'backup-archive', effect: 'allow' },
    { action: '*', resource: 'backup-job', effect: 'allow' },
    { action: '*', resource: 'backup-log', effect: 'allow' },
    { action: '*', resource: 'backup-repository', effect: 'allow' },
    { action: '*', resource: 'gpuGroup', effect: 'allow' },
    { action: '*', resource: 'group', effect: 'allow' },
    { action: '*', resource: 'proxy', effect: 'allow' },
    { action: '*', resource: 'restore-log', effect: 'allow' },
    { action: '*', resource: 'schedule', effect: 'allow' },
    { action: '*', resource: 'server', effect: 'allow' },
    { action: '*', resource: 'task', effect: 'allow' },
    { action: '*', resource: 'user', effect: 'allow' },
  ],
}
