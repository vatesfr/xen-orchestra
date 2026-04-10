<template>
  <UiRadioButtonGroup
    :label="t('duplicate-vm:duplication-method')"
    accent="brand"
    :gap="uiStore.isSmall ? 'narrow' : 'wide'"
  >
    <UiRadioButton
      v-model="model"
      :disabled="vm.power_state !== VM_POWER_STATE.HALTED"
      accent="brand"
      value="fastClone"
    >
      {{ t('duplicate-vm:fast-clone') }}
    </UiRadioButton>
    <UiRadioButton v-model="model" accent="brand" value="fullCopy">
      {{ t('duplicate-vm:full-copy') }}
    </UiRadioButton>
    <template #info>
      <UiInfo accent="info">
        {{ t('duplicate-vm:fast-clone-available') }}
      </UiInfo>
    </template>
  </UiRadioButtonGroup>
</template>

<script setup lang="ts">
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiRadioButton from '@core/components/ui/radio-button/UiRadioButton.vue'
import UiRadioButtonGroup from '@core/components/ui/radio-button-group/UiRadioButtonGroup.vue'
import { useUiStore } from '@core/stores/ui.store.ts'
import { VM_POWER_STATE } from '@vates/types'
import { useI18n } from 'vue-i18n'

defineProps<{ vm: FrontXoVm }>()

const model = defineModel<'fastClone' | 'fullCopy'>({ required: true })

const { t } = useI18n()

const uiStore = useUiStore()
</script>
