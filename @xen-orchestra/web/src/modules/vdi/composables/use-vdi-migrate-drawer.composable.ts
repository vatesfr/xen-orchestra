import { useVdiMigrateForm } from '@/modules/vdi/form/migrate/use-vdi-migrate-form.ts'
import { useXoVdiMigrateJob } from '@/modules/vdi/jobs/xo-vdi-migrate.job.ts'
import type { FrontXoVdi } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import { KEEP_OVERLAY_OPEN } from '@core/packages/overlay/symbols.ts'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { reactiveComputed } from '@vueuse/core'
import { type MaybeRefOrGetter, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

export function useVdiMigrateDrawer(rawVdi: MaybeRefOrGetter<FrontXoVdi>) {
  const vdi = toComputed(rawVdi)
  const targetSrId = ref<string | undefined>(undefined)

  const route = useRoute()
  const router = useRouter()

  const { srSelectBindings, requiresForceMigrate, validateAndGetSrId, reset } = useVdiMigrateForm(vdi)

  const { run, isRunning, errorMessage, canRun } = useXoVdiMigrateJob(() => [vdi.value], targetSrId)

  const { open } = useOverlay({
    component: () => import('@/modules/vdi/components/drawer/VdiMigrateDrawer.vue'),
    events: {
      onConfirm: async () => {
        const srId = await validateAndGetSrId()

        if (srId === undefined) {
          return KEEP_OVERLAY_OPEN
        }

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
      onCancel: true,
    },
  })

  const props = reactiveComputed(() => ({
    srSelectBindings: srSelectBindings.value,
    requiresForceMigrate: requiresForceMigrate.value,
  }))

  function openDrawer() {
    reset()

    return open({ props })
  }

  return {
    openDrawer,
    canRun,
    isRunning,
    errorMessage,
  }
}
