<template>
  <UiAlert v-if="changes.length > 0" accent="danger">
    {{
      vm
        ? t('firewall:vm:quarantine-lifted', { date: formatDateTime(changes[0].seenAt) })
        : t('firewall:outside:quarantine-lifted', { n: changes.length }, changes.length)
    }}
    <template #description>
      <p>{{ t('firewall:outside:quarantine-lifted:info', changes.length) }}</p>
      <span v-for="change of changes" :key="change.id" class="lifted">
        <UiLink v-if="!vm" :to="{ name: '/vm/[id]/firewall', params: { id: change.object.id } }" size="small">
          {{
            t('firewall:outside:quarantine-lifted:vm', {
              vm: change.object.name ?? change.object.id,
              date: formatDateTime(change.seenAt),
            })
          }}
        </UiLink>
        <!-- vdf#141: as lifting the quarantine, which it accepts -->
        <UiButton
          v-tooltip="lockReason('quarantine:remove') ?? false"
          variant="secondary"
          accent="danger"
          size="small"
          :busy="isRunning && entryId === change.id"
          :disabled="!can('quarantine:remove')"
          @click="acknowledge(change)"
        >
          {{ t('firewall:outside:quarantine-lifted:acknowledge') }}
        </UiButton>
      </span>
      <p v-if="error" class="error">{{ t('firewall:outside:quarantine-lifted:acknowledge-failed', { error }) }}</p>
      <slot />
    </template>
  </UiAlert>
</template>

<script lang="ts" setup>
import { useVdfFirewallRights } from '@/modules/vdf/composables/vdf-rights.composable.ts'
import { useVdfAcknowledgeLiftJob } from '@/modules/vdf/jobs/vdf-acknowledge-lift.job.ts'
import type { VdfOutsideTagChange } from '@/modules/vdf/types.ts'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { formatDateTime } from '@core/utils/time.util.ts'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

// vdf#141: VMs whose quarantine was lifted outside this XO, until the VM is
// quarantined again or someone acknowledges it; `vm`: on that VM's page
const { poolId, changes, vm } = defineProps<{
  poolId: string
  changes: VdfOutsideTagChange[]
  vm?: boolean
}>()

const emit = defineEmits<{
  acknowledged: [change: VdfOutsideTagChange]
}>()

const { t } = useI18n()

// acknowledging takes the quarantine:remove right on the pool
const { can, lockReason } = useVdfFirewallRights(() => poolId)

const entryId = ref<number>()

const error = ref<string>()

const { run, isRunning } = useVdfAcknowledgeLiftJob(() => poolId, entryId)

async function acknowledge(change: VdfOutsideTagChange) {
  entryId.value = change.id
  error.value = undefined

  try {
    emit('acknowledged', await run())
  } catch (runError) {
    error.value = runError instanceof Error ? runError.message : String(runError)
  }
}
</script>

<style lang="postcss" scoped>
.lifted {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem 1.6rem;
}

.error {
  color: var(--color-danger-txt-base);
}
</style>
