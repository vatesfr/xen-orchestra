<template>
  <UiButton size="medium" variant="tertiary" accent="brand" left-icon="action:edit" @click="goToVifEdit(vif)">
    {{ t('action:edit') }}
  </UiButton>
</template>

<script lang="ts" setup>
import { useVifEdit } from '@/modules/vif/composables/use-vif-edit.composable.ts'
import type { FrontXoVif } from '@/modules/vif/remote-resources/use-xo-vif-collection.ts'
import UiButton from '@core/components/ui/button/UiButton.vue'
import { useI18n } from 'vue-i18n'

const { vif } = defineProps<{
  vif: FrontXoVif
}>()

const { t } = useI18n()

const { goToVifEdit } = useVifEdit()
</script>
