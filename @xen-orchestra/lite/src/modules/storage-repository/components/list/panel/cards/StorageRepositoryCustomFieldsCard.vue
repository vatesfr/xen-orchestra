<template>
  <UiPanelCard class="storage-repository-custom-fields-card">
    <UiCardTitle>
      {{ t('custom-fields') }}
    </UiCardTitle>
    <div class="content">
      <VtsStateHero
        v-if="Object.keys(customFields).length === 0"
        type="no-data"
        format="card"
        horizontal
        size="extra-small"
      >
        {{ t('no-custom-field-detected') }}
      </VtsStateHero>
      <VtsLabelValueList v-else :fields="customFields" />
    </div>
  </UiPanelCard>
</template>

<script lang="ts" setup>
import VtsLabelValueList from '@core/components/label-value-list/VtsLabelValueList.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiPanelCard from '@core/components/ui/panel-card/UiPanelCard.vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  customFields: Record<string, unknown>
}>()

const { t } = useI18n()
</script>

<style scoped lang="postcss">
.storage-repository-custom-fields-card {
  .content {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
}
</style>
