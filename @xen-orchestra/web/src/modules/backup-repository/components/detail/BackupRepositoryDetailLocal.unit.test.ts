import BackupRepositoryDetailLocal from '@/modules/backup-repository/components/detail/BackupRepositoryDetailLocal.vue'
import { BR_LOCAL_URL, itShowsBrUrl } from '@/test/br-url-card.ts'

itShowsBrUrl(BackupRepositoryDetailLocal, 'detail', BR_LOCAL_URL)
