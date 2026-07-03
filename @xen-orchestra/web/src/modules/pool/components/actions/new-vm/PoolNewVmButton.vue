<template>
  <MenuItem icon="action:add" @click="goToNewVm()">
    {{ t('new-vm') }}
  </MenuItem>
</template>

<script lang="ts" setup>
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

const { poolId } = defineProps<{ poolId: FrontXoPool['id'] }>()

const { t } = useI18n()
const router = useRouter()

const goToNewVm = () => router.push({ name: '/vm/new', query: { poolid: poolId } })
</script>
