export const backupLogIds = ['/rest/v0/backup-logs/1753776067468', '/rest/v0/backup-logs/1753776157641']

export const partialBackupLogs = [
  {
    jobName: 'test-full',
    status: 'success',
    data: {
      mode: 'full',
      reportWhen: 'failure',
    },
    href: '/rest/v0/backup-logs/1753776067468',
  },
  {
    jobName: 'test-full',
    status: 'success',
    data: {
      mode: 'full',
      reportWhen: 'failure',
    },
    href: '/rest/v0/backup-logs/1753776157641',
  },
]

export const backupLog = {
  data: {
    mode: 'full',
    reportWhen: 'failure',
  },
  id: '1753776067468',
  jobId: '59af07fc-e82c-43b5-8137-026832f30166',
  jobName: 'test-modal',
  message: 'backup',
  scheduleId: '1c7cfc78-a006-4942-aab6-b4c825ce9a4e',
  start: 1753776067468,
  status: 'success',
  infos: [
    {
      data: {
        vms: ['db822c15-6f7d-8920-10bd-68d40fb12ac6'],
      },
      message: 'vms',
    },
  ],
  tasks: [
    {
      data: {
        type: 'VM',
        id: 'db822c15-6f7d-8920-10bd-68d40fb12ac6',
        name_label: 'MRA alpine',
      },
      id: '1753776071015',
      message: 'backup VM',
      start: 1753776071015,
      status: 'success',
      tasks: [
        {
          data: {
            id: '1af95910-01b4-4e87-9c2f-d895cafe0776',
            type: 'remote',
            isFull: true,
          },
          id: '1753776072502',
          message: 'export',
          start: 1753776072502,
          status: 'success',
          tasks: [
            {
              id: '1753776072532',
              message: 'transfer',
              start: 1753776072532,
              status: 'success',
              end: 1753776110123,
              result: {
                size: 298260992,
              },
            },
          ],
          end: 1753776110134,
        },
        {
          id: '1753776110440',
          message: 'clean-vm',
          start: 1753776110440,
          status: 'success',
          end: 1753776110453,
          result: {
            merge: false,
          },
        },
      ],
      end: 1753776110457,
    },
  ],
  end: 1753776110463,
}
