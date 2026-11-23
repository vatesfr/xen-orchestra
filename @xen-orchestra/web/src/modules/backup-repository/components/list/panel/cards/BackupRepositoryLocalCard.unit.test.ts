import BackupRepositoryLocalCard from '@/modules/backup-repository/components/list/panel/cards/BackupRepositoryLocalCard.vue'
import { BR_LOCAL_URL, itShowsBrUrl } from '@/test/br-url-card.ts'

itShowsBrUrl(BackupRepositoryLocalCard, 'panel', BR_LOCAL_URL)
