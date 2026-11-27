<template>
  <UiButton
    :busy="isEditingUpdateSettings"
    accent="brand"
    left-icon="action:edit"
    size="small"
    variant="tertiary"
    @click="openEditUpdateSettingsDrawer()"
  >
    {{ t('action:edit') }}
  </UiButton>
</template>

<script lang="ts" setup>
import { useEditUpdateSettings } from '@/modules/appliance/composables/use-edit-update-settings.composable.ts'
import UiButton from '@core/components/ui/button/UiButton.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const { openEditUpdateSettingsDrawer, isEditingUpdateSettings } = useEditUpdateSettings()
</script>
