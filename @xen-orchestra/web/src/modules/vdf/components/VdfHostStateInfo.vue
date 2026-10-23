<template>
  <div class="vdf-host-state-info">
    <UiInfo :accent>{{ t(`firewall:host-state:${state}`) }}</UiInfo>
    <span v-if="withHint && hasHint" class="hint typo-body-regular-small">
      {{ t(`firewall:host-state:${state}:hint`) }}
    </span>
  </div>
</template>

<script lang="ts" setup>
import type { VdfHostState } from '@/modules/vdf/types.ts'
import UiInfo, { type InfoAccent } from '@core/components/ui/info/UiInfo.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { state } = defineProps<{
  state: VdfHostState
  // the next step, for a host that needs attention
  withHint?: boolean
}>()

const { t } = useI18n()

const accents: Record<VdfHostState, InfoAccent> = {
  'up-to-date': 'success',
  behind: 'warning',
  rejected: 'danger',
  stale: 'danger',
  unknown: 'muted',
  disabled: 'muted',
}

const accent = computed(() => accents[state])

const hasHint = computed(() => state === 'behind' || state === 'rejected' || state === 'stale' || state === 'unknown')
</script>

<style lang="postcss" scoped>
.vdf-host-state-info {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;

  .hint {
    color: var(--color-neutral-txt-secondary);
  }
}
</style>
