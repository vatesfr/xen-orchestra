<template>
  <VtsForm class="v2v-destination-step" @submit="submit()">
    <V2vDestinationPoolCard :pool-select-bindings="form.poolSelectBindings" />
    <V2vExistingListInfo v-if="existingList !== undefined" v-bind="existingList" />
    <V2vDestinationDefaultsCard
      v-if="form.selectedPool !== undefined"
      :pool-name="form.selectedPool.name_label"
      :sr-select-bindings="form.srSelectBindings"
      :network-select-bindings="form.networkSelectBindings"
      :template-select-bindings="form.templateSelectBindings"
    />
    <div class="actions">
      <UiButton accent="brand" variant="secondary" size="medium" @click="back()">
        {{ t('action:back') }}
      </UiButton>
      <UiButton type="submit" accent="brand" variant="primary" size="medium">
        {{ existingList !== undefined ? t('action:continue-with-existing-list') : t('action:continue') }}
      </UiButton>
    </div>
  </VtsForm>
</template>

<script lang="ts" setup>
import V2vDestinationDefaultsCard from '@/modules/v2v/components/destination/V2vDestinationDefaultsCard.vue'
import V2vDestinationPoolCard from '@/modules/v2v/components/destination/V2vDestinationPoolCard.vue'
import V2vExistingListInfo from '@/modules/v2v/components/destination/V2vExistingListInfo.vue'
import { useV2vDestinationStep } from '@/modules/v2v/composables/use-v2v-destination-step.composable.ts'
import VtsForm from '@core/components/form/VtsForm.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const { form, existingList, submit, back } = useV2vDestinationStep()
</script>

<style lang="postcss" scoped>
.v2v-destination-step {
  display: flex;
  flex-direction: column;
  gap: 1.6rem;

  .actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.8rem;
  }
}
</style>
