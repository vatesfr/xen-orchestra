<template>
  <UiHeadBar icon="fa:city">
    {{ name }}
    <template #actions>
      <RouterLink :to="{ name: '/vm/new' }">
        <UiButton left-icon="fa:plus" variant="secondary" accent="brand" size="medium">{{ t('new-vm') }}</UiButton>
      </RouterLink>
    </template>
  </UiHeadBar>
</template>

<script lang="ts" setup>
import { usePoolStore } from '@/stores/xen-api/pool.store'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiHeadBar from '@core/components/ui/head-bar/UiHeadBar.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { pool } = usePoolStore().subscribe()

const { t } = useI18n()

const name = computed(() => pool.value?.name_label ?? '...')
</script>
