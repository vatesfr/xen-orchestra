<template>
  <NewVmSection :title="t('resource-management')" class="new-vm-resource-management-section">
    <div class="fields" :class="{ mobile: uiStore.isSmall }">
      <VtsInputWrapper :label="t('vcpus')">
        <UiInput v-model.number="vmState.vCPU" type="number" accent="neutral" />
      </VtsInputWrapper>
      <!-- TODO remove (GB) when we can use new selector -->
      <VtsInputWrapper :label="`${t('ram')} (GB)`">
        <UiInput v-model.number="ramInGiB" type="number" accent="neutral" />
      </VtsInputWrapper>
      <VtsInputWrapper :label="t('topology')">
        <UiInput v-model.trim="vmState.topology" accent="neutral" disabled />
      </VtsInputWrapper>
    </div>
  </NewVmSection>
</template>

<script lang="ts" setup>
import NewVmSection from '@/modules/vm/components/new/NewVmSection.vue'
import { useNewVmForm } from '@/modules/vm/form/new/use-new-vm-form.ts'
import { bytesToGiB, giBToBytes } from '@/modules/vm/utils/new-vm.util.ts'
import VtsInputWrapper from '@core/components/input-wrapper/VtsInputWrapper.vue'
import UiInput from '@core/components/ui/input/UiInput.vue'
import { useUiStore } from '@core/stores/ui.store.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const uiStore = useUiStore()

const { vmState } = useNewVmForm()

const ramInGiB = computed({
  get: () => bytesToGiB(vmState.ram),
  set: newValue => {
    vmState.ram = giBToBytes(newValue)
  },
})
</script>

<style lang="postcss" scoped>
.new-vm-resource-management-section {
  .fields {
    display: flex;
    gap: 8rem;

    &.mobile {
      flex-direction: column;
      gap: 2.4rem;
    }
  }
}
</style>
