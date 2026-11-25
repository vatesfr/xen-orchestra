<template>
  <div class="new-vm-environment-step" :class="{ mobile: uiStore.isSmall }">
    <VtsInputWrapper :id="fieldIds.pool" :label="t('pool')" :message="errorMessages.pool">
      <VtsSelect :id="poolSelectId" :accent="errors.pool === undefined ? 'neutral' : 'danger'" />
    </VtsInputWrapper>
    <VtsInputWrapper :id="fieldIds.template" :label="t('template')" :message="errorMessages.template">
      <VtsSelect :id="templateSelectId" :accent="errors.template === undefined ? 'neutral' : 'danger'" />
    </VtsInputWrapper>
  </div>
</template>

<script lang="ts" setup>
import { useNewVmForm } from '@/modules/vm/form/new/use-new-vm-form.ts'
import VtsInputWrapper from '@core/components/input-wrapper/VtsInputWrapper.vue'
import VtsSelect from '@core/components/select/VtsSelect.vue'
import { useFormSelect } from '@core/packages/form-select'
import { useUiStore } from '@core/stores/ui.store.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const uiStore = useUiStore()

const { vmState, pools, templates, errors, errorMessages, fieldIds } = useNewVmForm()

const poolId = computed({
  get: () => vmState.pool?.id,
  set: newPoolId => {
    vmState.pool = pools.value.find(pool => pool.id === newPoolId)
  },
})

const templateUuid = computed({
  get: () => vmState.new_vm_template?.uuid,
  set: newTemplateUuid => {
    vmState.new_vm_template = templates.value.find(template => template.uuid === newTemplateUuid)
  },
})

const { id: poolSelectId } = useFormSelect(pools, {
  searchable: true,
  required: true,
  model: poolId,
  option: {
    label: 'name_label',
    value: 'id',
  },
})

const { id: templateSelectId } = useFormSelect(templates, {
  searchable: true,
  required: true,
  disabled: () => vmState.pool === undefined,
  model: templateUuid,
  option: {
    id: 'uuid',
    label: 'name_label',
    value: 'uuid',
  },
})
</script>

<style lang="postcss" scoped>
.new-vm-environment-step {
  display: flex;
  gap: 4rem;

  & > * {
    flex: 1;
    min-width: 0;
    max-width: 40rem;
  }

  &.mobile {
    flex-direction: column;
    gap: 2.4rem;

    & > * {
      max-width: none;
    }
  }
}
</style>
