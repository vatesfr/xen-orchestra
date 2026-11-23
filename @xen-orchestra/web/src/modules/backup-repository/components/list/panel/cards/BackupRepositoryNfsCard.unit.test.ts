import BackupRepositoryNfsCard from '@/modules/backup-repository/components/list/panel/cards/BackupRepositoryNfsCard.vue'
import { BR_NFS_URL, itShowsBrUrl } from '@/test/br-url-card.ts'

itShowsBrUrl(BackupRepositoryNfsCard, 'panel', BR_NFS_URL)
