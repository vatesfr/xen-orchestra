import { useXoVdiMigrateJob } from '@/modules/vdi/jobs/xo-vdi-migrate.job.ts'
import type { FrontXoVdi } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import { useDrawer } from '@core/packages/drawer/use-drawer.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { computed, ref, type MaybeRefOrGetter } from 'vue'

export function useVdiMigrateDrawer(rawVdi: MaybeRefOrGetter<FrontXoVdi>) {
  const vdi = toComputed(rawVdi)
  const targetSrId = ref<string | undefined>(undefined)

  const { run, isRunning, errorMessage } = useXoVdiMigrateJob(() => [vdi.value], targetSrId)

  const canRun = computed(() => !!vdi.value && !isRunning.value)

  const openDrawer = useDrawer(() => ({
    component: import('@/modules/vdi/components/drawer/VdiMigrateDrawer.vue'),
    props: {
      vdi: vdi.value,
    },
    onConfirm: async (srId: string) => {
      targetSrId.value = srId

      try {
        await run()
      } catch (error) {
        console.error('Error when migrating VDI:', error)
      }
    },
  }))

  return {
    openDrawer,
    canRun,
    isRunning,
    errorMessage,
  }
}
