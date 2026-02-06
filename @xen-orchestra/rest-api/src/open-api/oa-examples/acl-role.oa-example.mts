export const aclRoleIds = [
  '/rest/v0/acl-roles/426622cc-b2db-4545-a2f0-6ec47b3a6450',
  '/rest/v0/acl-roles/9cac02e2-f612-4b71-851e-d28b9c0cda88',
]

export const partialAclRoles = [
  {
    id: '426622cc-b2db-4545-a2f0-6ec47b3a6450',
    name: 'VMs creator',
    isTemplate: true,
    href: '/rest/v0/acl-roles/426622cc-b2db-4545-a2f0-6ec47b3a6450',
  },
  {
    id: '9cac02e2-f612-4b71-851e-d28b9c0cda88',
    name: 'VMs read only',
    isTemplate: true,
    href: '/rest/v0/acl-roles/9cac02e2-f612-4b71-851e-d28b9c0cda88',
  },
]

export const aclRole = {
  name: 'VMs creator',
  description: 'Allow to create VMs',
  roleTemplateId: 3,
  isTemplate: true,
  id: '426622cc-b2db-4545-a2f0-6ec47b3a6450',
}
