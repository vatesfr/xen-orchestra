import BackupRepositoryDetailAzureAzurite from '@/modules/backup-repository/components/detail/BackupRepositoryDetailAzureAzurite.vue'
import { BR_AZURE_URL, itShowsBrUrl } from '@/test/br-url-card.ts'

itShowsBrUrl(BackupRepositoryDetailAzureAzurite, 'detail', BR_AZURE_URL)
