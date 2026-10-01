<template>
  <VtsForm class="edit-vif-form" @submit="onSubmit()">
    <div class="row">
      <VifNetworkSelect v-bind="networkSelectBindings">
        <template #option="{ option }">
          <VtsOption :option>
            <span class="network-select-option">
              <VtsIcon :name="option.properties.icon" size="medium" />
              {{ option.properties.label }}
            </span>
          </VtsOption>
        </template>
      </VifNetworkSelect>
      <VifMacInput v-bind="macInputBindings" />
    </div>
    <div class="row">
      <VifRateLimitInput v-bind="rateLimitInputBindings" />
      <VifAllowedIpsTextarea v-bind="allowedIpsTextareaBindings" />
    </div>
    <div class="tx-checksumming">
      <VifTxChecksummingCheckbox v-bind="txChecksummingCheckboxBindings" />
    </div>
    <EditVifButtonsSection :cancel-to />
  </VtsForm>
</template>

<script setup lang="ts">
import type { XenApiVif } from '@/libs/xen-api/xen-api.types.ts'
import EditVifButtonsSection from '@/modules/vif/components/form/edit/EditVifButtonsSection.vue'
import VifAllowedIpsTextarea from '@/modules/vif/components/form/new/inputs/VifAllowedIpsTextarea.vue'
import VifMacInput from '@/modules/vif/components/form/new/inputs/VifMacInput.vue'
import VifNetworkSelect from '@/modules/vif/components/form/new/inputs/VifNetworkSelect.vue'
import VifRateLimitInput from '@/modules/vif/components/form/new/inputs/VifRateLimitInput.vue'
import VifTxChecksummingCheckbox from '@/modules/vif/components/form/new/inputs/VifTxChecksummingCheckbox.vue'
import { useEditVifForm } from '@/modules/vif/form/edit/use-edit-vif-form.ts'
import type { EditVifPayload } from '@/modules/vif/jobs/vif-edit.job.ts'
import VtsForm from '@core/components/form/VtsForm.vue'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsOption from '@core/components/select/VtsOption.vue'
import type { RouteLocationRaw } from 'vue-router'

const { vif } = defineProps<{
  vif: XenApiVif
  cancelTo: RouteLocationRaw
}>()

const emit = defineEmits<{
  save: [data: EditVifPayload]
}>()

const {
  networkSelectBindings,
  macInputBindings,
  rateLimitInputBindings,
  allowedIpsTextareaBindings,
  txChecksummingCheckboxBindings,
  validateAndBuildPayload,
} = useEditVifForm(vif)

async function onSubmit() {
  const payload = await validateAndBuildPayload()

  if (payload !== undefined) {
    emit('save', payload)
  }
}
</script>

<style lang="postcss" scoped>
.edit-vif-form {
  .row {
    display: flex;
    align-items: start;
    flex-direction: column;
    gap: 2.4rem;

    & > * {
      width: 100%;
      min-width: 0;
    }

    .network-select-option {
      display: flex;
      align-items: center;
      gap: 0.8rem;
    }

    @media (--medium-or-large) {
      flex-direction: row;
      gap: 8rem;
      max-width: 88rem;
    }

    &:not(:first-child) {
      margin-block-start: 2.4rem;
    }
  }

  .tx-checksumming {
    margin-block-start: 2.4rem;
  }
}
</style>
