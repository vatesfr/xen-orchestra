<template>
  <MenuList placement="bottom-end">
    <template #trigger="{ open }">
      <UiDropdownButton size="small" variant="primary" @click="open($event)">{{ t('third-parties') }}</UiDropdownButton>
    </template>
    <ThirdPartiesMenuItems />
  </MenuList>
</template>

<script lang="ts" setup>
import ThirdPartiesMenuItems from '@/modules/third-parties/components/ThirdPartiesMenuItems.vue'
import MenuList from '@core/components/menu/MenuList.vue'
import UiDropdownButton from '@core/components/ui/dropdown-button/UiDropdownButton.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>
