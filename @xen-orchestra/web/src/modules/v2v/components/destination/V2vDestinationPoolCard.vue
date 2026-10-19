<template>
  <UiCard class="v2v-destination-pool-card">
    <UiCardTitle>
      {{ t('destination-pool') }}
      <template #description>{{ t('v2v:destination-pool-info') }}</template>
    </UiCardTitle>
    <FormSelect v-bind="poolSelectBindings" class="pool-select">
      <template #option="{ option }">
        <VtsOption :option>
          <V2vPoolOption :label="option.properties.label" :counts="option.properties.counts" />
        </VtsOption>
      </template>
    </FormSelect>
  </UiCard>
</template>

<script lang="ts" setup>
import V2vPoolOption from '@/modules/v2v/components/destination/V2vPoolOption.vue'
import type { V2vDestinationForm } from '@/modules/v2v/form/use-v2v-destination-form.ts'
import FormSelect from '@/shared/components/form/FormSelect.vue'
import VtsOption from '@core/components/select/VtsOption.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  poolSelectBindings: V2vDestinationForm['poolSelectBindings']['value']
}>()

const { t } = useI18n()
</script>

<style lang="postcss" scoped>
.v2v-destination-pool-card {
  .pool-select {
    max-width: 56rem;
  }
}
</style>
