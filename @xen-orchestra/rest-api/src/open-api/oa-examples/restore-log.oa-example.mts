export const restoreLogIds = ['/rest/v0/restore/logs/1758180544428', '/rest/v0/restore/logs/1758180544430']

export const partialRestoreLogs = [
  {
    status: 'success',
    data: {
      backupId:
        '1af95910-01b4-4e87-9c2f-d895cafe0776//xo-vm-backups/5ee55483-6659-89b5-9542-afa1d0a0e0cb/20250916T120238Z.json',
      jobId: '33156c65-45e1-431a-bdbb-8c97ae80bd47',
      srId: 'a152347d-e2ca-bec9-2f05-58efe3c1ca61',
      time: 1758024158524,
    },
    href: '/rest/v0/restore-logs/1758180544428',
  },
  {
    status: 'success',
    data: {
      backupId:
        '1af95910-01b4-4e87-9c2f-d895cafe0776//xo-vm-backups/5ee55483-6659-89b5-9542-afa1d0a0e0cb/20250916T120238Z.json',
      jobId: '33156c65-45e1-431a-bdbb-8c97ae80bd47',
      srId: 'a152347d-e2ca-bec9-2f05-58efe3c1ca61',
      time: 175999999,
    },
    href: '/rest/v0/restore-logs/1758180544430',
  },
]

export const restoreLog = {
  data: {
    backupId:
      '1af95910-01b4-4e87-9c2f-d895cafe0776//xo-vm-backups/5ee55483-6659-89b5-9542-afa1d0a0e0cb/20250916T120238Z.json',
    jobId: '33156c65-45e1-431a-bdbb-8c97ae80bd47',
    srId: 'a152347d-e2ca-bec9-2f05-58efe3c1ca61',
    time: 1758024158524,
  },
  id: '1758180544428',
  message: 'restore',
  start: 1758180544428,
  status: 'success',
  tasks: [
    {
      id: '1758180544486',
      message: 'transfer',
      start: 1758180544486,
      status: 'success',
      end: 1758180852221,
      result: {
        size: 0,
        id: '360bf71a-56a5-eaef-6bcd-ca54c0066a10',
      },
    },
  ],
  end: 1758180852221,
  result: {
    size: 0,
    id: '360bf71a-56a5-eaef-6bcd-ca54c0066a10',
  },
}
