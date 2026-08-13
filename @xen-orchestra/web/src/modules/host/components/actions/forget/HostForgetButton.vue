<template>
  <MenuItem
    v-tooltip="!canForgetHost && forgetHostErrorMessage"
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
import MenuItem from '@core/components/menu/MenuItem.vue'
import { useActionModal } from '@core/composables/modals/use-action-modal.ts'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'

const { host } = defineProps<{
  host: FrontXoHost
}>()

const { t } = useI18n()

const {
  run,
  canRun: canForgetHost,
  isRunning: isForgettingHost,
  errorMessage: forgetHostErrorMessage,
} = useXoHostForgetJob(() => host)

const { open: openActionModal } = useActionModal()

const route = useRoute<'/host/[id]'>()

const router = useRouter()

const { hasPoolById } = useXoPoolCollection()

async function redirectIfOnHostPage() {
  if (route.params.id !== host.id) {
    return
  }

  await router.push(
    hasPoolById(host.$pool) ? { name: '/pool/[id]/hosts', params: { id: host.$pool } } : { name: '/(site)/dashboard' }
  )
}

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

        await redirectIfOnHostPage()
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
