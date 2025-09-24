<template>
  <MenuList class="backup-job-menu">
    <MenuItem>{{ t('run') }}</MenuItem>
    <MenuItem>{{ t('configuration') }}</MenuItem>
    <MenuItem>{{ t('backed-up-vms') }}</MenuItem>
    <MenuItem>{{ t('run') }}</MenuItem>
  </MenuList>
</template>

<script setup lang="ts">
import MenuItem from '@core/components/menu/MenuItem.vue'
import MenuList from '@core/components/menu/MenuList.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>
