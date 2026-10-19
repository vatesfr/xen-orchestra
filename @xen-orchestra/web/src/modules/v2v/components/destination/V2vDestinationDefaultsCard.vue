<template>
  <UiCard class="v2v-destination-defaults-card">
    <UiCardTitle>
      {{ t('global-defaults-for-name', { name: poolName }) }}
      <template #description>{{ t('v2v:global-defaults-info') }}</template>
    </UiCardTitle>
    <div class="fields">
      <FormSelect v-bind="srSelectBindings" />
      <FormSelect v-bind="networkSelectBindings" />
      <FormSelect v-bind="templateSelectBindings" />
    </div>
  </UiCard>
</template>

<script lang="ts" setup>
import type { V2vDestinationForm } from '@/modules/v2v/form/use-v2v-destination-form.ts'
import FormSelect from '@/shared/components/form/FormSelect.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  poolName: string
  srSelectBindings: V2vDestinationForm['srSelectBindings']['value']
  networkSelectBindings: V2vDestinationForm['networkSelectBindings']['value']
  templateSelectBindings: V2vDestinationForm['templateSelectBindings']['value']
}>()

const { t } = useI18n()
</script>

<style lang="postcss" scoped>
.v2v-destination-defaults-card {
  .fields {
    display: grid;
    gap: 1.2rem;

    @media (--medium-or-large) {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }
}
</style>
