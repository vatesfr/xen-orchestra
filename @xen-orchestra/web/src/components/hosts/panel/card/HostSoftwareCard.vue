<template>
  <UiCard class="card-container">
    <UiCardTitle>
      {{ t('software') }}
    </UiCardTitle>
    <div class="content">
      <VtsCardRowKeyValue>
        <template #key>{{ t('version') }}</template>
        <template #value>{{ host.version }}</template>
        <template #addons>
          <VtsCopyButton :value="host.version" />
        </template>
      </VtsCardRowKeyValue>
    </div>
  </UiCard>
</template>

<script lang="ts" setup>
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import type { XoHost } from '@vates/types'
import { useI18n } from 'vue-i18n'

defineProps<{
  host: XoHost
}>()

const { t } = useI18n()
</script>

<style scoped lang="postcss">
.card-container {
  gap: 1.6rem;

  .content {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
}
</style>
