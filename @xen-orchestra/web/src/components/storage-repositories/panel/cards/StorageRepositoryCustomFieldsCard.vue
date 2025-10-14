<template>
  <UiCard class="card-container">
    <UiCardTitle>
      {{ t('custom-fields') }}
    </UiCardTitle>
    <div class="content">
      <VtsLabelValueList :fields="customFields" />
    </div>
  </UiCard>
</template>

<script lang="ts" setup>
import VtsLabelValueList from '@core/components/label-value-list/VtsLabelValueList.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import { useI18n } from 'vue-i18n'

const { customFields } = defineProps<{
  customFields: Record<string, unknown>
}>()

const { t } = useI18n()
</script>

<style scoped lang="postcss">
.card-container {
  display: flex;
  flex-direction: column;
  gap: 1.6rem;

  .content {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
}
</style>
