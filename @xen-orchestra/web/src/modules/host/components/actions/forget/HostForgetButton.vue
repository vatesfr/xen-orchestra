<template>
  <MenuItem
    v-tooltip="!canForgetHost && forgetHostErrorMessage"
    accent="brand"
    class="forget"
    :disabled="!canForgetHost"
    icon="action:forget"
    :busy="isForgettingHost"
    @click="forgetHost()"
  >
    {{ t('action:forget') }}
  </MenuItem>
</template>

<script lang="ts" setup>
import { useXoHostForgetJob } from '@/modules/host/jobs/xo-host-forget.job.ts'
import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { useXoPoolCollection } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { useRedirectAfterDelete } from '@/shared/composables/redirect-after-delete.composable.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { useActionModal } from '@core/composables/modals/use-action-modal.ts'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

const { host } = defineProps<{
  host: FrontXoHost
}>()

const { t } = useI18n()

const { hasPoolById } = useXoPoolCollection()

const route = useRoute<'/host/[id]'>()

const {
  run,
  canRun: canForgetHost,
  isRunning: isForgettingHost,
  errorMessage: forgetHostErrorMessage,
} = useXoHostForgetJob(() => host)

const { open: openActionModal } = useActionModal()

const { redirect: redirectAfterForgetHost } = useRedirectAfterDelete({
  isOnObjectPage: () => route.params.id === host.id,
  redirectTo: () => {
    if (hasPoolById(host.$pool)) {
      return { name: '/pool/[id]/hosts', params: { id: host.$pool } }
    }

    return { name: '/(site)/dashboard' }
  },
})

function forgetHost() {
  openActionModal({
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
    props: {
      accent: 'danger',
      action: 'forget',
      object: 'host',
      hostName: host.name_label,
      icon: 'status:danger-circle',
    },
  })
}
</script>

<style lang="postcss" scoped>
.forget {
  color: var(--color-danger-item-base);
}
</style>
