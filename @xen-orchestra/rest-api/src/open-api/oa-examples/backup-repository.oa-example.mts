export const backupRepositoryIds = [
  '/rest/v0/backup-repositories/7497c970-6780-4462-a452-fcb8a406ee64',
  '/rest/v0/backup-repositories/f681cef1-617e-4650-ac31-ffdaead076bf',
  '/rest/v0/backup-repositories/a72c53c1-eae1-43f6-be6d-7b0342a1f218',
  '/rest/v0/backup-repositories/98f5cd17-7594-40b8-906d-51cb57dc7b23',
]

export const partialBackupRepositories = [
  {
    id: '7497c970-6780-4462-a452-fcb8a406ee64',
    name: 'test',
    url: 'nfs://localhost:80:/path/to/backup?useVhdDirectory=true&encryptionKey=%22obfuscated-q3oi6d9X8uenGvdLnHk2%22',
    href: '/rest/v0/backup-repositories/7497c970-6780-4462-a452-fcb8a406ee64',
  },
  {
    id: 'f681cef1-617e-4650-ac31-ffdaead076bf',
    name: 'S3_Remote',
    url: 's3://AKIA5DY554RGXD35TJ52:obfuscated-q3oi6d9X8uenGvdLnHk2@s3.us-east-2.amazonaws.com/test-vhd-directory/sub/folder/with/other?useVhdDirectory=true',
    href: '/rest/v0/backup-repositories/f681cef1-617e-4650-ac31-ffdaead076bf',
  },
  {
    id: 'a72c53c1-eae1-43f6-be6d-7b0342a1f218',
    name: 'Azurite',
    url: 'azurite+http://devstoreaccount1:obfuscated-q3oi6d9X8uenGvdLnHk2@127.0.0.1:10000/xodevtest/this/is/a/folder',
    href: '/rest/v0/backup-repositories/a72c53c1-eae1-43f6-be6d-7b0342a1f218',
  },
  {
    id: '98f5cd17-7594-40b8-906d-51cb57dc7b23',
    name: 'SMB_Remote',
    url: 'smb://root:obfuscated-q3oi6d9X8uenGvdLnHk2@WORKGROUP\\\\test\\test\u0000test',
    href: '/rest/v0/backup-repositories/98f5cd17-7594-40b8-906d-51cb57dc7b23',
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
  url: 's3://AKIA5DY554RGXD35TJ52:obfuscated-q3oi6d9X8uenGvdLnHk2@s3.us-east-2.amazonaws.com/with-lock/backup?useVhdDirectory=true',
}
