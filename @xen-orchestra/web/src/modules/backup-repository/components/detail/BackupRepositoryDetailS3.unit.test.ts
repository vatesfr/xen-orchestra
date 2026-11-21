import BackupRepositoryDetailS3 from '@/modules/backup-repository/components/detail/BackupRepositoryDetailS3.vue'
import { BR_S3_URL, itShowsBrUrl } from '@/test/br-url-card.ts'

itShowsBrUrl(BackupRepositoryDetailS3, 'detail', BR_S3_URL)
