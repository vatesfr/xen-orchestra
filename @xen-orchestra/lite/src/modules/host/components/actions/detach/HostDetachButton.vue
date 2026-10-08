<template>
  <MenuItem
    v-tooltip="!canDetachHost && detachHostErrorMessage"
    :busy="isDetachingHost"
    accent="warning"
    :disabled="!canDetachHost"
    icon="action:detach"
    @click="detachHost()"
  >
    {{ t('action:detach') }}
  </MenuItem>
</template>

<script lang="ts" setup>
import type { XenApiHost } from '@/libs/xen-api/xen-api.types.ts'
import { useHostDetachJob } from '@/modules/host/jobs/host-detach.job.ts'
import { usePoolStore } from '@/stores/xen-api/pool.store.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { useActionModal } from '@core/composables/modals/use-action-modal.ts'
import { useRedirectAfterDelete } from '@core/composables/redirect-after-delete.composable.ts'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

const { host } = defineProps<{
  host: XenApiHost
}>()

const { t } = useI18n()

const route = useRoute<'/host/[uuid]'>()

const { pool } = usePoolStore().subscribe()

const { open: openActionModal } = useActionModal()

const {
  run,
  canRun: canDetachHost,
  isRunning: isDetachingHost,
  errorMessage: detachHostErrorMessage,
} = useHostDetachJob(() => host)

const { redirect: redirectAfterDetachHost } = useRedirectAfterDelete({
  isOnObjectPage: () => route.params.uuid === host.uuid,
  redirectTo: () => {
    if (pool.value === undefined) {
      return { name: '/' }
    }

    return { name: '/pool/[uuid]/hosts', params: { uuid: pool.value.uuid } }
  },
})

function detachHost() {
  return openActionModal({
    props: {
      accent: 'warning',
      action: 'detach',
      object: 'host',
      hostName: host.name_label,
      icon: 'status:warning-picto',
    },
    events: {
      onConfirm: async () => {
        try {
          await run()
        } catch (error) {
          console.error('Error when detaching host:', error)
          return
        }

        await redirectAfterDetachHost()
      },
    },
  })
}
</script>
