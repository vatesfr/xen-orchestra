<template>
  <MenuItem icon="action:duplicate" @click="handleDuplicate()">
    {{ t('action:duplicate') }}
  </MenuItem>
</template>

<script setup lang="ts">
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

const { vm } = defineProps<{
  vm: FrontXoVm
}>()

const { t } = useI18n()

const router = useRouter()

const handleDuplicate = () => {
  router.push({ name: '/vm/[id]/duplicate', params: { id: vm.id } })
}
</script>
