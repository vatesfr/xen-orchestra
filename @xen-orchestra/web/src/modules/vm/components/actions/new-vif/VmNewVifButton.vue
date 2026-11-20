<template>
  <UiButton
    :busy="isCreatingVif"
    accent="brand"
    left-icon="fa:plus"
    size="medium"
    variant="tertiary"
    @click="openNewVifDrawer()"
  >
    {{ t('new-vif') }}
  </UiButton>
</template>

<script lang="ts" setup>
import { useNewVif } from '@/modules/vif/composables/use-new-vif.composable.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import UiButton from '@core/components/ui/button/UiButton.vue'
import { useI18n } from 'vue-i18n'

const { vm } = defineProps<{
  vm: FrontXoVm
}>()

const { t } = useI18n()

const { openNewVifDrawer, isCreatingVif } = useNewVif(() => vm)
</script>
