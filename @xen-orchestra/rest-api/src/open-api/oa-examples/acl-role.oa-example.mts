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
  userIds: ['6b017bcf-99e4-40a2-bf64-bf723d6c1994'],
  groupIds: [],
  privilegeIds: [
    'fe6c806d-c993-4144-9018-d3d0c057fbc1',
    'a4e0c8a4-0fe7-47e4-a630-06707b10e672',
    'bfce6c26-966c-4a59-a9ca-e11e66139850',
    'e759f285-de67-44bf-b030-158211b25504',
    'b086d21e-7fbd-46e7-9ae6-60ad77c905eb',
    '88d49d33-319a-4af2-866b-1835cda254e6',
    'bd59c0bc-2db5-4ccf-a50c-8be94e43324a',
    '9e3376ef-cc54-4480-b7b1-cc8b802ed8c0',
    '59026b9b-0f07-4735-92b1-fd98fb95306c',
    'e395bfc9-747c-43a5-a46d-6abd01a0e96e',
    '69fd4212-e0d5-4bac-b453-08377aba48f5',
  ],
}
