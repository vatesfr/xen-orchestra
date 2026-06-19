import { useXoVdiMigrateJob } from '@/modules/vdi/jobs/xo-vdi-migrate.job.ts'
import type { FrontXoVdi } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import { useDrawer } from '@core/packages/drawer/use-drawer.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { type MaybeRefOrGetter, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

export function useVdiMigrateDrawer(rawVdi: MaybeRefOrGetter<FrontXoVdi>) {
  const vdi = toComputed(rawVdi)
  const targetSrId = ref<string | undefined>(undefined)

  const route = useRoute()
  const router = useRouter()

  const { run, isRunning, errorMessage, canRun } = useXoVdiMigrateJob(() => [vdi.value], targetSrId)

  const openDrawer = useDrawer(() => ({
    component: import('@/modules/vdi/components/drawer/VdiMigrateDrawer.vue'),
    props: {
      vdi: vdi.value,
    },
    onConfirm: async (srId: string) => {
      targetSrId.value = srId

      const migratedVdiId = vdi.value.id

      try {
        const [result] = await run()

        if (!result || result.status === 'rejected') {
          console.error(`Failed to migrate VDI ${migratedVdiId}`)
          return
        }

        if (route.query.id === migratedVdiId) {
          void router.replace({ query: { ...route.query, id: result.value.id } })
        }
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
