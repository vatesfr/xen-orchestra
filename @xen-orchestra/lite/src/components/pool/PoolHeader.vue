<template>
  <TitleBar :icon="faBuilding">
    {{ name }}
  </TitleBar>
</template>

<script lang="ts" setup>
import TitleBar from '@/components/TitleBar.vue'
import { usePoolStore } from '@/stores/xen-api/pool.store'
import { faBuilding } from '@fortawesome/free-regular-svg-icons'
import { computed } from 'vue'

const { pool } = usePoolStore().subscribe()

const name = computed(() => pool.value?.name_label ?? '...')
</script>
