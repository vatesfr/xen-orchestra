import BackupRepositoryDetailNfs from '@/modules/backup-repository/components/detail/BackupRepositoryDetailNfs.vue'
import { BR_NFS_URL, itShowsBrUrl } from '@/test/br-url-card.ts'

itShowsBrUrl(BackupRepositoryDetailNfs, 'detail', BR_NFS_URL)
