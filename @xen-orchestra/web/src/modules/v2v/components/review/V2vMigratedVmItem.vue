<template>
  <div class="v2v-migrated-vm-item">
    <V2vLaunchGroupVm>
      <template #name>{{ vm.name }}</template>
      <span v-if="vm.cutoverLabel !== undefined">{{ vm.cutoverLabel }}</span>
      <I18nT keypath="v2v:migrated-vm-details" scope="global" tag="span">
        <template #vm>
          <UiLink size="small" display-inline :to="{ name: '/vm/[id]/dashboard', params: { id: vm.importVm.id } }">
            {{ vm.importVm.name }}
          </UiLink>
        </template>
        <template #pool>{{ vm.poolName }}</template>
        <template #srs>{{ vm.srNames }}</template>
        <template #destinationPool>{{ destinationPoolName }}</template>
      </I18nT>
    </V2vLaunchGroupVm>
    <FormCheckbox
      :label="t('v2v:create-second-copy', { name: vm.name })"
      :model-value="vm.isConfirmed"
      @update:model-value="value => emit('confirm', value)"
    />
  </div>
</template>

<script lang="ts" setup>
import V2vLaunchGroupVm from '@/modules/v2v/components/review/V2vLaunchGroupVm.vue'
import type { V2vMigratedVm } from '@/modules/v2v/composables/use-v2v-review-step.composable.ts'
import FormCheckbox from '@/shared/components/form/FormCheckbox.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { I18nT, useI18n } from 'vue-i18n'

defineProps<{
  vm: V2vMigratedVm
  destinationPoolName: string
}>()

const emit = defineEmits<{
  confirm: [isConfirmed: boolean]
}>()

const { t } = useI18n()
</script>

<style lang="postcss" scoped>
.v2v-migrated-vm-item {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}
</style>
