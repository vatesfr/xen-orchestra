export const aclRoleIds = [
  '/rest/v0/acl-roles/9cac02e2-f612-4b71-851e-d28b9c0cda88',
  '/rest/v0/acl-roles/784bd959-08de-4b26-b575-92ded5aef872',
]

export const partialAclRoles = [
  {
    id: '9cac02e2-f612-4b71-851e-d28b9c0cda88',
    name: 'VMs read only',
    isTemplate: true,
    href: '/rest/v0/acl-roles/9cac02e2-f612-4b71-851e-d28b9c0cda88',
  },
  {
    id: '784bd959-08de-4b26-b575-92ded5aef872',
    name: 'mra-test-read-only',
    href: '/rest/v0/acl-roles/784bd959-08de-4b26-b575-92ded5aef872',
  },
]

export const aclRole = {
  name: 'mra-test-read-only',
  description: 'Access the whole infra in read-only mode',
  id: '784bd959-08de-4b26-b575-92ded5aef872',
}

export const aclUserRole = {
  id: '784bd959-08de-4b26-b575-92ded5aef872',
  roleId: 'ba407dca-c290-4731-99f0-636977a8d01d',
  userId: 'd2414d6a-3ffd-4fc0-879b-344f29202d60',
}

export const aclGroupRole = {
  id: '784bd959-08de-4b26-b575-92ded5aef872',
  roleId: 'ba407dca-c290-4731-99f0-636977a8d01d',
  groupId: 'd2414d6a-3ffd-4fc0-879b-344f29202d60',
}
