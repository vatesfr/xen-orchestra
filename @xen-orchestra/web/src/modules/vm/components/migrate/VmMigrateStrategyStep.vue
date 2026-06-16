<template>
  <div class="vm-migrate-strategy-step">
    <UiTitle>{{ t('storage-repository') }}</UiTitle>
    <VtsInputWrapper :label="t('vdi-placement-strategy')">
      <UiRadioButtonGroup accent="brand" gap="narrow" vertical>
        <UiRadioButton v-model="form.vdiStrategy" accent="brand" value="minimum">
          {{ t('vm-migrate-strategy-minimum') }}
        </UiRadioButton>
        <UiRadioButton v-model="form.vdiStrategy" accent="brand" value="force">
          {{ t('vm-migrate-strategy-force') }}
        </UiRadioButton>
      </UiRadioButtonGroup>
    </VtsInputWrapper>
    <VtsInputWrapper :label="t('selected-sr')">
      <VtsSelect :id="selectedSrSelectId" accent="brand" />
    </VtsInputWrapper>
    <UiTitle>{{ t('vifs') }}</UiTitle>
    <UiAlert accent="info">
      {{ t('vm-migrate-vifs-auto-mapping') }}
    </UiAlert>
  </div>
</template>

<script lang="ts" setup>
import { useXoSrCollection } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import { useVmMigrateForm } from '@/modules/vm/composables/use-vm-migrate-form.composable.ts'
import VtsInputWrapper from '@core/components/input-wrapper/VtsInputWrapper.vue'
import VtsSelect from '@core/components/select/VtsSelect.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiRadioButton from '@core/components/ui/radio-button/UiRadioButton.vue'
import UiRadioButtonGroup from '@core/components/ui/radio-button-group/UiRadioButtonGroup.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { useFormSelect } from '@core/packages/form-select'
import { computed, toRef } from 'vue'
import { useI18n } from 'vue-i18n'

const form = useVmMigrateForm()

const { t } = useI18n()

const { srs } = useXoSrCollection()

const destinationSrs = computed(() =>
  srs.value.filter(sr => sr.$pool === form.poolId && sr.content_type !== 'iso' && sr.size > 0)
)

const { id: selectedSrSelectId } = useFormSelect(destinationSrs, {
  searchable: true,
  required: true,
  model: toRef(form, 'selectedSrId'),
  option: { label: 'name_label', value: 'id' },
})
</script>

<style lang="postcss" scoped>
.vm-migrate-strategy-step {
  display: flex;
  flex-direction: column;
  gap: 1.6rem;
}
</style>
