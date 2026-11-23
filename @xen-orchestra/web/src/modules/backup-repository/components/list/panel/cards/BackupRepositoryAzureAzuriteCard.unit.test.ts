import BackupRepositoryAzureAzuriteCard from '@/modules/backup-repository/components/list/panel/cards/BackupRepositoryAzureAzuriteCard.vue'
import { BR_AZURE_URL, itShowsBrUrl } from '@/test/br-url-card.ts'

itShowsBrUrl(BackupRepositoryAzureAzuriteCard, 'panel', BR_AZURE_URL)
