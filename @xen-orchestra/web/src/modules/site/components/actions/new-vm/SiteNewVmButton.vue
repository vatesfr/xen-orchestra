<template>
  <MenuItem icon="fa:plus" @click="goToNewVm()">
    {{ t('action:create-new-vm') }}
  </MenuItem>
</template>

<script lang="ts" setup>
import MenuItem from '@core/components/menu/MenuItem.vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

const { t } = useI18n()
const router = useRouter()

const goToNewVm = () => router.push({ name: '/vm/new' })
</script>
