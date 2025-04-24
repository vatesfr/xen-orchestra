export const taskLocation = '/rest/v0/tasks/0m7kl0j9l'

export const taskIds = ['/rest/v0/tasks/0m791h1sr', '/rest/v0/tasks/0m791u4je']

export const partialTasks = [
  {
    status: 'failure',
    href: '/rest/v0/tasks/0m791h1sr',
  },
  {
    status: 'failure',
    href: '/rest/v0/tasks/0m791u4je',
  },
]

export const task = {
  id: '0m791h1sr',
  properties: {
    credentials: {},
    userData: {
      ip: '::1',
    },
    name: 'XO user authentication',
    type: 'xo:authentication:authenticateUser',
  },
  start: 1739795757148,
  status: 'failure',
  updatedAt: 1739795757159,
  end: 1739795757148,
  result: {
    code: 3,
    message: 'invalid credentials',
    name: 'XoError',
    stack:
      'XoError: invalid credentials\n    at invalidCredentials (/home/melissa/xen-orchestra/packages/xo-common/api-errors.js:26:11)\n    at file:///home/melissa/xen-orchestra/packages/xo-server/src/xo-mixins/authentication.mjs:201:13\n    at Task.runInside (/home/melissa/xen-orchestra/@vates/task/index.js:172:22)\n    at Task.run (/home/melissa/xen-orchestra/@vates/task/index.js:156:20)',
  },
}
