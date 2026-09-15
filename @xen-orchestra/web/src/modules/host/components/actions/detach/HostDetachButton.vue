<template>
  <MenuItem
    v-tooltip="!canDetachHost && detachHostErrorMessage"
    class="detach"
    :disabled="!canDetachHost"
    icon="action:detach"
    :busy="isDetachingHost"
    @click="detachHost()"
  >
    {{ t('action:detach') }}
  </MenuItem>
</template>

<script lang="ts" setup>
import { useXoHostDetachJob } from '@/modules/host/jobs/xo-host-detach.job.ts'
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
  canRun: canDetachHost,
  isRunning: isDetachingHost,
  errorMessage: detachHostErrorMessage,
} = useXoHostDetachJob(() => host)

const { open: openActionModal } = useActionModal()

const { redirect: redirectAfterDetachHost } = useRedirectAfterDelete({
  isOnObjectPage: () => route.params.id === host.id,
  redirectTo: () => {
    if (hasPoolById(host.$pool)) {
      return { name: '/pool/[id]/hosts', params: { id: host.$pool } }
    }

    return { name: '/(site)/dashboard' }
  },
})

async function detachHost() {
  const { event } = await openActionModal({
    props: {
      accent: 'warning',
      action: 'detach',
      object: 'host',
      hostName: host.name_label,
      icon: 'status:warning-picto',
    },
  })

  if (event !== 'onConfirm') {
    return
  }

  await run()

  await redirectAfterDetachHost()
}
</script>

<style lang="postcss" scoped>
.detach {
  color: var(--color-warning-txt-base);
}
</style>
