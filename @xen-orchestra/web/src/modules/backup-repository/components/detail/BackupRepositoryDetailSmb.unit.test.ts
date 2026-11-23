import BackupRepositoryDetailSmb from '@/modules/backup-repository/components/detail/BackupRepositoryDetailSmb.vue'
import { BR_SMB_DETAIL_URL, itShowsBrUrl } from '@/test/br-url-card.ts'

itShowsBrUrl(BackupRepositoryDetailSmb, 'detail', BR_SMB_DETAIL_URL)
