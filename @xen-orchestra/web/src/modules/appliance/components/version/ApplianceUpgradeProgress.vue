<template>
  <div class="appliance-upgrade-progress">
    <UiLoader class="loader" />
    <div class="text">
      <span class="typo-h4">{{ t('appliance:updating-xo') }}</span>
      <span v-if="upgrade.start !== undefined" class="secondary typo-body-regular-small">
        {{ t('appliance:upgrade-started-at', { time: formatTime(upgrade.start) }) }}
      </span>
      <span class="secondary typo-body-regular-small">{{ phaseInfo }}</span>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { ApplianceUpgrade } from '@/modules/appliance/types/appliance-upgrade.type.ts'
import UiLoader from '@core/components/ui/loader/UiLoader.vue'
import { formatTime } from '@core/utils/time.util.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { upgrade } = defineProps<{
  upgrade: ApplianceUpgrade
}>()

const { t } = useI18n()

const phaseInfo = computed(() => {
  if (upgrade.phase === 'snapshot') {
    return t('appliance:upgrade-taking-snapshot')
  }

  return t('appliance:upgrade-restart-info')
})
</script>

<style lang="postcss" scoped>
.appliance-upgrade-progress {
  display: flex;
  align-items: center;
  gap: 2.4rem;

  .loader {
    flex-shrink: 0;
    font-size: 6.4rem;
    color: var(--color-brand-txt-base);
  }

  .text {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .secondary {
    color: var(--color-neutral-txt-secondary);
  }
}
</style>
