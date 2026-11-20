import BackupRepositorySmbCard from '@/modules/backup-repository/components/list/panel/cards/BackupRepositorySmbCard.vue'
import { BR_SMB_URL, itShowsBrUrl } from '@/test/br-url-card.ts'

itShowsBrUrl(BackupRepositorySmbCard, 'panel', BR_SMB_URL)
