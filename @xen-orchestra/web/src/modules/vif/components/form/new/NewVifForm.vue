<template>
  <div class="new-vif-form">
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
  </div>
</template>

<script setup lang="ts">
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import VifAllowedIpsTextarea from '@/modules/vif/components/form/new/inputs/VifAllowedIpsTextarea.vue'
import VifMacInput from '@/modules/vif/components/form/new/inputs/VifMacInput.vue'
import VifNetworkSelect from '@/modules/vif/components/form/new/inputs/VifNetworkSelect.vue'
import VifRateLimitInput from '@/modules/vif/components/form/new/inputs/VifRateLimitInput.vue'
import VifTxChecksummingCheckbox from '@/modules/vif/components/form/new/inputs/VifTxChecksummingCheckbox.vue'
import { useNewVifForm } from '@/modules/vif/form/new/use-new-vif-form.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsOption from '@core/components/select/VtsOption.vue'

const { vmId, poolId } = defineProps<{
  vmId: FrontXoVm['id']
  poolId: FrontXoPool['id']
}>()

const {
  networkSelectBindings,
  macInputBindings,
  rateLimitInputBindings,
  allowedIpsTextareaBindings,
  txChecksummingCheckboxBindings,
  validateAndBuildPayload,
} = useNewVifForm(
  () => vmId,
  () => poolId
)

defineExpose({
  validate: validateAndBuildPayload,
})
</script>

<style lang="postcss" scoped>
.new-vif-form {
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
