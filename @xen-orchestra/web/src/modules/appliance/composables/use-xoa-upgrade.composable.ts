import { useXoaSnapshotJob } from '@/modules/appliance/jobs/xoa-snapshot.job.ts'
import { useXoaUpgradeJob } from '@/modules/appliance/jobs/xoa-upgrade.job.ts'
import type { ApplianceUpgrade } from '@/modules/appliance/types/appliance-upgrade.type.ts'
import { useXoTaskCollection } from '@/modules/task/remote-resources/use-xo-task-collection.ts'
import { computed } from 'vue'

// nom donné par la PR xoa #298, préfixé par createAction
const UPGRADE_TASK_NAME = 'REST API: upgrade XO appliance'

export function useXoaUpgrade() {
  const { sortedTasks } = useXoTaskCollection()

  // le store des jobs est global : on voit aussi les jobs lancés depuis un autre composant
  const { isRunning: isTakingSnapshot } = useXoaSnapshotJob()

  const { isRunning: isUpgrading } = useXoaUpgradeJob()

  const upgradeTask = computed(() => {
    return sortedTasks.value.find(task => task.status === 'pending' && task.properties.name === UPGRADE_TASK_NAME)
  })

  // l'installation commence au clic : snapshot éventuel, puis upgrade dont la tâche arrive après la requête
  const upgrade = computed<ApplianceUpgrade | undefined>(() => {
    if (upgradeTask.value !== undefined) {
      return { phase: 'upgrade', start: upgradeTask.value.start }
    }

    if (isTakingSnapshot.value) {
      return { phase: 'snapshot' }
    }

    if (isUpgrading.value) {
      return { phase: 'upgrade' }
    }

    return undefined
  })

  return {
    upgrade,
  }
}
