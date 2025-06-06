<template>{{ t('loading-in-progress') }}</template>

<script lang="ts" setup>
import { usePoolStore } from '@/stores/xen-api/pool.store'
import { whenever } from '@vueuse/core'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

const { t } = useI18n()

const router = useRouter()

const { pool } = usePoolStore().subscribe()

whenever(
  () => pool.value?.uuid,
  poolUuid =>
    router.push({
      name: 'pool.dashboard',
      params: { uuid: poolUuid },
    }),
  { immediate: true }
)
</script>
