<template>
  <MenuItem
    v-tooltip="!canForgetHost && forgetHostErrorMessage"
    :busy="isForgettingHost"
    accent="danger"
    :disabled="!canForgetHost"
    icon="action:forget"
    @click="forgetHost()"
  >
    {{ t('action:forget') }}
  </MenuItem>
</template>

<script lang="ts" setup>
import type { XenApiHost } from '@/libs/xen-api/xen-api.types.ts'
import { useHostForgetJob } from '@/modules/host/jobs/host-forget.job.ts'
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
  canRun: canForgetHost,
  isRunning: isForgettingHost,
  errorMessage: forgetHostErrorMessage,
} = useHostForgetJob(() => host)

const { redirect: redirectAfterForgetHost } = useRedirectAfterDelete({
  isOnObjectPage: () => route.params.uuid === host.uuid,
  redirectTo: () => {
    if (pool.value === undefined) {
      return { name: '/' }
    }

    return { name: '/pool/[uuid]/hosts', params: { uuid: pool.value.uuid } }
  },
})

function forgetHost() {
  return openActionModal({
    props: {
      accent: 'danger',
      action: 'forget',
      object: 'host',
      hostName: host.name_label,
      icon: 'status:danger-circle',
    },
    events: {
      onConfirm: async () => {
        try {
          await run()
        } catch (error) {
          console.error('Error when forgetting host:', error)
          return
        }

        await redirectAfterForgetHost()
      },
    },
  })
}
</script>
