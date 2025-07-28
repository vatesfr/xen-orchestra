export const backupRepositoryIds = [
  '/rest/v0/backup-repositories/7497c970-6780-4462-a452-fcb8a406ee64',
  '/rest/v0/backup-repositories/f681cef1-617e-4650-ac31-ffdaead076bf',
]

export const partialBackupRepositories = [
  {
    id: '7497c970-6780-4462-a452-fcb8a406ee64',
    name: 'test',
    enabled: true,
    href: '/rest/v0/backup-repositories/7497c970-6780-4462-a452-fcb8a406ee64',
  },
  {
    id: 'f681cef1-617e-4650-ac31-ffdaead076bf',
    name: 'S3_Remote',
    enabled: true,
    href: '/rest/v0/backup-repositories/f681cef1-617e-4650-ac31-ffdaead076bf',
  },
]

export const backupRepository = {
  enabled: true,
  name: 'S3_Remote',
  benchmarks: [
    {
      readRate: 7999965.197905305,
      timestamp: 1751469269245,
      writeRate: 7767798.704316632,
    },
  ],
  id: '677e50c5-8d8a-4c89-b1ac-e2f4593d0ebb',
  url: 's3://FOIS5DY532RGXD62TJ52:obfuscated-q3oi6d9X8uenGvdLnHk2@s3.us-east-2.amazonaws.com/with-lock/backup?useVhdDirectory=true',
}
